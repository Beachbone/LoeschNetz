<?php
// test-put-hydrant.php - PUT-Request direkt testen

require_once 'common.php';

// Session starten für Auth
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Fake Login
$_SESSION['user_id'] = 'admin';
$_SESSION['username'] = 'admin';
$_SESSION['is_admin'] = true;

echo "<h1>PUT Hydrant Test</h1>";

// Test-Daten
$testData = [
    'type' => 'building',
    'title' => 'Test Gerätehaus',
    'description' => 'Test Beschreibung',
    'lat' => 50.000085,
    'lng' => 7.357771,
    'photo' => 'IMAG0502.jpg'
];

echo "<h2>1. Test-Daten</h2>";
echo "<pre>" . json_encode($testData, JSON_PRETTY_PRINT) . "</pre>";

// Hydrants laden
echo "<h2>2. Hydrants.json laden</h2>";
$data = readJson(HYDRANTS_FILE);
if (!$data) {
    die("<p style='color:red'>FEHLER: Konnte hydrants.json nicht laden!</p>");
}
echo "<p style='color:green'>✓ Hydrants.json geladen: " . count($data['hydrants']) . " Hydranten</p>";

// Hydrant finden
echo "<h2>3. Hydrant 'geraetehaus' suchen</h2>";
$hydrantIndex = null;
foreach ($data['hydrants'] as $index => $h) {
    if ($h['id'] === 'geraetehaus') {
        $hydrantIndex = $index;
        break;
    }
}

if ($hydrantIndex === null) {
    die("<p style='color:red'>FEHLER: Hydrant 'geraetehaus' nicht gefunden!</p>");
}
echo "<p style='color:green'>✓ Hydrant gefunden bei Index: $hydrantIndex</p>";

// Daten aktualisieren
echo "<h2>4. Daten aktualisieren</h2>";
$hydrant = &$data['hydrants'][$hydrantIndex];
echo "<p>Alt: lat={$hydrant['lat']}, lng={$hydrant['lng']}</p>";

$hydrant['lat'] = $testData['lat'];
$hydrant['lng'] = $testData['lng'];
$hydrant['title'] = $testData['title'];
$hydrant['description'] = $testData['description'];
$hydrant['updated_at'] = date('Y-m-d\TH:i:s\Z');
$hydrant['updated_by'] = 'admin';

echo "<p>Neu: lat={$hydrant['lat']}, lng={$hydrant['lng']}</p>";

// Speichern testen
echo "<h2>5. Speichern</h2>";
echo "<p>Datei: " . HYDRANTS_FILE . "</p>";
echo "<p>Existiert: " . (file_exists(HYDRANTS_FILE) ? 'JA' : 'NEIN') . "</p>";
echo "<p>Beschreibbar: " . (is_writable(HYDRANTS_FILE) ? 'JA' : 'NEIN') . "</p>";
echo "<p>Verzeichnis beschreibbar: " . (is_writable(dirname(HYDRANTS_FILE)) ? 'JA' : 'NEIN') . "</p>";

// Backup erstellen
$backupFile = HYDRANTS_FILE . '.backup.' . time();
if (copy(HYDRANTS_FILE, $backupFile)) {
    echo "<p style='color:green'>✓ Backup erstellt: $backupFile</p>";
} else {
    echo "<p style='color:red'>✗ Backup konnte nicht erstellt werden!</p>";
}

// Versuchen zu schreiben
$json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if ($json === false) {
    die("<p style='color:red'>FEHLER: JSON-Encoding fehlgeschlagen: " . json_last_error_msg() . "</p>");
}

echo "<p>JSON-Größe: " . strlen($json) . " Bytes</p>";

$result = file_put_contents(HYDRANTS_FILE, $json);
if ($result === false) {
    echo "<p style='color:red'>✗ FEHLER: Konnte Datei nicht schreiben!</p>";
    echo "<p>PHP Error: " . error_get_last()['message'] . "</p>";
} else {
    echo "<p style='color:green'>✓ Erfolgreich geschrieben: $result Bytes</p>";
}

// Nochmal laden zur Verifikation
echo "<h2>6. Verifikation</h2>";
$verifyData = readJson(HYDRANTS_FILE);
if ($verifyData) {
    $verifyHydrant = null;
    foreach ($verifyData['hydrants'] as $h) {
        if ($h['id'] === 'geraetehaus') {
            $verifyHydrant = $h;
            break;
        }
    }
    
    if ($verifyHydrant) {
        echo "<p style='color:green'>✓ Hydrant erfolgreich aktualisiert:</p>";
        echo "<pre>" . json_encode($verifyHydrant, JSON_PRETTY_PRINT) . "</pre>";
    } else {
        echo "<p style='color:red'>✗ Hydrant nicht mehr gefunden!</p>";
    }
} else {
    echo "<p style='color:red'>✗ Konnte Datei nicht neu laden!</p>";
}
