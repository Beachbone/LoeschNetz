<?php
// api/generate-marker-icon.php - Generiert farbige Marker-Icons

require_once 'common.php';

/**
 * Generiert ein farbiges Marker-Icon PNG (Leaflet-Style)
 * 
 * @param string $color Hex-Farbe ohne # (z.B. "FF0000")
 * @param string $outputPath Pfad wo PNG gespeichert wird
 * @return bool Success
 */
function generateMarkerIcon($color, $outputPath) {
    // SVG Template - exakt wie Leaflet Standard-Icon
    $markerSvg = <<<SVG
<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41">
  <!-- Schatten -->
  <ellipse cx="12.5" cy="38" rx="8" ry="2" fill="#000" opacity="0.2"/>
  
  <!-- Marker Umriss (schwarz) -->
  <path d="M12.5 0 C19.4 0 25 5.6 25 12.5 C25 19.4 12.5 41 12.5 41 C12.5 41 0 19.4 0 12.5 C0 5.6 5.6 0 12.5 0 Z" 
        fill="#{$color}" stroke="#000" stroke-width="1"/>
  
  <!-- Weißer Punkt -->
  <circle cx="12.5" cy="12.5" r="5" fill="#fff" opacity="0.9"/>
</svg>
SVG;

    // Versuche zuerst ImageMagick (beste Qualität)
    if (extension_loaded('imagick')) {
        try {
            $imagick = new Imagick();
            $imagick->readImageBlob($markerSvg);
            $imagick->setImageFormat('png32'); // PNG mit Alpha
            $imagick->setBackgroundColor(new ImagickPixel('transparent'));
            $imagick->resizeImage(25, 41, Imagick::FILTER_LANCZOS, 1);
            
            $success = $imagick->writeImage($outputPath);
            $imagick->clear();
            $imagick->destroy();
            
            if ($success) {
                error_log("✅ Icon mit ImageMagick generiert: $outputPath");
                return true;
            }
        } catch (Exception $e) {
            error_log("⚠️ ImageMagick Error: " . $e->getMessage());
            // Fallback zu GD
        }
    }
    
    // Fallback: GD Library mit verbesserter Qualität
    if (extension_loaded('gd')) {
        error_log("📐 Generiere Icon mit GD für Farbe #$color");
        
        // 2x Größe für besseres Antialiasing, später runterskalieren
        $scale = 50; //muss eine gerade Zahl sein wegen der 7.5
        $width = 25 * $scale;
        $height = 41 * $scale;
        
        $im = imagecreatetruecolor($width, $height);
        
        // Antialiasing aktivieren
        imageantialias($im, true);
        
        // Transparenter Hintergrund
        imagesavealpha($im, true);
        $transparent = imagecolorallocatealpha($im, 0, 0, 0, 127);
        imagefill($im, 0, 0, $transparent);
        
        // Farben
        $r = hexdec(substr($color, 0, 2));
        $g = hexdec(substr($color, 2, 2));
        $b = hexdec(substr($color, 4, 2));
        $markerColor = imagecolorallocate($im, $r, $g, $b);
        $black = imagecolorallocatealpha($im, 0, 0, 0, 60);
        $white = imagecolorallocate($im, 255, 255, 255);
        $shadow = imagecolorallocatealpha($im, 0, 0, 0, 77);
        
        // Alle Koordinaten * SCcale (wegen 2x Größe)
        $cx = 12 * $scale;
        $cy = 12 * $scale;
        $radius = 11 * $scale;
        $radius_plus1 = 12 * $scale;
        
        // 1. SCHATTEN: Ellipse unten
        // imagefilledellipse($im, $cx, 38 * $scale, 16 * $scale, 4 * $scale, $shadow);
        
        // 2. SCHWARZER RAND: Marker-Form
        // Oberer Kreis
        imagefilledellipse($im, $cx, $cy, $radius_plus1 * 2 , $radius_plus1 * 2, $black);
        
        // Untere Spitze (Dreieck NACH UNTEN)
        $triangleBlack = [
            $cx, 41 * $scale,            // Oben (unten am Kreis)
            $cx - $radius , $cy + 5 * $scale , // + $radius - 3, // Unten Links  
            $cx + $radius , $cy + 5 * $scale   //+ $radius - 3 // Unten Rechts
        ];
        imagefilledpolygon($im, $triangleBlack, $black);
        
        // 3. HAUPTFARBE: Marker-Form
        // Oberer Kreis
        imagefilledellipse($im, $cx, $cy, $radius * 2, $radius * 2, $markerColor);
        
        // Untere Spitze
        $triangleColor = [
            $cx, 39 * $scale,     // Oben (etwas kleiner als Rand)
            $cx - $radius , $cy + 4 * $scale, //+ $radius - $scale - 3,   // Unten Links
            $cx + $radius , $cy + 4 * $scale  // + $radius - $scale - 3  // Unten Rechts 
        ];
        imagefilledpolygon($im, $triangleColor, $markerColor);
        
        // 4. WEIßER PUNKT in der Mitte
        imagefilledellipse($im, $cx, $cy, 8 * $scale, 8 * $scale, $black);
        imagefilledellipse($im, $cx, $cy, 7.5 * $scale, 7.5 * $scale, $white);
        
        // Runterskalieren auf 25x41 (bessere Qualität durch Downsampling)
        $final = imagecreatetruecolor(25, 41);
        imagesavealpha($final, true);
        imagefill($final, 0, 0, $transparent);
        
        imagecopyresampled(
            $final, $im,
            0, 0, 0, 0,
            25, 41, $width, $height
        );
        
        
        // PNG speichern
        $result = imagepng($final, $outputPath, 0); // Keine Kompression
        
        imagedestroy($im);
        imagedestroy($final);
        
        if ($result) {
            error_log("✅ Icon mit GD generiert: $outputPath");
            return true;
        }
        
        return false;
        
    } else {
        // Kein GD und kein ImageMagick verfügbar
        error_log("❌ FEHLER: Weder GD noch ImageMagick verfügbar!");
        
        // Letzter Fallback: Kopiere Standard-Icon
        $baseIcon = __DIR__ . '/../icons/markericon.png';
        if (file_exists($baseIcon)) {
            error_log("📋 Kopiere Fallback-Icon");
            return copy($baseIcon, $outputPath);
        }
        return false;
    }
}

/**
 * Löscht nicht mehr verwendete Marker-Icons
 */
function cleanupUnusedIcons() {
    $markerTypes = readJson(MARKER_TYPES_FILE);
    if (!$markerTypes) return;
    
    $usedIcons = [];
    foreach ($markerTypes['types'] as $type) {
        $usedIcons[] = $type['icon'];
    }
    
    $iconDir = __DIR__ . '/../icons/';
    $files = glob($iconDir . 'marker_*.png');
    
    foreach ($files as $file) {
        $filename = basename($file);
        if (!in_array($filename, $usedIcons)) {
            unlink($file);
            error_log("🗑️ Gelöschtes ungenutztes Icon: $filename");
        }
    }
}

/**
 * Generiert Icon-Dateinamen aus Farbe
 */
function getIconFilename($color) {
    // Entferne # falls vorhanden
    $color = ltrim($color, '#');
    return 'marker_' . strtolower($color) . '.png';
}
