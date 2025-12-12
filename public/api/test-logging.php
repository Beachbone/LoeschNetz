<?php
/**
 * Test CRUD Logging
 * Run this file to test if the logging function works correctly
 */

require_once 'common.php';

// Start session for user context
session_start();

// Simulate a logged-in user
$_SESSION['user_id'] = 'test-user-id';
$_SESSION['username'] = 'test-admin';
$_SESSION['is_admin'] = true;

echo "<h1>CRUD Logging Test</h1>";
echo "<pre>";

// Test 1: CREATE action
echo "Test 1: CREATE action\n";
echo "Calling: logCrudAction('CREATE', 'hydrant', ['id' => 'h80_test', 'type' => 'h80', 'title' => 'Test Hydrant'])\n\n";

logCrudAction('CREATE', 'hydrant', [
    'id' => 'h80_test',
    'type' => 'h80',
    'title' => 'Test Hydrant'
]);

echo "✓ CREATE logged\n\n";

// Test 2: UPDATE action
echo "Test 2: UPDATE action\n";
echo "Calling: logCrudAction('UPDATE', 'hydrant', ['id' => 'h80_test', 'updated_fields' => ['title', 'description'], 'title' => 'Updated Title'])\n\n";

logCrudAction('UPDATE', 'hydrant', [
    'id' => 'h80_test',
    'updated_fields' => ['title', 'description'],
    'title' => 'Updated Title'
]);

echo "✓ UPDATE logged\n\n";

// Test 3: DELETE action
echo "Test 3: DELETE action\n";
echo "Calling: logCrudAction('DELETE', 'hydrant', ['id' => 'h80_test', 'type' => 'h80', 'title' => 'Test Hydrant'])\n\n";

logCrudAction('DELETE', 'hydrant', [
    'id' => 'h80_test',
    'type' => 'h80',
    'title' => 'Test Hydrant'
]);

echo "✓ DELETE logged\n\n";

// Read and display the log file
$logFile = DATA_DIR . 'crud.log';

echo "========================================\n";
echo "Log File Contents: $logFile\n";
echo "========================================\n\n";

if (file_exists($logFile)) {
    $logContent = file_get_contents($logFile);

    // Get last 3 lines (our test entries)
    $lines = explode("\n", trim($logContent));
    $lastThree = array_slice($lines, -3);

    foreach ($lastThree as $index => $line) {
        echo "Entry " . ($index + 1) . ":\n";
        $decoded = json_decode($line, true);
        echo json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        echo "\n\n";
    }

    echo "Total entries in log: " . count($lines) . "\n";
} else {
    echo "❌ ERROR: Log file not found at: $logFile\n";
    echo "Check directory permissions for: " . DATA_DIR . "\n";
}

echo "</pre>";

echo "<hr>";
echo "<h2>What to check:</h2>";
echo "<ul>";
echo "<li>All 3 entries should have an 'action' field (CREATE, UPDATE, DELETE)</li>";
echo "<li>All entries should have 'timestamp', 'user', 'resource', 'details', 'ip' fields</li>";
echo "<li>If log file not found, check write permissions on the data/ directory</li>";
echo "</ul>";

echo "<p><a href='../admin/logs.html'>View in Admin Logs Viewer</a></p>";
