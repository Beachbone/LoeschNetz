<?php
// api/migrate-photos.php - Migriert alte photo-Felder zu photos[]

require_once 'common.php';

requireAdmin();

$hydrants = readJson(HYDRANTS_FILE);
$migrated = 0;
$errors = [];

foreach ($hydrants['hydrants'] as &$hydrant) {
    // Hat altes photo-Feld?
    if (isset($hydrant['photo']) && !empty($hydrant['photo'])) {
        $oldPhoto = $hydrant['photo'];
        
        // Prüfe beide mögliche Quellen
        $oldPath1 = __DIR__ . '/../pictures_app/' . $oldPhoto;
        $oldPath2 = __DIR__ . '/../uploads/' . $oldPhoto;
        
        $oldPath = null;
        if (file_exists($oldPath1)) {
            $oldPath = $oldPath1;
        } elseif (file_exists($oldPath2)) {
            $oldPath = $oldPath2;
        }
        
        if ($oldPath) {
            // Zielverzeichnis erstellen
            $targetDir = __DIR__ . '/../uploads/hydrants/' . $hydrant['id'] . '/';
            $thumbDir = $targetDir . 'thumbs/';
            
            if (!is_dir($targetDir)) mkdir($targetDir, 0755, true);
            if (!is_dir($thumbDir)) mkdir($thumbDir, 0755, true);
            
            // Datei kopieren
            $newPath = $targetDir . $oldPhoto;
            if (copy($oldPath, $newPath)) {
                // Thumbnail erstellen
                $imageInfo = getimagesize($newPath);
                if ($imageInfo) {
                    $source = null;
                    switch ($imageInfo['mime']) {
                        case 'image/jpeg':
                            $source = imagecreatefromjpeg($newPath);
                            break;
                        case 'image/png':
                            $source = imagecreatefrompng($newPath);
                            break;
                        case 'image/gif':
                            $source = imagecreatefromgif($newPath);
                            break;
                    }
                    
                    if ($source) {
                        $origWidth = imagesx($source);
                        $origHeight = imagesy($source);
                        $thumbSize = 200;
                        $scale = min($thumbSize / $origWidth, $thumbSize / $origHeight);
                        $thumbWidth = round($origWidth * $scale);
                        $thumbHeight = round($origHeight * $scale);
                        
                        $thumb = imagecreatetruecolor($thumbWidth, $thumbHeight);
                        imagealphablending($thumb, false);
                        imagesavealpha($thumb, true);
                        imagecopyresampled($thumb, $source, 0, 0, 0, 0, $thumbWidth, $thumbHeight, $origWidth, $origHeight);
                        imagejpeg($thumb, $thumbDir . $oldPhoto, 75);
                        imagedestroy($thumb);
                        imagedestroy($source);
                    }
                }
                
                // Zu photos[] hinzufügen
                if (!isset($hydrant['photos'])) {
                    $hydrant['photos'] = [];
                }
                
                $hydrant['photos'][] = [
                    'filename' => $oldPhoto,
                    'uploaded_at' => date('Y-m-d H:i:s'),
                    'uploaded_by' => 'migration',
                    'migrated_from' => 'photo_field'
                ];
                
                // Altes Feld entfernen
                unset($hydrant['photo']);
                
                $migrated++;
                error_log("✅ Migriert: {$hydrant['id']} - {$oldPhoto} (von " . basename(dirname($oldPath)) . ")");
            } else {
                $errors[] = "Konnte {$oldPhoto} nicht kopieren";
                error_log("❌ Kopier-Fehler: {$oldPhoto}");
            }
        } else {
            // Datei existiert nicht, Feld trotzdem entfernen
            unset($hydrant['photo']);
            error_log("⚠️ Datei nicht gefunden: {$oldPhoto} (weder in pictures_app noch uploads)");
        }
    }
}

// Speichern
if ($migrated > 0) {
    writeJson(HYDRANTS_FILE, $hydrants);
}

sendSuccess([
    'message' => "Migration abgeschlossen",
    'migrated' => $migrated,
    'errors' => $errors
]);
