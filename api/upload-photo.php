<?php
// api/upload-photo.php - Foto-Upload mit Kompression

require_once 'common.php';

requireAdmin();

// CSRF-Schutz
validateCsrfToken();

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendError('Method not allowed', 405);
}

// Hydrant-ID erforderlich
$hydrantId = $_POST['hydrant_id'] ?? null;
if (!$hydrantId) {
    sendError('hydrant_id erforderlich', 400);
}

// Config laden
$config = readJson(CONFIG_FILE);
$maxWidth = $config['photos']['maxWidth'] ?? 1920;
$maxHeight = $config['photos']['maxHeight'] ?? 1920;
$quality = $config['photos']['quality'] ?? 80;
$maxSizeKb = $config['photos']['maxSizeKb'] ?? 2048;

// Uploads-Verzeichnis
$uploadDir = __DIR__ . '/../uploads/hydrants/' . $hydrantId . '/';
$thumbDir = $uploadDir . 'thumbs/';

if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}
if (!is_dir($thumbDir)) {
    mkdir($thumbDir, 0755, true);
}

// Datei-Upload
if (!isset($_FILES['photo'])) {
    sendError('Keine Datei hochgeladen', 400);
}

$file = $_FILES['photo'];

// Fehlerprüfung
if ($file['error'] !== UPLOAD_ERR_OK) {
    sendError('Upload-Fehler: ' . $file['error'], 500);
}

// Dateigröße prüfen
if ($file['size'] > $maxSizeKb * 1024) {
    sendError("Datei zu groß (max. {$maxSizeKb}KB)", 400);
}

// Dateityp prüfen
$imageInfo = getimagesize($file['tmp_name']);
if (!$imageInfo) {
    sendError('Keine gültige Bilddatei', 400);
}

$mimeType = $imageInfo['mime'];
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
if (!in_array($mimeType, $allowedTypes)) {
    sendError('Dateityp nicht erlaubt', 400);
}

// Eindeutigen Dateinamen generieren
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid('photo_', true) . '.' . strtolower($ext);
$filepath = $uploadDir . $filename;
$thumbPath = $thumbDir . $filename;

// Bild laden
$source = null;
switch ($mimeType) {
    case 'image/jpeg':
        $source = imagecreatefromjpeg($file['tmp_name']);
        break;
    case 'image/png':
        $source = imagecreatefrompng($file['tmp_name']);
        break;
    case 'image/gif':
        $source = imagecreatefromgif($file['tmp_name']);
        break;
}

if (!$source) {
    sendError('Konnte Bild nicht laden', 500);
}

// Originalgröße
$origWidth = imagesx($source);
$origHeight = imagesy($source);

// Skalierung berechnen (max. Breite/Höhe)
$scale = min($maxWidth / $origWidth, $maxHeight / $origHeight, 1);
$newWidth = round($origWidth * $scale);
$newHeight = round($origHeight * $scale);

// Hauptbild skalieren
$resized = imagecreatetruecolor($newWidth, $newHeight);
imagealphablending($resized, false);
imagesavealpha($resized, true);
imagecopyresampled($resized, $source, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);

// Speichern
imagejpeg($resized, $filepath, $quality);
imagedestroy($resized);

// Thumbnail (200x200)
$thumbSize = 200;
$thumbScale = min($thumbSize / $origWidth, $thumbSize / $origHeight);
$thumbWidth = round($origWidth * $thumbScale);
$thumbHeight = round($origHeight * $thumbScale);

$thumb = imagecreatetruecolor($thumbWidth, $thumbHeight);
imagealphablending($thumb, false);
imagesavealpha($thumb, true);
imagecopyresampled($thumb, $source, 0, 0, 0, 0, $thumbWidth, $thumbHeight, $origWidth, $origHeight);
imagejpeg($thumb, $thumbPath, 75);
imagedestroy($thumb);
imagedestroy($source);

// Hydrant-Daten aktualisieren
$hydrants = readJson(HYDRANTS_FILE);
$updated = false;

foreach ($hydrants['hydrants'] as &$hydrant) {
    if ($hydrant['id'] === $hydrantId) {
        if (!isset($hydrant['photos'])) {
            $hydrant['photos'] = [];
        }
        $hydrant['photos'][] = [
            'filename' => $filename,
            'uploaded_at' => date('Y-m-d H:i:s'),
            'uploaded_by' => $_SESSION['username'] ?? 'unknown'
        ];
        $updated = true;
        break;
    }
}

if (!$updated) {
    sendError('Hydrant nicht gefunden', 404);
}

writeJson(HYDRANTS_FILE, $hydrants);

sendSuccess([
    'message' => 'Foto hochgeladen',
    'filename' => $filename,
    'url' => "/uploads/hydrants/{$hydrantId}/{$filename}",
    'thumb' => "/uploads/hydrants/{$hydrantId}/thumbs/{$filename}"
]);
