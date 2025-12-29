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

    case 'download':
        if ($method === 'GET') {
            requireAuth();
            handleDownload();
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

    // JSON löschen
    if (unlink($filename)) {
        error_log("SNAPSHOTS - Snapshot vom $date gelöscht");

        // Zugehörige Bilder-ZIP löschen
        $imagesFile = SNAPSHOTS_DIR . "images_{$date}.zip";
        if (file_exists($imagesFile)) {
            unlink($imagesFile);
            error_log("SNAPSHOTS - Bilder-ZIP vom $date gelöscht");
        }

        sendSuccess(['message' => 'Snapshot gelöscht']);
    } else {
        sendError('Snapshot konnte nicht gelöscht werden', 500);
    }
}

/**
 * Snapshot herunterladen
 */
function handleDownload() {
    $date = $_GET['date'] ?? '';
    $type = $_GET['type'] ?? 'data'; // 'data' oder 'images'

    if (empty($date)) {
        sendError('Datum fehlt', 400);
    }

    // Dateiname basierend auf Typ bestimmen
    if ($type === 'images') {
        $filename = SNAPSHOTS_DIR . "images_{$date}.zip";
        $downloadName = "snapshot_images_{$date}.zip";
        $contentType = 'application/zip';
    } else {
        $filename = SNAPSHOTS_DIR . "hydrants_{$date}.json";
        $downloadName = "snapshot_data_{$date}.json";
        $contentType = 'application/json';
    }

    // Datei existiert?
    if (!file_exists($filename)) {
        sendError('Datei nicht gefunden', 404);
    }

    // Download-Headers setzen
    header('Content-Type: ' . $contentType);
    header('Content-Disposition: attachment; filename="' . $downloadName . '"');
    header('Content-Length: ' . filesize($filename));
    header('Cache-Control: no-cache, must-revalidate');
    header('Expires: 0');

    // Datei ausgeben
    readfile($filename);
    exit;
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
            'created_by' => $currentUser ? $currentUser['username'] : 'system',
            'images_backed_up' => false
        ],
        'hydrants' => $hydrants['hydrants'] ?? []
    ];

    // Snapshot speichern
    $result = writeJson($filename, $snapshotData);
    if (!$result) {
        throw new Exception('Konnte Snapshot nicht schreiben');
    }

    // Bilder-Backup erstellen (falls aktiviert)
    if ($config['snapshots']['backupImages'] ?? false) {
        try {
            backupImages($today);
            $snapshotData['_snapshot_meta']['images_backed_up'] = true;
            writeJson($filename, $snapshotData);
            error_log("SNAPSHOTS - Bilder gesichert für: $today");
        } catch (Exception $e) {
            error_log("SNAPSHOTS - Bilder-Backup Fehler: " . $e->getMessage());
            // Nicht kritisch, Snapshot ist trotzdem gültig
        }
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

        // JSON löschen
        if (file_exists($filename)) {
            unlink($filename);
            error_log("SNAPSHOTS - Rotiert (gelöscht): {$oldest['filename']}");
        }

        // Zugehörige Bilder-ZIP löschen
        if (!empty($oldest['images_filename'])) {
            $imagesFile = SNAPSHOTS_DIR . $oldest['images_filename'];
            if (file_exists($imagesFile)) {
                unlink($imagesFile);
                error_log("SNAPSHOTS - Rotiert (gelöscht): {$oldest['images_filename']}");
            }
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

            // Prüfen ob Bilder-Backup existiert
            $imagesZip = SNAPSHOTS_DIR . "images_{$date}.zip";
            $hasImages = file_exists($imagesZip);
            $imagesSize = $hasImages ? filesize($imagesZip) : 0;

            $snapshots[] = [
                'filename' => $filename,
                'date' => $date,
                'hydrant_count' => $meta['hydrant_count'] ?? count($data['hydrants'] ?? []),
                'size_bytes' => filesize($file),
                'created' => $meta['created'] ?? date('c', filemtime($file)),
                'created_by' => $meta['created_by'] ?? 'unknown',
                'has_images' => $hasImages,
                'images_size_bytes' => $imagesSize,
                'images_filename' => $hasImages ? "images_{$date}.zip" : null
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
 * Bilder sichern für Snapshot (als ZIP)
 */
function backupImages($date) {
    $uploadsDir = __DIR__ . '/../uploads/hydrants/';
    $zipFile = SNAPSHOTS_DIR . "images_{$date}.zip";

    // Uploads-Verzeichnis existiert nicht?
    if (!is_dir($uploadsDir)) {
        error_log("SNAPSHOTS - Uploads-Verzeichnis nicht gefunden: $uploadsDir");
        return 0; // Kein Fehler werfen, einfach überspringen
    }

    // Alte ZIP-Datei löschen falls vorhanden
    if (file_exists($zipFile)) {
        unlink($zipFile);
    }

    // ZIP-Archiv erstellen
    $zip = new ZipArchive();
    if ($zip->open($zipFile, ZipArchive::CREATE) !== true) {
        throw new Exception("Konnte ZIP-Datei nicht erstellen: $zipFile");
    }

    // Rekursiv Dateien zum ZIP hinzufügen
    $fileCount = addDirectoryToZip($zip, $uploadsDir, '');
    $zip->close();

    $zipSize = filesize($zipFile);
    error_log("SNAPSHOTS - $fileCount Dateien in ZIP gepackt (" . round($zipSize / 1024 / 1024, 2) . " MB)");

    return $fileCount;
}

/**
 * Verzeichnis rekursiv zu ZIP hinzufügen
 */
function addDirectoryToZip($zip, $sourceDir, $zipPath) {
    $fileCount = 0;

    if (!is_dir($sourceDir)) {
        return 0;
    }

    $dir = opendir($sourceDir);
    while (($file = readdir($dir)) !== false) {
        if ($file === '.' || $file === '..') {
            continue;
        }

        $sourcePath = $sourceDir . $file;
        $zipFilePath = $zipPath . $file;

        if (is_dir($sourcePath)) {
            // Unterverzeichnis hinzufügen
            $zip->addEmptyDir($zipFilePath);
            $fileCount += addDirectoryToZip($zip, $sourcePath . '/', $zipFilePath . '/');
        } else {
            // Datei hinzufügen
            if ($zip->addFile($sourcePath, $zipFilePath)) {
                $fileCount++;
            }
        }
    }
    closedir($dir);

    return $fileCount;
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
