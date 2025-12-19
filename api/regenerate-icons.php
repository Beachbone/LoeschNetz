<?php
// regenerate-icons.php - Regeneriert fehlende Marker-Icons
// Kann direkt im Browser aufgerufen werden

require_once 'common.php';
require_once 'generate-marker-icon.php';

header('Content-Type: text/html; charset=utf-8');

echo "<!DOCTYPE html>\n";
echo "<html><head><title>Icon Generator</title><style>";
echo "body { font-family: monospace; padding: 20px; background: #f5f5f5; }";
echo ".success { color: green; } .error { color: red; } .info { color: blue; }";
echo "pre { background: white; padding: 10px; border-radius: 5px; }";
echo "</style></head><body>\n";
echo "<h1>🎨 Marker Icon Generator</h1>\n";
echo "<pre>\n";

// Marker-Typen laden
$data = readJson(MARKER_TYPES_FILE);
if (!$data) {
    echo "<span class='error'>❌ Fehler: Konnte marker-types.json nicht laden</span>\n";
    exit;
}

echo "📋 Gefundene Marker-Typen: " . count($data['types']) . "\n\n";

$generated = 0;
$existing = 0;
$errors = 0;

foreach ($data['types'] as $type) {
    $color = ltrim($type['color'], '#');
    $iconFilename = $type['icon'];
    $iconPath = __DIR__ . '/../icons/' . $iconFilename;

    echo "🔍 Marker '<strong>{$type['id']}</strong>' (Farbe: #{$color}):\n";
    echo "   Icon: $iconFilename\n";

    // Prüfen ob Icon existiert
    if (file_exists($iconPath)) {
        echo "   <span class='success'>✅ Icon existiert bereits</span>\n";
        $existing++;
    } else {
        echo "   <span class='info'>🎨 Generiere Icon...</span>\n";
        if (generateMarkerIcon($color, $iconPath)) {
            echo "   <span class='success'>✅ Icon erfolgreich generiert</span>\n";
            $generated++;
        } else {
            echo "   <span class='error'>❌ FEHLER beim Generieren</span>\n";
            $errors++;
        }
    }

    echo "\n";
}

echo "\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📊 Zusammenfassung:\n";
echo "   <span class='success'>✅ Neu generiert: $generated</span>\n";
echo "   ℹ️  Bereits vorhanden: $existing\n";
if ($errors > 0) {
    echo "   <span class='error'>❌ Fehler: $errors</span>\n";
}
echo "\n🎉 Fertig!\n";

echo "</pre>\n";
echo "</body></html>\n";
