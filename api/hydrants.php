<?php
/**
 * hydrants.php
 * 
 * API für Hydrant-Verwaltung
 * 
 * Endpoints:
 * - GET    /api/hydrants.php              → Alle Hydranten (public)
 * - POST   /api/hydrants.php              → Neuer Hydrant (Auth erforderlich)
 * - PUT    /api/hydrants.php?id=xxx       → Hydrant bearbeiten (Auth erforderlich)
 * - DELETE /api/hydrants.php?id=xxx       → Hydrant löschen (Auth erforderlich)
 */

require_once 'common.php';

// Request-Daten
$method = $_SERVER['REQUEST_METHOD'];
$path = $_SERVER['PATH_INFO'] ?? '/';

// Query-Parameter Support
$id = $_GET['id'] ?? null;

// Router
switch ($method) {
    case 'GET':
        // Öffentlich - kein Login nötig!
        handleGetHydrants();
        break;
        
    case 'POST':
        // Neuer Hydrant - Login erforderlich
        handleCreateHydrant();
        break;
        
    case 'PUT':
        // Hydrant bearbeiten - Login erforderlich
        if (!$id) {
            sendError('ID fehlt', 400, 'VALIDATION_ERROR');
        }
        handleUpdateHydrant($id);
        break;
        
    case 'DELETE':
        // Hydrant löschen - Login erforderlich
        if (!$id) {
            sendError('ID fehlt', 400, 'VALIDATION_ERROR');
        }
        handleDeleteHydrant($id);
        break;
        
    default:
        sendError('Method not allowed', 405);
}

/**
 * GET /api/hydrants.php
 * Alle Hydranten abrufen (öffentlich!)
 */
function handleGetHydrants() {
    $data = readJson(HYDRANTS_FILE);
    
    if (!$data || !isset($data['hydrants'])) {
        sendError('Hydrant-Daten konnten nicht geladen werden', 500, 'SYSTEM_ERROR');
    }
    
    // Erfolg
    sendSuccess([
        'hydrants' => $data['hydrants'],
        'version' => $data['version'] ?? '1.0',
        'last_updated' => $data['last_updated'] ?? null
    ], 'Hydranten erfolgreich geladen');
}

/**
 * POST /api/hydrants.php
 * Neuen Hydrant erstellen
 */
function handleCreateHydrant() {
    // Auth erforderlich
    $user = requireAuth();

    // CSRF-Schutz
    validateCsrfToken();
    
    // Input validieren
    $input = getJsonInput();
    
    // Pflichtfelder prüfen
    $required = ['lat', 'lng', 'type', 'title'];
    foreach ($required as $field) {
        if (!isset($input[$field]) || trim($input[$field]) === '') {
            sendError("Feld '$field' ist erforderlich", 400, 'VALIDATION_ERROR');
        }
    }
    
    // Koordinaten validieren
    $lat = floatval($input['lat']);
    $lng = floatval($input['lng']);
    
    if ($lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
        sendError('Ungültige Koordinaten', 400, 'VALIDATION_ERROR');
    }
    
    // Typ validieren
    $validTypes = ['h80', 'h100', 'h125', 'h150', 'reservoir', 'building'];
    if (!in_array($input['type'], $validTypes)) {
        sendError('Ungültiger Typ. Erlaubt: ' . implode(', ', $validTypes), 400, 'VALIDATION_ERROR');
    }
    
    // Daten laden
    $data = readJson(HYDRANTS_FILE);
    if (!$data) {
        $data = ['version' => '1.0', 'hydrants' => []];
    }
    
    // Neue ID generieren (aus Typ + Index)
    $typeCount = 0;
    foreach ($data['hydrants'] as $h) {
        if (strpos($h['id'], $input['type'] . '_') === 0) {
            $typeCount++;
        }
    }
    $newId = $input['type'] . '_' . ($typeCount + 1);
    
    // Falls ID-Konflikt, UUID anhängen
    $idExists = false;
    foreach ($data['hydrants'] as $h) {
        if ($h['id'] === $newId) {
            $idExists = true;
            break;
        }
    }
    if ($idExists) {
        $newId = $input['type'] . '_' . substr(generateUuid(), 0, 8);
    }
    
    // Neuer Hydrant
    $now = now();
    $newHydrant = [
        'id' => $newId,
        'type' => $input['type'],
        'lat' => $lat,
        'lng' => $lng,
        'title' => trim($input['title']),
        'description' => isset($input['description']) ? trim($input['description']) : '',
        'photo' => isset($input['photo']) ? trim($input['photo']) : '',
        'created_at' => $now,
        'created_by' => $user['username'],
        'updated_at' => $now,
        'updated_by' => $user['username']
    ];
    
    // Hinzufügen
    $data['hydrants'][] = $newHydrant;
    $data['last_updated'] = $now;
    
    // Speichern
    if (!writeJson(HYDRANTS_FILE, $data)) {
        sendError('Hydrant konnte nicht gespeichert werden', 500, 'SYSTEM_ERROR');
    }
    
    sendSuccess([
        'hydrant' => $newHydrant
    ], 'Hydrant erfolgreich erstellt', 201);
}

/**
 * PUT /api/hydrants.php?id=xxx
 * Hydrant bearbeiten
 */
function handleUpdateHydrant($id) {
    // Auth erforderlich
    $user = requireAuth();

    // CSRF-Schutz
    validateCsrfToken();

    error_log("UPDATE HYDRANT - ID: $id, User: " . $user['username']);
    
    // Input validieren
    $input = getJsonInput();
    
    error_log("UPDATE HYDRANT - Input: " . json_encode($input));
    
    // Daten laden
    $data = readJson(HYDRANTS_FILE);
    if (!$data || !isset($data['hydrants'])) {
        sendError('Hydrant-Daten konnten nicht geladen werden', 500, 'SYSTEM_ERROR');
    }
    
    // Hydrant finden
    $hydrantIndex = null;
    foreach ($data['hydrants'] as $index => $h) {
        if ($h['id'] === $id) {
            $hydrantIndex = $index;
            break;
        }
    }
    
    if ($hydrantIndex === null) {
        sendError('Hydrant nicht gefunden', 404, 'NOT_FOUND');
    }
    
    $hydrant = &$data['hydrants'][$hydrantIndex];
    
    // Felder aktualisieren (nur wenn angegeben)
    if (isset($input['lat'])) {
        $lat = floatval($input['lat']);
        if ($lat < -90 || $lat > 90) {
            sendError('Ungültige Latitude', 400, 'VALIDATION_ERROR');
        }
        $hydrant['lat'] = $lat;
    }
    
    if (isset($input['lng'])) {
        $lng = floatval($input['lng']);
        if ($lng < -180 || $lng > 180) {
            sendError('Ungültige Longitude', 400, 'VALIDATION_ERROR');
        }
        $hydrant['lng'] = $lng;
    }
    
    if (isset($input['type'])) {
        $validTypes = ['h80', 'h100', 'h125', 'h150', 'reservoir', 'building'];
        if (!in_array($input['type'], $validTypes)) {
            sendError('Ungültiger Typ', 400, 'VALIDATION_ERROR');
        }
        $hydrant['type'] = $input['type'];
    }
    
    if (isset($input['title'])) {
        if (trim($input['title']) === '') {
            sendError('Titel darf nicht leer sein', 400, 'VALIDATION_ERROR');
        }
        $hydrant['title'] = trim($input['title']);
    }
    
    if (isset($input['description'])) {
        $hydrant['description'] = trim($input['description']);
    }
    
    if (isset($input['photo'])) {
        $hydrant['photo'] = trim($input['photo']);
    }
    
    // Timestamps aktualisieren
    $now = now();
    $hydrant['updated_at'] = $now;
    $hydrant['updated_by'] = $user['username'];
    
    $data['last_updated'] = $now;
    
    // Speichern
    if (!writeJson(HYDRANTS_FILE, $data)) {
        sendError('Hydrant konnte nicht aktualisiert werden', 500, 'SYSTEM_ERROR');
    }
    
    sendSuccess([
        'hydrant' => $hydrant
    ], 'Hydrant erfolgreich aktualisiert');
}

/**
 * DELETE /api/hydrants.php?id=xxx
 * Hydrant löschen
 */
function handleDeleteHydrant($id) {
    // Auth erforderlich (Admin ODER Editor!)
    $user = requireAuth();

    // CSRF-Schutz
    validateCsrfToken();
    
    // Daten laden
    $data = readJson(HYDRANTS_FILE);
    if (!$data || !isset($data['hydrants'])) {
        sendError('Hydrant-Daten konnten nicht geladen werden', 500, 'SYSTEM_ERROR');
    }
    
    // Hydrant finden
    $hydrantIndex = null;
    foreach ($data['hydrants'] as $index => $h) {
        if ($h['id'] === $id) {
            $hydrantIndex = $index;
            break;
        }
    }
    
    if ($hydrantIndex === null) {
        sendError('Hydrant nicht gefunden', 404, 'NOT_FOUND');
    }
    
    // Hydrant entfernen
    $deletedHydrant = $data['hydrants'][$hydrantIndex];
    array_splice($data['hydrants'], $hydrantIndex, 1);
    
    // last_updated aktualisieren
    $data['last_updated'] = now();
    
    // Speichern
    if (!writeJson(HYDRANTS_FILE, $data)) {
        sendError('Hydrant konnte nicht gelöscht werden', 500, 'SYSTEM_ERROR');
    }
    
    sendSuccess([
        'id' => $id,
        'deleted' => $deletedHydrant
    ], 'Hydrant erfolgreich gelöscht');
}
