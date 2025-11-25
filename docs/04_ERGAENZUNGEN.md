# Hydrant-PWA - Ergänzungen & Korrekturen

**Version:** 1.1  
**Datum:** November 2025 ✅ (korrigiert)  
**Status:** Ergänzungen nach Feedback

---

## 🔄 Änderungen

### 1. Snapshots konfigurierbar

**config.json erweitert:**

```json
{
  "snapshots": {
    "enabled": true,
    "max_count": 20,              // ← ANPASSBAR (5-50)
    "daily_limit": 1,
    "min_disk_space_mb": 10,      // ← NEU
    "auto_cleanup_older_than_days": 90  // ← NEU (optional)
  }
}
```

**Admin-UI:**

```
┌────────────────────────────────────────┐
│ Einstellungen → Snapshots              │
├────────────────────────────────────────┤
│ Snapshots aktiviert:      [✓]          │
│                                        │
│ Maximale Anzahl:          [20] (5-50)  │
│ Max. pro Tag:             [1]          │
│ Min. freier Speicher:     [10] MB      │
│ Auto-Löschung nach:       [90] Tagen   │
│                           (0 = nie)    │
├────────────────────────────────────────┤
│ 📊 Aktueller Status:                   │
│ - 15 Snapshots vorhanden               │
│ - ~750 KB Speicher belegt              │
│ - Freier Speicherplatz: 1.2 GB ✅      │
├────────────────────────────────────────┤
│ [Speichern]                            │
│ [Alle Snapshots löschen]               │
└────────────────────────────────────────┘
```

**Backend-Prüfung:**

```php
function createSnapshot() {
    $config = $GLOBALS['config']['snapshots'];
    
    // 1. Aktiviert?
    if (!$config['enabled']) {
        return;
    }
    
    // 2. Daily Limit?
    $today = date('Y-m-d');
    if (file_exists("data/snapshots/hydrants_{$today}.json")) {
        return; // Heute schon erstellt
    }
    
    // 3. Genug Speicherplatz?
    $freeSpace = disk_free_space('.') / 1024 / 1024; // MB
    if ($freeSpace < $config['min_disk_space_mb']) {
        throw new ApiError(
            "Nicht genug Speicherplatz für Snapshot: {$freeSpace} MB frei, {$config['min_disk_space_mb']} MB erforderlich",
            "DISK_SPACE_LOW",
            507,
            ['free_mb' => $freeSpace, 'required_mb' => $config['min_disk_space_mb']]
        );
    }
    
    // 4. Snapshot erstellen
    // ...
    
    // 5. Rotation nach max_count
    rotateSnapshots($config['max_count']);
    
    // 6. Auto-Cleanup nach Alter
    if ($config['auto_cleanup_older_than_days'] > 0) {
        cleanupOldSnapshots($config['auto_cleanup_older_than_days']);
    }
}
```

---

### 2. Datenschutz & Impressum im Setup

**Setup-Wizard erweitert:**

```
Setup → Schritt 5/6: Rechtliches

┌─────────────────────────────────────────────┐
│ Datenschutzerklärung                        │
├─────────────────────────────────────────────┤
│ Diese Angaben werden in die                 │
│ Datenschutzerklärung eingefügt.             │
│                                             │
│ Verantwortlicher:                           │
│ Name:    [FFW Kappel-Kludenbach        ]   │
│ Adresse: [Hauptstraße 42               ]   │
│          [56867 Kappel                 ]   │
│                                             │
│ Kontakt:                                    │
│ Email:   [admin@ffw-kappel.de          ]   │
│ Telefon: [+49 123 456789               ]   │
│                                             │
│ Datenschutzbeauftragter (optional):         │
│ Name:    [                              ]   │
│ Email:   [                              ]   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Impressum                                   │
├─────────────────────────────────────────────┤
│ Angaben gem. § 5 TMG:                       │
│                                             │
│ Vertreten durch:                            │
│ [Max Mustermann (Wehrführer)           ]   │
│                                             │
│ Registereintrag (optional):                 │
│ Register:     [VR 12345                ]   │
│ Registergericht: [Amtsgericht Zell     ]   │
│                                             │
│ Aufsichtsbehörde (optional):                │
│ [Kreisverwaltung Cochem-Zell           ]   │
└─────────────────────────────────────────────┘

[← Zurück]  [Vorlagen generieren →]
```

**Generierte Dateien:**

`/datenschutz.html` (Template + Daten):
```html
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="utf-8">
    <title>Datenschutzerklärung - FFW Kappel-Kludenbach</title>
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <div class="legal-document">
        <h1>Datenschutzerklärung</h1>
        
        <h2>1. Verantwortlicher</h2>
        <p>
            FFW Kappel-Kludenbach<br>
            Hauptstraße 42<br>
            56867 Kappel<br>
            <br>
            Email: admin@ffw-kappel.de<br>
            Telefon: +49 123 456789
        </p>
        
        <h2>2. Datenverarbeitung</h2>
        <h3>Public App (ohne Login)</h3>
        <p><strong>Erhobene Daten:</strong> Keine personenbezogenen Daten</p>
        
        <!-- ... rest des Templates ... -->
        
        <p><small>Stand: <?= date('d.m.Y') ?></small></p>
        <p><a href="/">← Zurück zur App</a></p>
    </div>
</body>
</html>
```

**Nachträglich editierbar:**

```
Admin-Panel → Einstellungen → Rechtliches

[Datenschutzerklärung bearbeiten]
[Impressum bearbeiten]

→ Öffnet einfachen HTML-Editor mit Syntax-Highlighting
→ Oder Link zu externem Editor (VSCode, Notepad++)
→ Per FTP editierbar
```

---

### 3. Neue Marker-Typen - Icon-Handling

**Marker erstellen - UI:**

```
┌────────────────────────────────────────┐
│ Neuen Marker-Typ erstellen             │
├────────────────────────────────────────┤
│ ID (technisch):                        │
│ [h200________________]                 │
│ Nur Kleinbuchstaben, Zahlen, _        │
│                                        │
│ Bezeichnung:                           │
│ [H200 Hydrant________]                 │
│                                        │
│ Farbe:                                 │
│ [#FFFF00] 🎨 Farbwähler                │
│                                        │
│ Icon:                                  │
│ ○ markericon_rot.png     ⬤            │
│ ○ markericon_blau.png    ⬤            │
│ ○ markericon_gruen.png   ⬤            │
│ ○ markericon_aqua.png    ⬤            │
│ ○ markericon_gelb.png    ⬤            │
│ ● markericon_orange.png  ⬤ ← Neu      │
│                                        │
│ [📁 Eigenes Icon hochladen]            │
│ PNG/JPEG, transparent empfohlen        │
│ Max. 100 KB, wird auf 25x41px skaliert│
│                                        │
│ Vorschau:                              │
│ [🗺️  H200 Hydrant]                    │
├────────────────────────────────────────┤
│ [Abbrechen]  [Speichern]               │
└────────────────────────────────────────┘
```

**Icon-Upload-Handler:**

```php
// api/upload.php

function uploadMarkerIcon($file) {
    // Validierung
    $allowedTypes = ['image/png', 'image/jpeg'];
    if (!in_array($file['type'], $allowedTypes)) {
        throw new ApiError(
            "Ungültiger Dateityp: Nur PNG und JPEG erlaubt",
            "UPLOAD_INVALID_TYPE",
            400,
            ['type' => $file['type'], 'allowed' => $allowedTypes]
        );
    }
    
    if ($file['size'] > 100 * 1024) { // 100 KB
        throw new ApiError(
            "Datei zu groß: Max. 100 KB erlaubt",
            "UPLOAD_TOO_LARGE",
            400,
            ['size_kb' => round($file['size'] / 1024, 2), 'max_kb' => 100]
        );
    }
    
    // Bild laden
    $img = imagecreatefromstring(file_get_contents($file['tmp_name']));
    
    // Auf 25x41px skalieren (Leaflet-Standard)
    $resized = imagescale($img, 25, 41, IMG_BICUBIC);
    
    // Als PNG speichern (für Transparenz)
    $filename = 'markericon_' . uniqid() . '.png';
    $path = "icons/{$filename}";
    imagepng($resized, $path);
    
    imagedestroy($img);
    imagedestroy($resized);
    
    return $filename;
}
```

**Standard-Icons mitgeliefert:**

```
/icons/
├── markericon_rot.png       # H80 (Rot)
├── markericon_blau.png      # H100 (Blau)
├── markericon.png           # H125 (Hellblau)
├── markericon_gruen.png     # H150 (Grün)
├── markericon_aqua.png      # Reservoir (Aqua)
├── markericon_gelb.png      # ← NEU
├── markericon_orange.png    # ← NEU
├── markericon_lila.png      # ← NEU
└── markericon_grau.png      # ← NEU
```

---

### 4. Detaillierte Fehlermeldungen

#### Backend: Error-Handling-System

**api/common.php:**

```php
<?php

class ApiError extends Exception {
    public $code;
    public $httpStatus;
    public $details;
    
    public function __construct($message, $code, $httpStatus = 500, $details = []) {
        parent::__construct($message);
        $this->code = $code;
        $this->httpStatus = $httpStatus;
        $this->details = $details;
    }
    
    public function toArray() {
        return [
            'success' => false,
            'error' => $this->getMessage(),
            'code' => $this->code,
            'timestamp' => date('c'),
            'details' => $this->details
        ];
    }
}

function handleError($e) {
    // Logging
    logError($e);
    
    // HTTP Status
    http_response_code($e->httpStatus ?? 500);
    
    // Response
    $response = $e->toArray();
    
    // In Development: Stack-Trace
    if (isDevelopmentMode()) {
        $response['debug'] = [
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => explode("\n", $e->getTraceAsString())
        ];
    }
    
    echo json_encode($response);
    exit;
}

function isDevelopmentMode() {
    return file_exists('.development') || 
           (isset($GLOBALS['config']['app']['debug']) && $GLOBALS['config']['app']['debug']);
}

function logError($error) {
    $logEntry = [
        'timestamp' => date('c'),
        'code' => $error->code ?? 'UNKNOWN',
        'message' => $error->getMessage(),
        'file' => $error->getFile(),
        'line' => $error->getLine(),
        'user' => $_SESSION['username'] ?? 'anonymous',
        'url' => $_SERVER['REQUEST_URI'] ?? 'CLI',
        'details' => $error->details ?? []
    ];
    
    $logFile = 'data/logs/errors_' . date('Y-m') . '.json';
    
    if (!file_exists($logFile)) {
        file_put_contents($logFile, json_encode(['errors' => []]));
    }
    
    $logs = json_decode(file_get_contents($logFile), true);
    $logs['errors'][] = $logEntry;
    file_put_contents($logFile, json_encode($logs, JSON_PRETTY_PRINT));
}

// Global Error Handler
set_exception_handler('handleError');
```

#### Error-Code-Katalog (vollständig)

```php
// api/error_codes.php

const ERROR_CODES = [
    // Authentication (401)
    'AUTH_FAILED' => [
        'message' => 'Anmeldung fehlgeschlagen',
        'solution' => 'Bitte prüfen Sie Benutzername und Passwort'
    ],
    'SESSION_EXPIRED' => [
        'message' => 'Ihre Sitzung ist abgelaufen',
        'solution' => 'Bitte melden Sie sich erneut an'
    ],
    'ACCOUNT_LOCKED' => [
        'message' => 'Konto gesperrt',
        'solution' => 'Zu viele Fehlversuche. Bitte warten Sie 15 Minuten.'
    ],
    
    // Authorization (403)
    'PERMISSION_DENIED' => [
        'message' => 'Keine Berechtigung',
        'solution' => 'Sie haben keine Berechtigung für diese Aktion'
    ],
    'EDITOR_CANNOT_DELETE_USER' => [
        'message' => 'Editoren dürfen keine Benutzer löschen',
        'solution' => 'Kontaktieren Sie einen Administrator'
    ],
    
    // Validation (400)
    'VALIDATION_ERROR' => [
        'message' => 'Ungültige Eingabe',
        'solution' => 'Bitte korrigieren Sie Ihre Eingabe'
    ],
    'LATITUDE_OUT_OF_RANGE' => [
        'message' => 'Latitude muss zwischen -90 und 90 liegen',
        'solution' => 'Klicken Sie auf die Karte um eine gültige Position zu wählen'
    ],
    'LONGITUDE_OUT_OF_RANGE' => [
        'message' => 'Longitude muss zwischen -180 und 180 liegen',
        'solution' => 'Klicken Sie auf die Karte um eine gültige Position zu wählen'
    ],
    'PASSWORD_TOO_WEAK' => [
        'message' => 'Passwort zu schwach',
        'solution' => 'Mindestens 8 Zeichen, inkl. Groß-/Kleinbuchstaben und Zahlen'
    ],
    'USERNAME_INVALID' => [
        'message' => 'Ungültiger Benutzername',
        'solution' => '3-20 Zeichen, nur Buchstaben, Zahlen und Unterstrich'
    ],
    
    // File System (500)
    'FILE_NOT_WRITABLE' => [
        'message' => 'Datei kann nicht geschrieben werden',
        'solution' => 'Bitte setzen Sie die Schreibrechte für /data/ auf 755'
    ],
    'FILE_NOT_FOUND' => [
        'message' => 'Datei nicht gefunden',
        'solution' => 'Die Datei existiert nicht oder wurde gelöscht'
    ],
    'DIRECTORY_NOT_WRITABLE' => [
        'message' => 'Ordner nicht schreibbar',
        'solution' => 'Setzen Sie Rechte auf 755: chmod 755 /data/'
    ],
    
    // JSON (500)
    'JSON_PARSE_ERROR' => [
        'message' => 'JSON-Datei fehlerhaft',
        'solution' => 'Die Datei enthält ungültiges JSON. Prüfen Sie die Syntax oder stellen Sie ein Backup wieder her.'
    ],
    'JSON_ENCODE_ERROR' => [
        'message' => 'Fehler beim JSON-Encoding',
        'solution' => 'Die Daten können nicht als JSON gespeichert werden'
    ],
    
    // Disk Space (507)
    'DISK_SPACE_LOW' => [
        'message' => 'Nicht genug Speicherplatz',
        'solution' => 'Bitte löschen Sie alte Snapshots oder Logs'
    ],
    
    // Upload (400/413)
    'UPLOAD_TOO_LARGE' => [
        'message' => 'Datei zu groß',
        'solution' => 'Max. Dateigröße: 5 MB'
    ],
    'UPLOAD_INVALID_TYPE' => [
        'message' => 'Ungültiger Dateityp',
        'solution' => 'Nur JPEG und PNG erlaubt'
    ],
    'UPLOAD_FAILED' => [
        'message' => 'Upload fehlgeschlagen',
        'solution' => 'Bitte versuchen Sie es erneut oder verwenden Sie eine kleinere Datei'
    ],
    
    // Entities (404/409)
    'HYDRANT_NOT_FOUND' => [
        'message' => 'Hydrant nicht gefunden',
        'solution' => 'Der Hydrant existiert nicht oder wurde bereits gelöscht'
    ],
    'HYDRANT_ID_EXISTS' => [
        'message' => 'Hydrant-ID bereits vergeben',
        'solution' => 'Bitte wählen Sie eine andere ID'
    ],
    'USER_NOT_FOUND' => [
        'message' => 'Benutzer nicht gefunden',
        'solution' => 'Der Benutzer existiert nicht'
    ],
    'USERNAME_EXISTS' => [
        'message' => 'Benutzername bereits vergeben',
        'solution' => 'Bitte wählen Sie einen anderen Benutzernamen'
    ],
    'MARKER_TYPE_NOT_FOUND' => [
        'message' => 'Marker-Typ nicht gefunden',
        'solution' => 'Der Marker-Typ existiert nicht'
    ],
    'MARKER_TYPE_IN_USE' => [
        'message' => 'Marker-Typ wird noch verwendet',
        'solution' => 'Löschen Sie zuerst alle Hydranten dieses Typs'
    ],
    
    // Snapshots (404/409)
    'SNAPSHOT_NOT_FOUND' => [
        'message' => 'Snapshot nicht gefunden',
        'solution' => 'Der Snapshot existiert nicht oder wurde gelöscht'
    ],
    'SNAPSHOT_LIMIT_REACHED' => [
        'message' => 'Snapshot-Limit erreicht',
        'solution' => 'Heute wurde bereits ein Snapshot erstellt (max. 1 pro Tag)'
    ],
    
    // Config (400)
    'CONFIG_INVALID' => [
        'message' => 'Ungültige Konfiguration',
        'solution' => 'Bitte prüfen Sie die Konfigurationswerte'
    ]
];
```

#### Frontend: Benutzerfreundliche Fehleranzeige

```javascript
// js/admin.js

async function handleApiError(response) {
    let error;
    
    try {
        error = await response.json();
    } catch (e) {
        error = {
            error: 'Server antwortet nicht korrekt',
            code: 'NETWORK_ERROR'
        };
    }
    
    showErrorModal(error);
}

function showErrorModal(error) {
    const errorMessages = {
        'AUTH_FAILED': {
            icon: '🔒',
            title: 'Anmeldung fehlgeschlagen',
            solution: 'Bitte prüfen Sie Benutzername und Passwort'
        },
        'FILE_NOT_WRITABLE': {
            icon: '⚠️',
            title: 'Speichern nicht möglich',
            solution: 'Die Datei kann nicht geschrieben werden',
            action: 'Rechte für /data/ auf 755 setzen'
        },
        'DISK_SPACE_LOW': {
            icon: '💾',
            title: 'Speicherplatz knapp',
            solution: 'Nicht genug Speicherplatz für Snapshot',
            action: 'Alte Snapshots oder Logs löschen'
        },
        // ... weitere
    };
    
    const info = errorMessages[error.code] || {
        icon: '❌',
        title: 'Fehler',
        solution: error.error
    };
    
    const modal = document.getElementById('errorModal');
    modal.innerHTML = `
        <div class="error-modal-content">
            <span class="error-icon">${info.icon}</span>
            <h2>${info.title}</h2>
            <p class="error-message">${info.solution}</p>
            
            ${info.action ? `
                <div class="error-action">
                    <strong>💡 Lösung:</strong> ${info.action}
                </div>
            ` : ''}
            
            <details class="error-details">
                <summary>📋 Technische Details (für Support)</summary>
                <pre>${JSON.stringify(error, null, 2)}</pre>
                <button onclick="copyToClipboard(this.previousElementSibling.textContent)">
                    📋 Kopieren
                </button>
            </details>
            
            <div class="error-actions">
                <button class="btn-primary" onclick="closeErrorModal()">
                    OK
                </button>
                ${error.debug ? `
                    <button class="btn-secondary" onclick="toggleDebugInfo()">
                        🐛 Debug-Info
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}
```

---

## 📋 Zusammenfassung der Änderungen

| # | Änderung | Auswirkung |
|---|----------|------------|
| 1 | Snapshots konfigurierbar | Admin kann Anzahl an Webspace anpassen |
| 2 | Datenschutz/Impressum im Setup | Automatische Generierung, nachträglich editierbar |
| 3 | Marker-Icons hochladbar | Admin kann eigene Icons verwenden, Standard-Set erweitert |
| 4 | Detaillierte Fehlermeldungen | Klare Fehlerursachen, Lösungsvorschläge, Debug-Info |

---

## ✅ Nächste Schritte

Alle Punkte sind jetzt geklärt und dokumentiert!

**Bereit für Phase 1?** 🚀

