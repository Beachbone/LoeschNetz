<?php
// fix-marker-icons.php - Regeneriert alle Marker-Icons basierend auf den Farben

require_once 'common.php';
require_once 'generate-marker-icon.php';

echo "🔧 Marker-Icons werden korrigiert...\n\n";

// Marker-Typen laden
$data = readJson(MARKER_TYPES_FILE);
if (!$data) {
    die("❌ Fehler: Konnte marker-types.json nicht laden\n");
}

echo "📋 Gefundene Marker-Typen: " . count($data['types']) . "\n\n";

$updated = false;

foreach ($data['types'] as $index => &$type) {
    $color = ltrim($type['color'], '#');
    $correctIconFilename = getIconFilename($color);
    $iconPath = __DIR__ . '/../icons/' . $correctIconFilename;

    echo "🔍 Marker '{$type['id']}' (Farbe: #{$color}):\n";
    echo "   Aktuelles Icon: {$type['icon']}\n";
    echo "   Korrektes Icon: $correctIconFilename\n";

    // Prüfen ob Icon mit dieser Farbe bereits existiert (von anderem Typ)
    $iconExists = false;
    foreach ($data['types'] as $i => $t) {
        if ($i !== $index && strtolower(ltrim($t['color'], '#')) === strtolower($color)) {
            // Gleiche Farbe, Icon bereits generiert
            if (file_exists(__DIR__ . '/../icons/' . $t['icon'])) {
                $correctIconFilename = $t['icon'];
                $iconExists = true;
                echo "   ♻️  Icon existiert bereits (von '{$t['id']}')\n";
                break;
            }
        }
    }

    // Icon generieren falls nötig
    if (!$iconExists) {
        if (file_exists($iconPath)) {
            echo "   ✅ Icon-Datei existiert bereits\n";
        } else {
            echo "   🎨 Generiere neues Icon...\n";
            if (generateMarkerIcon($color, $iconPath)) {
                echo "   ✅ Icon erfolgreich generiert\n";
            } else {
                echo "   ❌ FEHLER beim Generieren\n";
                continue;
            }
        }
    }

    // Icon-Referenz aktualisieren
    if ($type['icon'] !== $correctIconFilename) {
        echo "   📝 Aktualisiere Icon-Referenz\n";
        $type['icon'] = $correctIconFilename;
        $updated = true;
    }

    echo "\n";
}

// Speichern falls geändert
if ($updated) {
    $data['last_updated'] = date('Y-m-d\TH:i:s\Z');

    if (writeJson(MARKER_TYPES_FILE, $data)) {
        echo "✅ marker-types.json erfolgreich aktualisiert\n";
    } else {
        echo "❌ FEHLER beim Speichern von marker-types.json\n";
    }
} else {
    echo "✅ Alle Icons sind bereits korrekt\n";
}

echo "\n🎉 Fertig!\n";
