<?php
// api/photos.php - Foto-Verwaltung

require_once 'common.php';

$method = $_SERVER['REQUEST_METHOD'];
$endpoint = $_GET['endpoint'] ?? 'list';

// Router
switch ($endpoint) {
    case 'delete':
        if ($method === 'DELETE') {
            handleDelete();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    default:
        sendError('Endpoint nicht gefunden', 404);
}

/**
 * Foto löschen
 */
function handleDelete() {
    requireAdmin();

    // CSRF-Schutz
    validateCsrfToken();

    $input = getJsonInput();
    $hydrantId = $input['hydrant_id'] ?? null;
    $filename = $input['filename'] ?? null;
    
    if (!$hydrantId || !$filename) {
        sendError('hydrant_id und filename erforderlich', 400);
    }
    
    // Sicherheit: Filename validieren
    if (preg_match('/[^a-zA-Z0-9._-]/', $filename)) {
        sendError('Ungültiger Dateiname', 400);
    }
    
    // Dateipfade
    $photoPath = __DIR__ . "/../uploads/hydrants/{$hydrantId}/{$filename}";
    $thumbPath = __DIR__ . "/../uploads/hydrants/{$hydrantId}/thumbs/{$filename}";
    $recyclePath = __DIR__ . "/../uploads/hydrants/{$hydrantId}/recycle/{$filename}";
    $recycleThumbPath = __DIR__ . "/../uploads/hydrants/{$hydrantId}/recycle/thumbs/{$filename}";
    
    // Recycle-Verzeichnisse erstellen
    $recycleDir = dirname($recyclePath);
    $recycleThumbDir = dirname($recycleThumbPath);
    if (!is_dir($recycleDir)) mkdir($recycleDir, 0755, true);
    if (!is_dir($recycleThumbDir)) mkdir($recycleThumbDir, 0755, true);
    
    // In Recycle Bin verschieben
    $moved = false;
    if (file_exists($photoPath)) {
        rename($photoPath, $recyclePath);
        $moved = true;
    }
    if (file_exists($thumbPath)) {
        rename($thumbPath, $recycleThumbPath);
    }
    
    if (!$moved) {
        sendError('Datei nicht gefunden', 404);
    }
    
    // Aus Hydrant-Daten entfernen
    $hydrants = readJson(HYDRANTS_FILE);
    $updated = false;
    
    foreach ($hydrants['hydrants'] as &$hydrant) {
        if ($hydrant['id'] === $hydrantId) {
            if (isset($hydrant['photos'])) {
                $hydrant['photos'] = array_filter($hydrant['photos'], function($photo) use ($filename) {
                    return $photo['filename'] !== $filename;
                });
                $hydrant['photos'] = array_values($hydrant['photos']); // Re-index
                $updated = true;
            }
            break;
        }
    }
    
    if ($updated) {
        writeJson(HYDRANTS_FILE, $hydrants);
    }
    
    sendSuccess(['message' => 'Foto gelöscht']);
}
