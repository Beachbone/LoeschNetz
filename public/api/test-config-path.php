<?php
// test-config-path.php - Debugging für CONFIG_FILE

require_once __DIR__ . '/common.php';

header('Content-Type: text/plain');

echo "=== CONFIG FILE DEBUG ===\n\n";
echo "CONFIG_FILE: " . CONFIG_FILE . "\n";
echo "exists: " . (file_exists(CONFIG_FILE) ? 'YES' : 'NO') . "\n";
echo "readable: " . (is_readable(CONFIG_FILE) ? 'YES' : 'NO') . "\n\n";

echo "DATA_DIR: " . DATA_DIR . "\n";
echo "exists: " . (is_dir(DATA_DIR) ? 'YES' : 'NO') . "\n\n";

echo "__DIR__: " . __DIR__ . "\n";
echo "getcwd(): " . getcwd() . "\n\n";

echo "=== Possible Config Locations ===\n";
$possible = [
    dirname(rtrim(DATA_DIR, '/')) . '/config.json',
    DATA_DIR . 'config.json',
    __DIR__ . '/../config.json',
];

foreach ($possible as $path) {
    echo $path . ": " . (file_exists($path) ? 'EXISTS' : 'not found') . "\n";
}

echo "\n=== CONFIG Content ===\n";
if (file_exists(CONFIG_FILE)) {
    $config = readJson(CONFIG_FILE);
    echo json_encode($config, JSON_PRETTY_PRINT);
} else {
    echo "File not found!\n";
}
