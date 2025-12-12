<?php
/**
 * logs.php
 *
 * API für CRUD-Log-Verwaltung
 *
 * Endpoints:
 * - GET /api/logs.php              → Alle Log-Einträge abrufen (Auth erforderlich)
 * - GET /api/logs.php?limit=100    → Begrenzte Anzahl Log-Einträge
 */

require_once 'common.php';

// Auth erforderlich
$user = requireAuth();

// Request-Daten
$method = $_SERVER['REQUEST_METHOD'];

// Nur GET erlaubt
if ($method !== 'GET') {
    sendError('Method not allowed', 405);
}

// Parameter
$limit = isset($_GET['limit']) ? intval($_GET['limit']) : 1000; // Default: letzte 1000 Einträge
$limit = max(1, min($limit, 10000)); // Zwischen 1 und 10000

// Log-Datei
$logFile = DATA_DIR . 'crud.log';

// Prüfen ob Log-Datei existiert
if (!file_exists($logFile)) {
    sendSuccess([
        'entries' => [],
        'total' => 0,
        'message' => 'Noch keine Log-Einträge vorhanden'
    ], 'Log-Datei leer');
}

try {
    // Log-Datei lesen
    $lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        throw new Exception('Log-Datei konnte nicht gelesen werden');
    }

    $totalLines = count($lines);

    // Nur die letzten N Zeilen nehmen (neueste zuerst)
    $lines = array_slice($lines, -$limit);

    // JSON parsen
    $entries = [];
    foreach ($lines as $index => $line) {
        try {
            $entry = json_decode($line, true);
            if ($entry !== null) {
                // Index hinzufügen für UI
                $entry['_index'] = $totalLines - count($lines) + $index + 1;
                $entries[] = $entry;
            }
        } catch (Exception $e) {
            // Fehlerhafte Zeile überspringen
            error_log("CRUD Log Parse Error: " . $e->getMessage() . " - Line: " . $line);
        }
    }

    // Neueste zuerst (umkehren)
    $entries = array_reverse($entries);

    sendSuccess([
        'entries' => $entries,
        'total' => $totalLines,
        'limit' => $limit,
        'returned' => count($entries)
    ], 'Log-Einträge erfolgreich geladen');

} catch (Exception $e) {
    error_log("CRUD Log API Error: " . $e->getMessage());
    sendError('Fehler beim Laden der Log-Einträge: ' . $e->getMessage(), 500, 'SYSTEM_ERROR');
}
