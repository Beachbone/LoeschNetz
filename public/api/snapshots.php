<?php
// api/snapshots.php - Snapshot-Verwaltung

require_once 'common.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

error_log("SNAPSHOTS API - Method: $method, Action: $action");

// Snapshots-Verzeichnis
define('SNAPSHOTS_DIR', DATA_DIR . 'snapshots/');

// Snapshots-Verzeichnis erstellen falls nicht vorhanden
if (!is_dir(SNAPSHOTS_DIR)) {
    mkdir(SNAPSHOTS_DIR, 0755, true);
}

// Router
switch ($action) {
    case 'list':
        if ($method === 'GET') {
            handleList();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case 'preview':
        if ($method === 'GET') {
            handlePreview();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case 'create':
        if ($method === 'POST') {
            requireAuth();
            handleCreate();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case 'restore':
        if ($method === 'POST') {
            requireAdmin();
            handleRestore();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case 'delete':
        if ($method === 'DELETE') {
            requireAdmin();
            handleDelete();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    default:
        sendError('Unknown action: ' . $action, 404);
}

/**
 * Liste aller Snapshots
 */
function handleList() {
    requireAuth();
    
    $snapshots = getSnapshotList();
    
    sendSuccess([
        'snapshots' => $snapshots,
        'count' => count($snapshots)
    ]);
}

/**
 * Snapshot-Vorschau
 */
function handlePreview() {
    requireAuth();
    
    $date = $_GET['date'] ?? '';
    
    if (empty($date)) {
        sendError('Datum fehlt', 400);
    }
    
    $filename = SNAPSHOTS_DIR . "hydrants_{$date}.json";
    
    if (!file_exists($filename)) {
        sendError('Snapshot nicht gefunden', 404);
    }
    
    $data = readJson($filename);
    if (!$data) {
        sendError('Snapshot konnte nicht geladen werden', 500);
    }
    
    // Nur erste 10 Hydranten als Vorschau
    $preview = array_slice($data['hydrants'] ?? [], 0, 10);
    
    sendSuccess([
        'date' => $date,
        'hydrant_count' => count($data['hydrants'] ?? []),
        'preview' => $preview,
        'metadata' => $data['_snapshot_meta'] ?? null
    ]);
}

/**
 * Snapshot erstellen
 */
function handleCreate() {
    // CSRF-Schutz
    validateCsrfToken();

    $config = getConfig();

    // Snapshots aktiviert?
    if (!($config['snapshots']['enabled'] ?? true)) {
        sendError('Snapshots sind deaktiviert', 403);
    }
    
    try {
        $filename = createSnapshot();
        
        sendSuccess([
            'filename' => basename($filename),
            'message' => 'Snapshot erfolgreich erstellt'
        ]);
    } catch (Exception $e) {
        sendError('Snapshot-Erstellung fehlgeschlagen: ' . $e->getMessage(), 500);
    }
}

/**
 * Snapshot wiederherstellen
 */
function handleRestore() {
    // CSRF-Schutz
    validateCsrfToken();

    $input = getJsonInput();
    $date = $input['date'] ?? '';
    
    if (empty($date)) {
        sendError('Datum fehlt', 400);
    }
    
    $filename = SNAPSHOTS_DIR . "hydrants_{$date}.json";
    
    if (!file_exists($filename)) {
        sendError('Snapshot nicht gefunden', 404);
    }
    
    try {
        // 1. Aktuellen Stand als Backup sichern mit Timestamp
        $timestamp = date('Y-m-d_His');
        $backupFilename = SNAPSHOTS_DIR . "hydrants_{$timestamp}_backup.json";
        
        // Aktuelle Hydranten laden
        $currentHydrants = readJson(HYDRANTS_FILE);
        if (!$currentHydrants) {
            throw new Exception('Konnte aktuelle hydrants.json nicht laden');
        }
        
        // Backup-Daten mit Metadaten
        $currentUser = getCurrentUser();
        $backupData = [
            '_snapshot_meta' => [
                'created' => date('c'),
                'hydrant_count' => count($currentHydrants['hydrants'] ?? []),
                'created_by' => $currentUser ? $currentUser['username'] : 'system',
                'type' => 'pre-restore-backup',
                'restored_from' => $date
            ],
            'hydrants' => $currentHydrants['hydrants'] ?? []
        ];
        
        // Backup speichern
        $backupResult = writeJson($backupFilename, $backupData);
        if (!$backupResult) {
            throw new Exception('Konnte Backup nicht erstellen');
        }
        
        error_log("SNAPSHOTS - Pre-Restore Backup erstellt: $backupFilename");
        
        // 2. Snapshot laden
        $snapshotData = readJson($filename);
        if (!$snapshotData) {
            throw new Exception('Snapshot konnte nicht geladen werden');
        }
        
        // 3. Hydrants wiederherstellen
        $hydrants = $snapshotData['hydrants'] ?? [];
        
        $result = writeJson(HYDRANTS_FILE, ['hydrants' => $hydrants]);
        if (!$result) {
            throw new Exception('Konnte hydrants.json nicht schreiben');
        }
        
        error_log("SNAPSHOTS - Snapshot vom $date wiederhergestellt (" . count($hydrants) . " Hydranten)");
        
        sendSuccess([
            'message' => 'Snapshot erfolgreich wiederhergestellt',
            'hydrants_restored' => count($hydrants),
            'backup_created' => basename($backupFilename)
        ]);
        
    } catch (Exception $e) {
        error_log("SNAPSHOTS - Restore-Fehler: " . $e->getMessage());
        sendError('Wiederherstellung fehlgeschlagen: ' . $e->getMessage(), 500);
    }
}

/**
 * Snapshot löschen
 */
function handleDelete() {
    // CSRF-Schutz
    validateCsrfToken();

    $date = $_GET['date'] ?? '';

    if (empty($date)) {
        sendError('Datum fehlt', 400);
    }
    
    $filename = SNAPSHOTS_DIR . "hydrants_{$date}.json";
    
    if (!file_exists($filename)) {
        sendError('Snapshot nicht gefunden', 404);
    }
    
    if (unlink($filename)) {
        error_log("SNAPSHOTS - Snapshot vom $date gelöscht");
        sendSuccess(['message' => 'Snapshot gelöscht']);
    } else {
        sendError('Snapshot konnte nicht gelöscht werden', 500);
    }
}

/**
 * Snapshot erstellen (Helper-Funktion)
 */
function createSnapshot() {
    $config = getConfig();
    
    // Snapshots aktiviert?
    if (!($config['snapshots']['enabled'] ?? true)) {
        throw new Exception('Snapshots sind deaktiviert');
    }
    
    $today = date('Y-m-d');
    $filename = SNAPSHOTS_DIR . "hydrants_{$today}.json";
    
    // Bereits heute erstellt?
    if (file_exists($filename)) {
        // Existiert bereits, überschreiben
        error_log("SNAPSHOTS - Überschreibe existierenden Snapshot: $filename");
    }
    
    // Hydranten laden
    $hydrants = readJson(HYDRANTS_FILE);
    if (!$hydrants) {
        throw new Exception('Konnte hydrants.json nicht laden');
    }
    
    // Snapshot-Daten mit Metadaten
    $currentUser = getCurrentUser();
    $snapshotData = [
        '_snapshot_meta' => [
            'created' => date('c'),
            'hydrant_count' => count($hydrants['hydrants'] ?? []),
            'created_by' => $currentUser ? $currentUser['username'] : 'system'
        ],
        'hydrants' => $hydrants['hydrants'] ?? []
    ];
    
    // Snapshot speichern
    $result = writeJson($filename, $snapshotData);
    if (!$result) {
        throw new Exception('Konnte Snapshot nicht schreiben');
    }
    
    // Rotation durchführen
    rotateSnapshots($config['snapshots']['max_count'] ?? 20);
    
    error_log("SNAPSHOTS - Snapshot erstellt: $filename");
    
    return $filename;
}

/**
 * Snapshot-Rotation (älteste löschen)
 */
function rotateSnapshots($maxCount) {
    $snapshots = getSnapshotList();
    
    // Sortiere nach Datum (älteste zuerst)
    usort($snapshots, function($a, $b) {
        return strcmp($a['date'], $b['date']);
    });
    
    // Zu viele? Älteste löschen
    while (count($snapshots) > $maxCount) {
        $oldest = array_shift($snapshots);
        $filename = SNAPSHOTS_DIR . $oldest['filename'];
        
        if (file_exists($filename)) {
            unlink($filename);
            error_log("SNAPSHOTS - Rotiert (gelöscht): {$oldest['filename']}");
        }
    }
}

/**
 * Liste aller Snapshots holen
 */
function getSnapshotList() {
    $snapshots = [];
    $files = glob(SNAPSHOTS_DIR . 'hydrants_*.json');
    
    foreach ($files as $file) {
        $filename = basename($file);
        
        // Datum aus Dateiname extrahieren
        if (preg_match('/hydrants_(\d{4}-\d{2}-\d{2})\.json/', $filename, $matches)) {
            $date = $matches[1];
            
            // Snapshot-Daten laden für Metadaten
            $data = readJson($file);
            $meta = $data['_snapshot_meta'] ?? [];
            
            $snapshots[] = [
                'filename' => $filename,
                'date' => $date,
                'hydrant_count' => $meta['hydrant_count'] ?? count($data['hydrants'] ?? []),
                'size_bytes' => filesize($file),
                'created' => $meta['created'] ?? date('c', filemtime($file)),
                'created_by' => $meta['created_by'] ?? 'unknown'
            ];
        }
    }
    
    // Sortiere nach Datum (neueste zuerst)
    usort($snapshots, function($a, $b) {
        return strcmp($b['date'], $a['date']);
    });
    
    return $snapshots;
}

/**
 * Config laden
 */
function getConfig() {
    $config = readJson(CONFIG_FILE);
    if (!$config) {
        return ['snapshots' => ['enabled' => true, 'max_count' => 20]];
    }
    return $config;
}
