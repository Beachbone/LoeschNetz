<?php
// auth.php - Authentication Endpoints

require_once 'common.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '/';

// DEBUG: Logging für Troubleshooting
error_log("AUTH.PHP DEBUG - Method: $method, PATH_INFO: " . ($path ?? 'null') . ", GET endpoint: " . ($_GET['endpoint'] ?? 'null'));

// Fallback: Query-Parameter wenn PATH_INFO nicht funktioniert
// WICHTIG: Auch leere Strings prüfen!
if (($path === '/' || $path === '') && isset($_GET['endpoint'])) {
    $path = '/' . $_GET['endpoint'];
    error_log("AUTH.PHP DEBUG - Using endpoint from GET: $path");
}

// Router
switch ($path) {
    case '/login':
        if ($method === 'POST') {
            handleLogin();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case '/logout':
        if ($method === 'POST') {
            handleLogout();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case '/check':
        if ($method === 'GET') {
            handleCheck();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case '/change-password':
        if ($method === 'POST') {
            handleChangePassword();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case '/':
    case '':
        // Hilfe anzeigen wenn kein Endpoint angegeben
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Auth API',
            'endpoints' => [
                'POST /api/auth.php/login' => 'Login',
                'POST /api/auth.php/logout' => 'Logout',
                'GET /api/auth.php/check' => 'Session Check'
            ],
            'version' => '1.0',
            'debug' => [
                'method' => $method,
                'path_info' => $_SERVER['PATH_INFO'] ?? 'NULL',
                'get_endpoint' => $_GET['endpoint'] ?? 'NULL',
                'computed_path' => $path,
                'query_string' => $_SERVER['QUERY_STRING'] ?? 'NULL'
            ]
        ], JSON_PRETTY_PRINT);
        exit();
        
    default:
        sendError('Endpoint not found: ' . $path, 404);
}

/**
 * POST /api/auth/login
 * Login mit Username und Passwort
 */
function handleLogin() {
    // Session Cookie-Parameter VOR session_start() setzen!
    $isSecure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';
    session_set_cookie_params([
        'lifetime' => 0,  // Session-Cookie (bis Browser geschlossen wird)
        'path' => '/',
        'domain' => '',
        'secure' => $isSecure,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    
    // Session starten falls noch nicht gestartet
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Rate Limiting
    checkRateLimit('login', 5, 900);
    
    // Input lesen
    $input = json_decode(file_get_contents('php://input'), true);
    validateInput($input, ['username', 'password']);
    
    $username = trim($input['username']);
    $password = $input['password'];
    
    // Users laden
    $usersData = readJson(USERS_FILE);
    if (!$usersData || !isset($usersData['users'])) {
        sendError('System-Fehler: Users-Datei nicht gefunden', 500, 'SYSTEM_ERROR');
    }
    
    // User suchen
    $user = null;
    foreach ($usersData['users'] as $u) {
        if ($u['username'] === $username) {
            $user = $u;
            break;
        }
    }
    
    if (!$user) {
        sendError('Ungültige Anmeldedaten', 401, 'AUTH_FAILED');
    }
    
    // Account gesperrt?
    if (!empty($user['locked_until']) && strtotime($user['locked_until']) > time()) {
        $remaining = strtotime($user['locked_until']) - time();
        $minutes = ceil($remaining / 60);
        sendError(
            "Account gesperrt für $minutes Minuten",
            403,
            'ACCOUNT_LOCKED'
        );
    }
    
    // Passwort prüfen
    if (!password_verify($password, $user['password_hash'])) {
        // Failed attempt erhöhen
        updateFailedLogin($user['id']);
        sendError('Ungültige Anmeldedaten', 401, 'AUTH_FAILED');
    }
    
    // Login erfolgreich - Failed attempts zurücksetzen
    resetFailedLogin($user['id']);
    
    // Session erstellen
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['username'];
    $_SESSION['role'] = ($user['is_admin'] ?? false) ? 'admin' : 'editor';
    $_SESSION['is_admin'] = $user['is_admin'] ?? false;
    $_SESSION['force_password_change'] = $user['force_password_change'] ?? false;
    $_SESSION['last_activity'] = time();

    // CSRF Token generieren
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    
    // Session in sessions.json speichern
    saveSession($user);
    
    // Last login aktualisieren
    updateLastLogin($user['id']);
    
    // Response
    $config = readJson(CONFIG_FILE);
    $timeout = $config['security']['sessionTimeout'] ?? 1800;
    
    sendSuccess([
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'is_admin' => $user['is_admin']
        ],
        'session_expires' => date('Y-m-d\TH:i:s\Z', time() + $timeout),
        'force_password_change' => $user['force_password_change'] ?? false,
        'csrf_token' => $_SESSION['csrf_token']
    ], 'Login erfolgreich');
}

/**
 * POST /api/auth/logout
 * Logout
 */
function handleLogout() {
    // Session starten falls noch nicht gestartet
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (isset($_SESSION['user_id'])) {
        removeSession($_SESSION['user_id']);
    }
    
    // Session-Variablen löschen
    $_SESSION = [];
    
    // Session Cookie löschen
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/');
    }
    
    session_destroy();
    sendSuccess(null, 'Erfolgreich abgemeldet');
}

/**
 * GET /api/auth/check
 * Session prüfen
 */
function handleCheck() {
    $user = requireAuth();

    // CSRF Token generieren falls nicht vorhanden
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    // Andere aktive Sessions finden
    $sessions = readJson(SESSIONS_FILE);
    $activeSessions = [];

    if ($sessions && isset($sessions['sessions'])) {
        foreach ($sessions['sessions'] as $session) {
            if ($session['user_id'] !== $user['user_id']) {
                // Andere User interessieren nicht
                continue;
            }

            // Eigene Session interessiert nicht
            if ($session['session_id'] === session_id()) {
                continue;
            }

            // Ist die Session noch aktiv? (max. 30min)
            $lastActivity = strtotime($session['last_activity']);
            if (time() - $lastActivity < 1800) {
                $activeSessions[] = [
                    'username' => $session['username'],
                    'last_activity' => $session['last_activity']
                ];
            }
        }
    }

    sendSuccess([
        'logged_in' => true,
        'user' => [
            'id' => $user['user_id'],
            'username' => $user['username'],
            'is_admin' => $user['is_admin'],
            'force_password_change' => $_SESSION['force_password_change'] ?? false
        ],
        'csrf_token' => $_SESSION['csrf_token'],
        'active_sessions' => $activeSessions
    ]);
}

/**
 * Failed Login erhöhen
 */
function updateFailedLogin($userId) {
    $usersData = readJson(USERS_FILE);
    
    foreach ($usersData['users'] as &$user) {
        if ($user['id'] === $userId) {
            $user['failed_login_attempts'] = ($user['failed_login_attempts'] ?? 0) + 1;
            
            // Nach 5 Fehlversuchen: 15 Min sperren
            if ($user['failed_login_attempts'] >= 5) {
                $user['locked_until'] = date('Y-m-d\TH:i:s\Z', time() + 900);
            }
            
            break;
        }
    }
    
    writeJson(USERS_FILE, $usersData);
}

/**
 * Failed Login zurücksetzen
 */
function resetFailedLogin($userId) {
    $usersData = readJson(USERS_FILE);
    
    foreach ($usersData['users'] as &$user) {
        if ($user['id'] === $userId) {
            $user['failed_login_attempts'] = 0;
            $user['locked_until'] = null;
            break;
        }
    }
    
    writeJson(USERS_FILE, $usersData);
}

/**
 * Last Login aktualisieren
 */
function updateLastLogin($userId) {
    $usersData = readJson(USERS_FILE);
    
    foreach ($usersData['users'] as &$user) {
        if ($user['id'] === $userId) {
            $user['last_login'] = now();
            break;
        }
    }
    
    writeJson(USERS_FILE, $usersData);
}

/**
 * Session speichern
 */
function saveSession($user) {
    $sessionsData = readJson(SESSIONS_FILE);
    if (!$sessionsData) {
        $sessionsData = ['version' => '1.0', 'sessions' => []];
    }
    
    $session = [
        'session_id' => session_id(),
        'user_id' => $user['id'],
        'username' => $user['username'],
        'created_at' => now(),
        'last_activity' => now(),
        'expires_at' => date('Y-m-d\TH:i:s\Z', time() + 1800),
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown'
    ];
    
    $sessionsData['sessions'][] = $session;
    writeJson(SESSIONS_FILE, $sessionsData);
}

/**
 * Session entfernen
 */
function removeSession($userId) {
    $sessionsData = readJson(SESSIONS_FILE);
    if (!$sessionsData || !isset($sessionsData['sessions'])) {
        return;
    }
    
    $sessionId = session_id();
    $sessionsData['sessions'] = array_filter(
        $sessionsData['sessions'],
        function($s) use ($sessionId) {
            return $s['session_id'] !== $sessionId;
        }
    );
    
    // Array neu indizieren
    $sessionsData['sessions'] = array_values($sessionsData['sessions']);
    
    writeJson(SESSIONS_FILE, $sessionsData);
}

/**
 * Passwort ändern
 */
function handleChangePassword() {
    error_log("=== CHANGE PASSWORD START ===");
    
    try {
        $user = requireAuth();
        error_log("User authenticated: " . $user['user_id']);
        
        $input = getJsonInput();
        error_log("Input received: " . json_encode(array_keys($input)));
        
        $currentPassword = $input['current_password'] ?? '';
        $newPassword = $input['new_password'] ?? '';
        
        // Validierung
        if (empty($currentPassword) || empty($newPassword)) {
            sendError('Aktuelles und neues Passwort erforderlich', 400);
        }
        
        if (strlen($newPassword) < 8) {
            sendError('Neues Passwort muss mindestens 8 Zeichen haben', 400);
        }
        
        // Users laden
        error_log("Loading users from: " . USERS_FILE);
        $data = readJson(USERS_FILE);
        if (!$data) {
            error_log("ERROR: Could not load users.json");
            sendError('Konnte Benutzer nicht laden', 500);
        }
        error_log("Users loaded: " . count($data['users']) . " users");
        
        // User finden
        $userIndex = null;
        foreach ($data['users'] as $index => $u) {
            if ($u['id'] === $user['user_id']) {
                $userIndex = $index;
                break;
            }
        }
        
        if ($userIndex === null) {
            error_log("ERROR: User not found in users.json");
            sendError('Benutzer nicht gefunden', 404);
        }
        error_log("User found at index: $userIndex");
        
        // Aktuelles Passwort prüfen
        error_log("Verifying current password");
        if (!password_verify($currentPassword, $data['users'][$userIndex]['password_hash'])) {
            error_log("ERROR: Current password incorrect");
            sendError('Aktuelles Passwort ist falsch', 401);
        }
        
        // Neues Passwort setzen
        error_log("Setting new password");
        $data['users'][$userIndex]['password_hash'] = password_hash($newPassword, PASSWORD_DEFAULT);
        $data['users'][$userIndex]['force_password_change'] = false;
        $data['users'][$userIndex]['password_changed_at'] = date('Y-m-d\TH:i:s\Z');
        
        // Speichern
        error_log("Saving users.json");
        if (!writeJson(USERS_FILE, $data)) {
            error_log("ERROR: Could not save users.json");
            sendError('Konnte Passwort nicht speichern', 500);
        }
        
        // Session aktualisieren
        $_SESSION['force_password_change'] = false;
        
        error_log("=== CHANGE PASSWORD SUCCESS ===");
        sendSuccess([
            'message' => 'Passwort erfolgreich geändert'
        ]);
    } catch (Exception $e) {
        error_log("EXCEPTION in handleChangePassword: " . $e->getMessage());
        error_log("Stack trace: " . $e->getTraceAsString());
        sendError('Interner Fehler: ' . $e->getMessage(), 500);
    }
}
