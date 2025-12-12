<?php
// api/config.php - Config-Verwaltung

require_once 'common.php';

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = $_GET['endpoint'] ?? 'get';

error_log("CONFIG API - Method: $method, Endpoint: $endpoint");

// Public Zugriff erlauben (nur Marker-Typen)
if (isset($_GET['public']) && $_GET['public'] === 'true') {
    // Versuche marker-types.json zu lesen
    $markerTypesFile = __DIR__ . '/../data/marker-types.json';
    $markerTypes = [];
    
    if (file_exists($markerTypesFile)) {
        $markerTypesData = readJson($markerTypesFile);
        $markerTypes = $markerTypesData['types'] ?? []; // 'types' nicht 'marker_types'
    }
    
    sendSuccess([
        'marker_types' => $markerTypes
    ]);
    exit;
}

// Router
switch ($endpoint) {
    case 'get':
        if ($method === 'GET') {
            handleGet();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case 'update':
        if ($method === 'PUT') {
            handleUpdate();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    default:
        sendError('Endpoint nicht gefunden: ' . $endpoint, 404);
}

/**
 * Config laden
 */
function handleGet() {
    if (!file_exists(CONFIG_FILE)) {
        error_log('CONFIG.PHP ERROR - File not found: ' . CONFIG_FILE);
        error_log('CONFIG.PHP ERROR - Working directory: ' . getcwd());
        error_log('CONFIG.PHP ERROR - __DIR__: ' . __DIR__);
        sendError('Config-Datei nicht gefunden: ' . basename(CONFIG_FILE), 500);
    }
    
    $config = readJson(CONFIG_FILE);
    if (!$config) {
        error_log('CONFIG.PHP ERROR - readJson failed for: ' . CONFIG_FILE);
        sendError('Konnte Config nicht laden (JSON invalid?)', 500);
    }
    
    sendSuccess($config);
}

/**
 * Config aktualisieren
 */
function handleUpdate() {
    requireAdmin();

    // CSRF-Schutz
    validateCsrfToken();

    $input = getJsonInput();
    
    if (empty($input)) {
        sendError('Keine Daten empfangen', 400);
    }
    
    // Aktuelle Config laden
    $currentConfig = readJson(CONFIG_FILE);
    if (!$currentConfig) {
        sendError('Konnte Config nicht laden', 500);
    }
    
    // Backup erstellen
    $backupFile = str_replace('.json', '.backup.json', CONFIG_FILE);
    if (!writeJson($backupFile, $currentConfig)) {
        error_log("⚠️ Konnte Backup nicht erstellen");
    }
    
    // Neue Config validieren und mergen
    try {
        $newConfig = validateAndMergeConfig($currentConfig, $input);
    } catch (Exception $e) {
        sendError('Validierungsfehler: ' . $e->getMessage(), 400);
    }
    
    // Speichern
    if (!writeJson(CONFIG_FILE, $newConfig)) {
        // Backup wiederherstellen
        if (file_exists($backupFile)) {
            copy($backupFile, CONFIG_FILE);
        }
        sendError('Konnte Config nicht speichern', 500);
    }
    
    error_log("✅ Config erfolgreich aktualisiert");
    
    sendSuccess([
        'message' => 'Einstellungen erfolgreich gespeichert',
        'config' => $newConfig
    ]);
}

/**
 * Config validieren und mergen
 */
function validateAndMergeConfig($current, $new) {
    // Version beibehalten
    $merged = $current;
    
    // MAP
    if (isset($new['map'])) {
        if (isset($new['map']['center']) && is_array($new['map']['center'])) {
            if (count($new['map']['center']) === 2) {
                $merged['map']['center'] = [
                    floatval($new['map']['center'][0]),
                    floatval($new['map']['center'][1])
                ];
            }
        }
        
        if (isset($new['map']['zoom'])) {
            $zoom = intval($new['map']['zoom']);
            if ($zoom < 1 || $zoom > 20) {
                throw new Exception('Zoom muss zwischen 1 und 20 liegen');
            }
            $merged['map']['zoom'] = $zoom;
        }
        
        if (isset($new['map']['bounds']) && is_array($new['map']['bounds'])) {
            $merged['map']['bounds'] = $new['map']['bounds'];
        }
        
        if (isset($new['map']['minZoom'])) {
            $merged['map']['minZoom'] = intval($new['map']['minZoom']);
        }
        
        if (isset($new['map']['maxZoom'])) {
            $merged['map']['maxZoom'] = intval($new['map']['maxZoom']);
        }
        
        if (isset($new['map']['locationZoom'])) {
            $merged['map']['locationZoom'] = intval($new['map']['locationZoom']);
        }
        
        // Tile Servers
        if (isset($new['map']['tileServers'])) {
            $merged['map']['tileServers'] = $new['map']['tileServers'];
        }
    }
    
    // ORGANIZATION
    if (isset($new['organization'])) {
        if (isset($new['organization']['name'])) {
            $merged['organization']['name'] = trim($new['organization']['name']);
        }
        if (isset($new['organization']['shortName'])) {
            $merged['organization']['shortName'] = trim($new['organization']['shortName']);
        }
        if (isset($new['organization']['logo'])) {
            $merged['organization']['logo'] = trim($new['organization']['logo']);
        }
    }
    
    // THEME
    if (isset($new['theme'])) {
        if (isset($new['theme']['primaryColor'])) {
            if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $new['theme']['primaryColor'])) {
                throw new Exception('Ungültige Farbe für primaryColor');
            }
            $merged['theme']['primaryColor'] = $new['theme']['primaryColor'];
        }
        if (isset($new['theme']['backgroundColor'])) {
            if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $new['theme']['backgroundColor'])) {
                throw new Exception('Ungültige Farbe für backgroundColor');
            }
            $merged['theme']['backgroundColor'] = $new['theme']['backgroundColor'];
        }
    }
    
    // LEGAL
    if (isset($new['legal'])) {
        if (isset($new['legal']['impressumUrl'])) {
            $merged['legal']['impressumUrl'] = trim($new['legal']['impressumUrl']);
        }
        if (isset($new['legal']['datenschutzUrl'])) {
            $merged['legal']['datenschutzUrl'] = trim($new['legal']['datenschutzUrl']);
        }
    }
    
    // SECURITY
    if (isset($new['security'])) {
        if (isset($new['security']['autoLogoutMinutes'])) {
            $minutes = intval($new['security']['autoLogoutMinutes']);
            if ($minutes < 1 || $minutes > 1440) {
                throw new Exception('autoLogoutMinutes muss zwischen 1 und 1440 liegen');
            }
            $merged['security']['autoLogoutMinutes'] = $minutes;
        }
        if (isset($new['security']['sessionTimeout'])) {
            $timeout = intval($new['security']['sessionTimeout']);
            if ($timeout < 60 || $timeout > 86400) {
                throw new Exception('sessionTimeout muss zwischen 60 und 86400 liegen');
            }
            $merged['security']['sessionTimeout'] = $timeout;
        }
    }
    
    // LOGGING
    if (isset($new['logging'])) {
        if (isset($new['logging']['level'])) {
            $level = intval($new['logging']['level']);
            if ($level < 0 || $level > 4) {
                throw new Exception('Log-Level muss zwischen 0 und 4 liegen');
            }
            $merged['logging']['level'] = $level;
        }
        if (isset($new['logging']['maxSizeKb'])) {
            $merged['logging']['maxSizeKb'] = intval($new['logging']['maxSizeKb']);
        }
        if (isset($new['logging']['retentionDays'])) {
            $merged['logging']['retentionDays'] = intval($new['logging']['retentionDays']);
        }
    }
    
    // SNAPSHOTS
    if (isset($new['snapshots'])) {
        if (isset($new['snapshots']['enabled'])) {
            $merged['snapshots']['enabled'] = (bool)$new['snapshots']['enabled'];
        }
        if (isset($new['snapshots']['maxCount'])) {
            $merged['snapshots']['maxCount'] = intval($new['snapshots']['maxCount']);
        }
        if (isset($new['snapshots']['autoCreate'])) {
            $merged['snapshots']['autoCreate'] = (bool)$new['snapshots']['autoCreate'];
        }
    }
    
    // PHOTOS
    if (isset($new['photos'])) {
        if (isset($new['photos']['maxWidth'])) {
            $merged['photos']['maxWidth'] = intval($new['photos']['maxWidth']);
        }
        if (isset($new['photos']['maxHeight'])) {
            $merged['photos']['maxHeight'] = intval($new['photos']['maxHeight']);
        }
        if (isset($new['photos']['quality'])) {
            $quality = intval($new['photos']['quality']);
            if ($quality < 1 || $quality > 100) {
                throw new Exception('Bild-Qualität muss zwischen 1 und 100 liegen');
            }
            $merged['photos']['quality'] = $quality;
        }
        if (isset($new['photos']['maxSizeKb'])) {
            $merged['photos']['maxSizeKb'] = intval($new['photos']['maxSizeKb']);
        }
    }
    
    return $merged;
}
