<?php
// api/marker-types.php - CRUD für Marker-Typen

require_once 'common.php';
require_once 'generate-marker-icon.php';

$method = $_SERVER['REQUEST_METHOD'];

// Endpoint aus Query-Parameter (nicht PATH_INFO)
$endpoint = $_GET['endpoint'] ?? 'list';

error_log("MARKER-TYPES API - Method: $method, Endpoint: $endpoint");

// Router
switch ($endpoint) {
    case 'list':
        if ($method === 'GET') {
            handleList();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case 'create':
        if ($method === 'POST') {
            handleCreate();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case 'update':
        if ($method === 'PUT') {
            handleUpdate();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    case 'delete':
        if ($method === 'DELETE') {
            handleDelete();
        } else {
            sendError('Method not allowed', 405);
        }
        break;
        
    default:
        sendError('Endpoint nicht gefunden: ' . $endpoint, 404);
}

/**
 * Liste aller Marker-Typen
 */
function handleList() {
    $data = readJson(MARKER_TYPES_FILE);
    if (!$data) {
        sendError('Konnte Marker-Typen nicht laden', 500);
    }
    
    sendSuccess($data);
}

/**
 * Neuen Marker-Typ erstellen
 */
function handleCreate() {
    requireAdmin();

    // CSRF-Schutz
    validateCsrfToken();

    $input = getJsonInput();
    
    // Validierung
    $required = ['id', 'label', 'color', 'description'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            sendError("Feld '$field' ist erforderlich", 400);
        }
    }
    
    // ID validieren
    if (!preg_match('/^[a-z0-9_-]+$/', $input['id'])) {
        sendError('ID darf nur Kleinbuchstaben, Zahlen, - und _ enthalten', 400);
    }
    
    // Farbe validieren
    if (!preg_match('/^#?[0-9A-Fa-f]{6}$/', $input['color'])) {
        sendError('Ungültiges Farbformat (z.B. #FF0000)', 400);
    }
    
    // Daten laden
    $data = readJson(MARKER_TYPES_FILE);
    if (!$data) {
        sendError('Konnte Marker-Typen nicht laden', 500);
    }
    
    // Prüfen ob ID bereits existiert
    foreach ($data['types'] as $type) {
        if ($type['id'] === $input['id']) {
            sendError('Marker-Typ mit dieser ID existiert bereits', 400);
        }
    }
    
    // Icon generieren oder wiederverwenden
    // Farbe normalisieren (lowercase, ohne #)
    $color = strtolower(ltrim($input['color'], '#'));
    $iconFilename = getIconFilename($color);
    $iconPath = __DIR__ . '/../icons/' . $iconFilename;
    
    // Prüfen ob Icon für diese Farbe bereits existiert
    $iconExists = false;
    foreach ($data['types'] as $type) {
        if (strtolower(ltrim($type['color'], '#')) === strtolower($color)) {
            // Gleiche Farbe gefunden - Icon wiederverwenden
            $iconFilename = $type['icon'];
            $iconExists = true;
            error_log("Icon für Farbe #$color existiert bereits, verwende: $iconFilename");
            break;
        }
    }
    
    // Nur generieren wenn noch nicht vorhanden
    if (!$iconExists) {
        if (file_exists($iconPath)) {
            error_log("Icon-Datei existiert bereits: $iconFilename");
        } else {
            error_log("Generiere neues Icon für Farbe #$color");
            if (!generateMarkerIcon($color, $iconPath)) {
                sendError('Konnte Icon nicht generieren', 500);
            }
        }
    }
    
    // Neuen Typ hinzufügen
    $newType = [
        'id' => $input['id'],
        'label' => $input['label'],
        'color' => '#' . $color,
        'icon' => $iconFilename,
        'description' => $input['description']
    ];
    
    $data['types'][] = $newType;
    $data['last_updated'] = date('Y-m-d\TH:i:s\Z');
    
    // Speichern
    if (!writeJson(MARKER_TYPES_FILE, $data)) {
        sendError('Konnte Marker-Typen nicht speichern', 500);
    }
    
    sendSuccess([
        'message' => 'Marker-Typ erfolgreich erstellt',
        'type' => $newType
    ]);
}

/**
 * Marker-Typ aktualisieren
 */
function handleUpdate() {
    requireAdmin();

    // CSRF-Schutz
    validateCsrfToken();

    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        sendError('ID erforderlich', 400);
    }
    
    $input = getJsonInput();
    
    // Daten laden
    $data = readJson(MARKER_TYPES_FILE);
    if (!$data) {
        sendError('Konnte Marker-Typen nicht laden', 500);
    }
    
    // Typ finden
    $typeIndex = null;
    foreach ($data['types'] as $index => $type) {
        if ($type['id'] === $id) {
            $typeIndex = $index;
            break;
        }
    }
    
    if ($typeIndex === null) {
        sendError('Marker-Typ nicht gefunden', 404);
    }
    
    $oldType = $data['types'][$typeIndex];
    
    // Aktualisieren (nur geänderte Felder)
    if (isset($input['label'])) {
        $data['types'][$typeIndex]['label'] = $input['label'];
    }

    if (isset($input['description'])) {
        $data['types'][$typeIndex]['description'] = $input['description'];
    }

    // Farbe geändert oder aktualisiert?
    // Normalisiere Farben für Vergleich (lowercase, ohne #)
    $oldColorNormalized = strtolower(ltrim($oldType['color'], '#'));
    $newColorNormalized = isset($input['color']) ? strtolower(ltrim($input['color'], '#')) : null;

    if ($newColorNormalized !== null && $newColorNormalized !== $oldColorNormalized) {
        // Farbe validieren
        if (!preg_match('/^#?[0-9A-Fa-f]{6}$/', $input['color'])) {
            sendError('Ungültiges Farbformat', 400);
        }

        $newColor = $newColorNormalized;
        $newIconFilename = getIconFilename($newColor);
        $newIconPath = __DIR__ . '/../icons/' . $newIconFilename;
        
        // Prüfen ob Icon für diese Farbe bereits existiert
        $iconExists = false;
        foreach ($data['types'] as $i => $t) {
            if ($i !== $typeIndex && strtolower(ltrim($t['color'], '#')) === strtolower($newColor)) {
                // Gleiche Farbe gefunden - Icon wiederverwenden
                $newIconFilename = $t['icon'];
                $iconExists = true;
                error_log("Icon für Farbe #$newColor existiert bereits, verwende: $newIconFilename");
                break;
            }
        }
        
        // Nur generieren wenn noch nicht vorhanden
        if (!$iconExists) {
            if (file_exists($newIconPath)) {
                error_log("Icon-Datei existiert bereits: $newIconFilename");
            } else {
                error_log("Generiere neues Icon für Farbe #$newColor");
                if (!generateMarkerIcon($newColor, $newIconPath)) {
                    sendError('Konnte neues Icon nicht generieren', 500);
                }
            }
        }
        
        // Altes Icon löschen (wenn nicht von anderem Typ verwendet)
        $oldIconPath = __DIR__ . '/../icons/' . $oldType['icon'];
        $iconUsedElsewhere = false;
        foreach ($data['types'] as $i => $t) {
            if ($i !== $typeIndex && $t['icon'] === $oldType['icon']) {
                $iconUsedElsewhere = true;
                break;
            }
        }
        
        if (!$iconUsedElsewhere && file_exists($oldIconPath)) {
            try {
                if (unlink($oldIconPath)) {
                    error_log("Altes Icon gelöscht: " . $oldType['icon']);
                } else {
                    error_log("Warnung: Konnte altes Icon nicht löschen: " . $oldType['icon']);
                }
            } catch (Exception $e) {
                error_log("Fehler beim Löschen des alten Icons: " . $e->getMessage());
                // Nicht abbrechen - Icon-Löschung ist nicht kritisch
            }
        }
        
        $data['types'][$typeIndex]['color'] = '#' . $newColor;
        $data['types'][$typeIndex]['icon'] = $newIconFilename;
    } elseif ($newColorNormalized !== null) {
        // Farbe nicht geändert, aber normalisieren für Konsistenz
        $data['types'][$typeIndex]['color'] = '#' . $newColorNormalized;
    }

    $data['last_updated'] = date('Y-m-d\TH:i:s\Z');
    
    // Speichern
    if (!writeJson(MARKER_TYPES_FILE, $data)) {
        sendError('Konnte Marker-Typen nicht speichern', 500);
    }
    
    sendSuccess([
        'message' => 'Marker-Typ erfolgreich aktualisiert',
        'type' => $data['types'][$typeIndex]
    ]);
}

/**
 * Marker-Typ löschen
 */
function handleDelete() {
    requireAdmin();

    // CSRF-Schutz
    validateCsrfToken();

    $id = $_GET['id'] ?? '';
    if (empty($id)) {
        sendError('ID erforderlich', 400);
    }
    
    // Daten laden
    $data = readJson(MARKER_TYPES_FILE);
    if (!$data) {
        sendError('Konnte Marker-Typen nicht laden', 500);
    }
    
    // Typ finden
    $typeIndex = null;
    $deletedType = null;
    foreach ($data['types'] as $index => $type) {
        if ($type['id'] === $id) {
            $typeIndex = $index;
            $deletedType = $type;
            break;
        }
    }
    
    if ($typeIndex === null) {
        sendError('Marker-Typ nicht gefunden', 404);
    }
    
    // Prüfen ob Typ noch verwendet wird
    $hydrants = readJson(HYDRANTS_FILE);
    if ($hydrants) {
        foreach ($hydrants['hydrants'] as $h) {
            if ($h['type'] === $id) {
                sendError('Marker-Typ wird noch von Hydranten verwendet', 400);
            }
        }
    }
    
    // Löschen
    array_splice($data['types'], $typeIndex, 1);
    $data['last_updated'] = date('Y-m-d\TH:i:s\Z');
    
    // Icon löschen (wenn nicht von anderem Typ verwendet)
    $iconUsedElsewhere = false;
    foreach ($data['types'] as $t) {
        if ($t['icon'] === $deletedType['icon']) {
            $iconUsedElsewhere = true;
            break;
        }
    }
    
    if (!$iconUsedElsewhere) {
        $iconPath = __DIR__ . '/../icons/' . $deletedType['icon'];
        if (file_exists($iconPath)) {
            unlink($iconPath);
        }
    }
    
    // Speichern
    if (!writeJson(MARKER_TYPES_FILE, $data)) {
        sendError('Konnte Marker-Typen nicht speichern', 500);
    }
    
    sendSuccess([
        'message' => 'Marker-Typ erfolgreich gelöscht'
    ]);
}
