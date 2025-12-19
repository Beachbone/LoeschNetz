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

// ============================================================================
// CORS CONFIGURATION - Cross-Origin Resource Sharing
// ============================================================================
//
// IMPORTANT: This controls which websites can access your API
//
// Choose ONE of the presets below by uncommenting it:
//
// PRESET 1: SAME ORIGIN (Default - Most Secure)
// - Admin and API are on the same domain (e.g., yourdomain.com/admin + yourdomain.com/api)
// - No CORS headers needed - browser allows same-origin by default
// - RECOMMENDED for production if frontend and API are on same domain
//
$corsMode = 'SAME_ORIGIN';

// PRESET 2: LOCALHOST DEVELOPMENT
// - Use when testing locally (http://localhost or http://127.0.0.1)
// - Allows any localhost port (e.g., :8080, :3000)
//
// $corsMode = 'LOCALHOST';

// PRESET 3: SPECIFIC DOMAINS (Whitelist)
// - Use when admin and API are on different domains
// - Add your production and development domains to the whitelist below
//
// $corsMode = 'WHITELIST';
// $allowedOrigins = [
//     'https://yourdomain.com',           // Production domain
//     'https://admin.yourdomain.com',     // Admin subdomain
//     'http://localhost',                 // Local development
//     'http://localhost:8080'             // Local development with port
// ];

// PRESET 4: ALLOW ALL (⚠️ INSECURE - Development Only!)
// - Allows ANY website to access your API
// - ONLY use for testing/debugging
// - NEVER use in production!
//
// $corsMode = 'ALLOW_ALL';

// ============================================================================
// CORS Implementation (Do not modify below this line)
// ============================================================================

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$corsAllowed = false;

switch ($corsMode) {
    case 'SAME_ORIGIN':
        // No CORS headers needed - same domain access is automatic
        // This is the most secure option when frontend and API are on same domain
        $corsAllowed = false;
        break;

    case 'LOCALHOST':
        // Allow all localhost variations for development
        if (preg_match('/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/', $origin)) {
            $corsAllowed = true;
        }
        break;

    case 'WHITELIST':
        // Check if origin is in whitelist
        if (isset($allowedOrigins) && in_array($origin, $allowedOrigins)) {
            $corsAllowed = true;
        }
        break;

    case 'ALLOW_ALL':
        // WARNING: Security risk - allows ANY website to access your API
        error_log('⚠️ WARNING: CORS set to ALLOW_ALL - this is insecure!');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type');
        $corsAllowed = true;
        break;

    default:
        error_log('ERROR: Invalid CORS mode: ' . $corsMode);
        $corsAllowed = false;
}

// Apply CORS headers if allowed
if ($corsAllowed && $origin) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Credentials: true');
}

// Set default content type
header('Content-Type: application/json');

// Handle OPTIONS preflight requests
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

// Config-Datei suchen (mehrere Orte möglich)
$possibleConfigFiles = [
    dirname(rtrim(DATA_DIR, '/')) . '/config.json',  // Normalerweise eine Ebene über data/
    DATA_DIR . 'config.json',                        // Fallback: direkt in data/
    __DIR__ . '/../config.json',                     // Relativ zu api/
];

$configFile = null;
foreach ($possibleConfigFiles as $file) {
    if (file_exists($file)) {
        $configFile = $file;
        break;
    }
}

if (!$configFile) {
    // Wenn nicht gefunden, nutze Standard-Pfad (wird später Fehler werfen)
    $configFile = dirname(rtrim(DATA_DIR, '/')) . '/config.json';
}

define('CONFIG_FILE', $configFile);

// Debug-Modus: Bei Fehler Pfade ausgeben
if (!file_exists(USERS_FILE)) {
    error_log('LoeschNetz API Error: users.json nicht gefunden!');
    error_log('Suchpfad: ' . USERS_FILE);
    error_log('DATA_DIR: ' . DATA_DIR);
    error_log('__DIR__: ' . __DIR__);
}

// Config-File auch prüfen
if (!file_exists(CONFIG_FILE)) {
    error_log('LoeschNetz API Error: config.json nicht gefunden!');
    error_log('CONFIG_FILE: ' . CONFIG_FILE);
    error_log('Expected at: ' . dirname(rtrim(DATA_DIR, '/')) . '/config.json');
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
 * Aktuellen User abrufen
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
        'role' => $_SESSION['role'] ?? 'editor',
        'is_admin' => $_SESSION['is_admin'] ?? false
    ];
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
 * CSRF Token Validierung
 */
function validateCsrfToken() {
    // Session starten falls noch nicht gestartet
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }

    // CSRF Token aus Header holen
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;

    // Für FormData-Uploads kann Token auch im POST sein
    if (!$token && isset($_POST['csrf_token'])) {
        $token = $_POST['csrf_token'];
    }

    // Token prüfen
    if (!$token) {
        sendError('CSRF Token fehlt', 403, 'CSRF_TOKEN_MISSING');
    }

    if (!isset($_SESSION['csrf_token'])) {
        sendError('Keine Session vorhanden', 403, 'CSRF_TOKEN_INVALID');
    }

    if (!hash_equals($_SESSION['csrf_token'], $token)) {
        sendError('CSRF Token ungültig', 403, 'CSRF_TOKEN_INVALID');
    }

    return true;
}

/**
 * Log Rotation
 * Rotates log files when they exceed maxSizeKb and deletes old logs beyond retentionDays
 */
function rotateLogFile($logFile) {
    try {
        // Check if log file exists
        if (!file_exists($logFile)) {
            return;
        }

        // Get config for rotation settings
        $config = readJson(CONFIG_FILE);
        $maxSizeKb = $config['logging']['maxSizeKb'] ?? 1024;
        $retentionDays = $config['logging']['retentionDays'] ?? 365;

        // Get current file size in KB
        $fileSizeKb = filesize($logFile) / 1024;

        // Rotate if file exceeds max size
        if ($fileSizeKb >= $maxSizeKb) {
            // Create rotated filename with timestamp
            $timestamp = date('Y-m-d_His');
            $rotatedFile = $logFile . '.' . $timestamp;

            // Rename current log file
            if (rename($logFile, $rotatedFile)) {
                error_log("Log rotated: $logFile -> $rotatedFile");
            } else {
                error_log("Failed to rotate log: $logFile");
                return;
            }
        }

        // Clean up old rotated logs
        $logDir = dirname($logFile);
        $logBasename = basename($logFile);

        // Find all rotated log files
        $rotatedLogs = glob($logDir . '/' . $logBasename . '.*');

        if ($rotatedLogs) {
            $cutoffTime = time() - ($retentionDays * 86400); // 86400 seconds per day

            foreach ($rotatedLogs as $oldLog) {
                // Get file modification time
                $fileTime = filemtime($oldLog);

                // Delete if older than retention period
                if ($fileTime < $cutoffTime) {
                    if (unlink($oldLog)) {
                        error_log("Deleted old log: $oldLog (older than $retentionDays days)");
                    } else {
                        error_log("Failed to delete old log: $oldLog");
                    }
                }
            }
        }
    } catch (Exception $e) {
        error_log("Log rotation error: " . $e->getMessage());
    }
}

/**
 * CRUD Action Logging
 * Logs all Create, Read, Update, Delete operations with timestamp, user, and details
 */
function logCrudAction($action, $resource, $details = []) {
    try {
        // Check if logging is enabled
        $config = readJson(CONFIG_FILE);
        if (!isset($config['logging']['enabled']) || !$config['logging']['enabled']) {
            return; // Logging is disabled, skip
        }

        // Log file location
        $logFile = DATA_DIR . 'crud.log';

        // Rotate log file if needed
        rotateLogFile($logFile);

        // Get current user (or 'anonymous' if not logged in)
        $user = getCurrentUser();
        $username = $user ? $user['username'] : 'anonymous';

        // Build log entry
        $logEntry = [
            'timestamp' => now(),
            'user' => $username,
            'action' => $action,
            'resource' => $resource,
            'details' => $details,
            'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ];

        // Format as JSON line
        $logLine = json_encode($logEntry, JSON_UNESCAPED_UNICODE) . "\n";

        // Append to log file
        $result = file_put_contents($logFile, $logLine, FILE_APPEND | LOCK_EX);

        if ($result === false) {
            error_log("CRUD Log Error: Could not write to $logFile");
        }
    } catch (Exception $e) {
        error_log("CRUD Log Exception: " . $e->getMessage());
    }
}
