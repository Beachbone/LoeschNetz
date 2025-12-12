<?php
// common.php - Gemeinsame Funktionen für die API

// Error-Handler für unerwartete Fehler
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    error_log("PHP Error: [$errno] $errstr in $errfile:$errline");
    if (!headers_sent()) {
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Internal Server Error',
            'debug' => [
                'message' => $errstr,
                'file' => basename($errfile),
                'line' => $errline
            ]
        ]);
    }
    exit(1);
});

// CORS Headers für lokale Entwicklung
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Sicherheits-Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Session-Konfiguration (aber NICHT automatisch starten!)
ini_set('session.cookie_httponly', 1);
// Nur secure bei HTTPS, sonst funktionieren Cookies nicht!
ini_set('session.cookie_secure', isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 1 : 0);
ini_set('session.cookie_samesite', 'Lax');  // Strict -> Lax für bessere Kompatibilität

// WICHTIG: session_start() wird NICHT hier aufgerufen!
// Session wird nur in requireAuth() gestartet wenn nötig

// Pfade zu den JSON-Dateien
// Versuche verschiedene Pfad-Varianten für maximale Kompatibilität
$possibleDataDirs = [
    __DIR__ . '/../data/',           // Standard: api/../data/
    __DIR__ . '/../../data/',        // Falls api in Unterordner
    $_SERVER['DOCUMENT_ROOT'] . '/data/',  // Absolut vom Webroot
];

$dataDir = null;
foreach ($possibleDataDirs as $dir) {
    if (is_dir($dir)) {
        $dataDir = $dir;
        break;
    }
}

if (!$dataDir) {
    // Fallback
    $dataDir = __DIR__ . '/../data/';
}

define('DATA_DIR', $dataDir);
define('USERS_FILE', DATA_DIR . 'users.json');
define('SESSIONS_FILE', DATA_DIR . 'sessions.json');
define('HYDRANTS_FILE', DATA_DIR . 'hydrants.json');
define('MARKER_TYPES_FILE', DATA_DIR . 'marker-types.json');
define('CONFIG_FILE', str_replace('/data/', '/', DATA_DIR) . 'config.json');

// Debug-Modus: Bei Fehler Pfade ausgeben
if (!file_exists(USERS_FILE)) {
    error_log('LoeschNetz API Error: users.json nicht gefunden!');
    error_log('Suchpfad: ' . USERS_FILE);
    error_log('DATA_DIR: ' . DATA_DIR);
    error_log('__DIR__: ' . __DIR__);
}

/**
 * JSON-Datei sicher lesen
 */
function readJson($filepath) {
    if (!file_exists($filepath)) {
        return null;
    }
    
    $content = file_get_contents($filepath);
    if ($content === false) {
        return null;
    }
    
    return json_decode($content, true);
}

/**
 * JSON-Datei sicher schreiben
 */
function writeJson($filepath, $data) {
    // Backup erstellen
    if (file_exists($filepath)) {
        $backup = $filepath . '.backup';
        copy($filepath, $backup);
    }
    
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
    // Atomar schreiben
    $temp = $filepath . '.tmp';
    if (file_put_contents($temp, $json, LOCK_EX) === false) {
        return false;
    }
    
    if (!rename($temp, $filepath)) {
        unlink($temp);
        return false;
    }
    
    return true;
}

/**
 * Success Response
 */
function sendSuccess($data = null, $message = null, $code = 200) {
    http_response_code($code);
    $response = ['success' => true];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    if ($message !== null) {
        $response['message'] = $message;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Error Response
 */
function sendError($message, $code = 400, $errorCode = null) {
    http_response_code($code);
    $response = [
        'success' => false,
        'error' => $message
    ];
    
    if ($errorCode !== null) {
        $response['code'] = $errorCode;
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    exit();
}

/**
 * Session prüfen - ist User eingeloggt?
 */
function requireAuth() {
    // Session starten falls noch nicht gestartet
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
        sendError('Nicht authentifiziert', 401, 'AUTH_REQUIRED');
    }
    
    // Session-Timeout prüfen
    $config = readJson(CONFIG_FILE);
    $timeout = $config['security']['sessionTimeout'] ?? 1800;
    
    if (isset($_SESSION['last_activity'])) {
        if (time() - $_SESSION['last_activity'] > $timeout) {
            session_destroy();
            sendError('Session abgelaufen', 401, 'SESSION_EXPIRED');
        }
    }
    
    // Last activity aktualisieren
    $_SESSION['last_activity'] = time();
    
    return [
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'is_admin' => $_SESSION['is_admin'] ?? false
    ];
}

/**
 * Admin-Berechtigung prüfen
 */
function requireAdmin() {
    $user = requireAuth();
    
    if (!$user['is_admin']) {
        sendError('Admin-Berechtigung erforderlich', 403, 'ADMIN_REQUIRED');
    }
    
    return $user;
}

/**
 * JSON-Input aus php://input lesen
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    if (empty($input)) {
        return [];
    }
    
    $data = json_decode($input, true);
    if ($data === null && json_last_error() !== JSON_ERROR_NONE) {
        sendError('Ungültiges JSON: ' . json_last_error_msg(), 400, 'INVALID_JSON');
    }
    
    return $data ?: [];
}

/**
 * Input validieren
 */
function validateInput($data, $required = []) {
    foreach ($required as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            sendError("Feld '$field' ist erforderlich", 400, 'VALIDATION_ERROR');
        }
    }
}

/**
 * UUID generieren
 */
function generateUuid() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

/**
 * ISO 8601 Timestamp
 */
function now() {
    return gmdate('Y-m-d\TH:i:s\Z');
}

/**
 * Rate Limiting (einfach)
 */
function checkRateLimit($identifier, $maxAttempts = 5, $timeWindow = 900) {
    $key = 'rate_limit_' . $identifier;
    
    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = ['count' => 0, 'first' => time()];
    }
    
    $data = $_SESSION[$key];
    
    // Reset nach Time Window
    if (time() - $data['first'] > $timeWindow) {
        $_SESSION[$key] = ['count' => 1, 'first' => time()];
        return true;
    }
    
    // Limit erreicht?
    if ($data['count'] >= $maxAttempts) {
        $remainingTime = $timeWindow - (time() - $data['first']);
        sendError(
            "Zu viele Versuche. Bitte warten Sie $remainingTime Sekunden.",
            429,
            'RATE_LIMIT_EXCEEDED'
        );
    }
    
    // Count erhöhen
    $_SESSION[$key]['count']++;

    return true;
}

/**
 * CSRF Token generieren
 */
function generateCsrfToken() {
    // Session starten falls noch nicht gestartet
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // Token bereits vorhanden?
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return $_SESSION['csrf_token'];
}

/**
 * CSRF Token abrufen
 */
function getCsrfToken() {
    // Session starten falls noch nicht gestartet
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    return $_SESSION['csrf_token'] ?? null;
}

/**
 * CSRF Token validieren
 */
function validateCsrfToken() {
    // Session starten falls noch nicht gestartet
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // Token aus Session
    $sessionToken = $_SESSION['csrf_token'] ?? null;

    if (!$sessionToken) {
        sendError('CSRF-Token fehlt in Session', 403, 'CSRF_TOKEN_MISSING');
    }

    // Token aus Request (Header oder POST)
    $requestToken = null;

    // 1. Versuch: X-CSRF-Token Header
    if (isset($_SERVER['HTTP_X_CSRF_TOKEN'])) {
        $requestToken = $_SERVER['HTTP_X_CSRF_TOKEN'];
    }
    // 2. Versuch: POST-Parameter
    elseif (isset($_POST['csrf_token'])) {
        $requestToken = $_POST['csrf_token'];
    }
    // 3. Versuch: JSON-Body
    else {
        $input = json_decode(file_get_contents('php://input'), true);
        if (isset($input['csrf_token'])) {
            $requestToken = $input['csrf_token'];
        }
    }

    if (!$requestToken) {
        sendError('CSRF-Token fehlt im Request', 403, 'CSRF_TOKEN_REQUIRED');
    }

    // Timing-safe Vergleich
    if (!hash_equals($sessionToken, $requestToken)) {
        sendError('Ungültiges CSRF-Token', 403, 'CSRF_TOKEN_INVALID');
    }

    return true;
}

/**
 * Aktuellen User aus Session holen
 */
function getCurrentUser() {
    // Session starten falls noch nicht gestartet
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
        return null;
    }

    return [
        'user_id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
        'is_admin' => $_SESSION['is_admin'] ?? false
    ];
}
