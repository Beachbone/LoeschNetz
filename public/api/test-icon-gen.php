<?php
// test-icon-gen.php - Test icon generation with detailed error reporting

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once 'common.php';
require_once 'generate-marker-icon.php';

header('Content-Type: text/plain; charset=utf-8');

echo "=== ICON GENERATION TEST ===\n\n";

// Check GD availability
echo "1. Checking GD Library:\n";
if (extension_loaded('gd')) {
    echo "   ✅ GD is available\n";
    $gdInfo = gd_info();
    echo "   Version: " . $gdInfo['GD Version'] . "\n";
    echo "   PNG Support: " . ($gdInfo['PNG Support'] ? 'Yes' : 'No') . "\n";
} else {
    echo "   ❌ GD is NOT available\n";
}
echo "\n";

// Check ImageMagick availability
echo "2. Checking ImageMagick:\n";
if (extension_loaded('imagick')) {
    echo "   ✅ ImageMagick is available\n";
} else {
    echo "   ℹ️  ImageMagick is NOT available (GD will be used)\n";
}
echo "\n";

// Check icons directory
$iconsDir = __DIR__ . '/../icons/';
echo "3. Checking Icons Directory:\n";
echo "   Path: $iconsDir\n";
echo "   Exists: " . (is_dir($iconsDir) ? 'Yes' : 'No') . "\n";
echo "   Writable: " . (is_writable($iconsDir) ? 'Yes' : 'No') . "\n";
echo "\n";

// Test generating a single icon
echo "4. Testing Icon Generation (red marker):\n";
$testColor = 'ff0000';
$testPath = $iconsDir . 'marker_' . $testColor . '.png';
echo "   Color: #$testColor\n";
echo "   Path: $testPath\n";

if (file_exists($testPath)) {
    echo "   ℹ️  File already exists\n";
    echo "   Size: " . filesize($testPath) . " bytes\n";
    echo "   Modified: " . date('Y-m-d H:i:s', filemtime($testPath)) . "\n";
} else {
    echo "   Generating...\n";
    $result = generateMarkerIcon($testColor, $testPath);
    if ($result) {
        echo "   ✅ Success!\n";
        echo "   Size: " . filesize($testPath) . " bytes\n";
    } else {
        echo "   ❌ FAILED!\n";
    }
}

echo "\n=== TEST COMPLETE ===\n";
