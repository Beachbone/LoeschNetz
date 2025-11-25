# Hydrant-PWA - Architektur-Dokumentation
## Teil 1: Projekt-Überblick & System-Architektur

**Version:** 1.0  
**Datum:** Januar 2025  
**Projekt:** Progressive Web App für Feuerwehr-Hydrantenpläne  
**Auftraggeber:** FFW Kappel-Kludenbach

---

## 1. Projekt-Überblick

### 1.1 Vision

Entwicklung einer modernen, offline-fähigen Progressive Web App zur Verwaltung und Anzeige von Feuerwehr-Hydranten. Die App soll:
- Auf einfachem Webspace laufen
- DSGVO-konform sein
- Von technisch weniger versierten Personen installiert werden können
- Für andere Feuerwehren wiederverwendbar sein

### 1.2 Zielgruppen

**Primär:**
- FFW Kappel-Kludenbach (~50 Hydranten, 2-3 Admins)

**Sekundär:**
- Andere kleine bis mittlere Feuerwehren
- Größere Wehren/Verbände (50-300+ Hydranten, bis zu 10+ Editoren)

### 1.3 Kern-Funktionen

**Public PWA (für alle Kameraden):**
- ✅ Offline-fähige Kartenansicht
- ✅ Farbcodierte Hydranten-Marker (H80/H100/H125/H150/Reservoirs)
- ✅ Detailansicht mit Fotos
- ✅ Installierbar auf Android/iOS/Desktop
- ✅ KEIN Login erforderlich
- ✅ DSGVO-Consent einmalig bei Installation

**Admin PWA (für Berechtigte):**
- ✅ Login (Username/Passwort + Biometrie)
- ✅ CRUD-Operationen für Hydranten
- ✅ Foto-Upload mit automatischer Kompression (max. 800x400px)
- ✅ 2 Rollen: Admin (alles) / Editor (nur Marker CRUD)
- ✅ User-Verwaltung
- ✅ Konfiguration (Kartenausschnitt, Marker-Typen, Log-Level)
- ✅ Protokollierung (3 Level: Aus/Anonym/Mit User)
- ✅ Automatische Snapshots (letzte 20 Tage)
- ✅ Wiederherstellungs-Funktion
- ✅ Manuelles Backup (ohne User-Daten)
- ✅ Auto-Logout nach Inaktivität
- ✅ Multi-User Warnung

### 1.4 Kern-Prinzipien (KISS)

1. **Einfachheit über alles**
   - Drag & Drop Installation via install.php + ZIP
   - Keine Build-Tools, kein npm, kein Composer
   - Funktioniert sofort nach Upload

2. **Sicherheit**
   - OWASP Top 10 addressiert
   - Argon2id Password-Hashing
   - HTTPS obligatorisch
   - CSRF/XSS Protection

3. **DSGVO by Design**
   - Minimale Datenerhebung
   - Keine Tracking-Tools
   - Transparent
   - Betroffenenrechte erfüllbar

4. **Offline-First**
   - Public PWA funktioniert komplett offline (Anzeige)
   - Admin nur online (Bearbeitung)

5. **Wiederverwendbarkeit**
   - Andere Wehren können es nutzen
   - Gut dokumentiert
   - Konfigurierbar

---

## 2. Anforderungen

### 2.1 Funktionale Anforderungen

#### Public PWA
- [x] Kartenansicht mit Leaflet.js 1.9.4
- [x] Offline-Funktionalität (Service Worker + IndexedDB)
- [x] Farbcodierte Marker nach Typ
- [x] Popup mit Foto und Beschreibung
- [x] Layer-Auswahl (OSM/Satellit)
- [x] Installierbar als PWA
- [x] DSGVO-Cookie-Consent (einmalig, bei Ablehnung nicht nutzbar)
- [x] Responsive Design (Mobile-First)

#### Admin PWA
- [x] Login (Session-basiert)
- [x] Biometrische Authentifizierung (WebAuthn)
- [x] Auto-Logout nach X Minuten
- [x] Multi-User Warnung bei gleichzeitigem Login
- [x] Hydranten CRUD
- [x] Foto-Upload (Client-seitige Kompression)
- [x] User-Verwaltung (2 Rollen: Admin/Editor)
- [x] Marker-Typen konfigurierbar
- [x] Grundkonfiguration (Karte, Log-Level, Foto-Größe, etc.)
- [x] Log-System (Level 0/1/2)
- [x] Log-Viewer mit Filter
- [x] Automatische Snapshots vor Änderungen
- [x] Wiederherstellungs-UI
- [x] Manuelles Backup (ohne User-Daten/Logs)

### 2.2 Nicht-Funktionale Anforderungen

#### Performance
- Public PWA lädt in <3 Sekunden
- Admin PWA lädt in <5 Sekunden
- Offline-Modus sofort verfügbar

#### Sicherheit
- HTTPS obligatorisch
- OWASP Top 10 (2021) addressiert
- Passwort-Hashing: Argon2id
- Rate-Limiting bei Login (5 Versuche, 15 Min Sperre)
- Session-Security (Secure, HttpOnly, SameSite=Strict)

#### DSGVO
- Minimale Datenerhebung (nur Username, kein Klarname!)
- Keine Tracking-Tools (keine Analytics)
- Transparente Cookie-Policy
- Löschkonzept vorhanden
- Betroffenenrechte erfüllbar (Auskunft, Löschung)
- Logs bleiben nach User-Löschung (berechtigtes Interesse)

#### Kompatibilität
- **Server:** PHP 8.0+ (getestet mit 8.2.29)
- **Browser:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** Android 8+, iOS 13+
- **Desktop:** Windows 10+, macOS 11+, Linux

#### Deployment
- Funktioniert auf Standard-Webspace (PHP + Schreibrechte)
- Keine Datenbank-Installation nötig (Flatfiles)
- Installation in <5 Minuten
- Updates via FTP

---

## 3. Technologie-Stack

### 3.1 Frontend

**Core:**
- Vanilla JavaScript (ES6+)
- HTML5
- CSS3 (Custom Properties)

**Libraries (lokal gehostet):**
- Leaflet.js 1.9.4 (Karten)
- Web Authentication API (Biometrie)

**PWA:**
- Service Worker (Offline-Cache)
- Web App Manifest
- IndexedDB (Client-seitige Daten)

### 3.2 Backend

**Core:**
- PHP 8.0+ (Standard Library only)
- JSON-Flatfiles als Datenbank

**KEINE Dependencies:**
- ❌ Kein Composer
- ❌ Kein MySQL/MariaDB
- ❌ Kein ImageMagick/GD (Canvas API im Browser!)
- ❌ Kein Framework
- ❌ Keine npm-Packages

### 3.3 Externe Services

**Notwendig (gecacht):**
- OpenStreetMap Tiles (tile.openstreetmap.org)
- Optional: Esri World Imagery (Satellit)

**NICHT verwendet:**
- ❌ Google Analytics
- ❌ Google Fonts
- ❌ CDNs für Code
- ❌ Tracking-Services

### 3.4 Server-Anforderungen

**Minimum:**
- PHP 8.0+
- HTTPS/SSL (Let's Encrypt)
- Schreibrechte im Webspace
- ~50 MB Speicherplatz

**Optional:**
- ZipArchive Extension (für einfachere Installation)

**Getestet auf:**
- Provider: tralima.de
- PHP: 8.2.29
- Location: Deutschland (DSGVO-safe!)

---

## 4. System-Architektur

### 4.1 Komponenten-Übersicht

```
┌─────────────────────────────────────────────────┐
│              Benutzer                           │
├─────────────┬───────────────────────────────────┤
│ Kameraden   │  Admins/Editoren                  │
│ (Public PWA)│  (Admin PWA)                      │
└──────┬──────┴───────┬───────────────────────────┘
       │              │
       │ HTTPS        │ HTTPS
       │              │
┌──────┴──────────────┴───────────────────────────┐
│         Webspace (tralima.de, Deutschland)      │
│  ┌────────────────────────────────────────────┐ │
│  │  Public PWA (/)                            │ │
│  │  - HTML/CSS/JS                             │ │
│  │  - Service Worker                          │ │
│  │  - Leaflet.js (lokal)                      │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │  Admin PWA (/admin)                        │ │
│  │  - HTML/CSS/JS                             │ │
│  │  - Service Worker                          │ │
│  │  - CRUD UI                                 │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │  Backend API (/api)                        │ │
│  │  - PHP 8.2                                 │ │
│  │  - Session-Auth                            │ │
│  │  - REST-Endpoints                          │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │  Datenbank (/data) - JSON Flatfiles        │ │
│  │  - hydrants.json                           │ │
│  │  - users.json                              │ │
│  │  - config.json                             │ │
│  │  - marker_types.json                       │ │
│  │  - snapshots/ (max. 20)                    │ │
│  │  - logs/ (rotiert)                         │ │
│  │  - .htaccess (Zugriff verweigert!)         │ │
│  └────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────┐ │
│  │  Uploads (/uploads)                        │ │
│  │  - thumbs/ (300x200px)                     │ │
│  │  - full/ (800x400px)                       │ │
│  │  - .htaccess (nur Bilder)                  │ │
│  └────────────────────────────────────────────┘ │
└──────┬───────────────────────────┬──────────────┘
       │                           │
       │ HTTPS                     │ HTTPS
       │                           │
┌──────┴───────────┐      ┌────────┴─────────────┐
│ OpenStreetMap    │      │ Esri World Imagery   │
│ (Karten-Tiles)   │      │ (Satellit)           │
└──────────────────┘      └──────────────────────┘
```

### 4.2 Ordnerstruktur (komplett)

```
/public_html/                     # Webroot
│
├── install.php                   # Installations-Script
├── hydrant-pwa.zip              # Deployment-Paket
│
├── index.html                    # Public PWA Entry
├── manifest.json                 # PWA Manifest
├── sw.js                         # Service Worker
├── datenschutz.html             # Datenschutzerklärung
├── impressum.html               # Impressum
│
├── css/
│   ├── style.css                # Public Styles
│   └── normalize.css            # CSS Reset
│
├── js/
│   ├── app.js                   # Haupt-App
│   ├── map.js                   # Karten-Handling
│   ├── offline.js               # Offline-Detection
│   └── consent.js               # Cookie-Consent
│
├── leaflet/                     # Leaflet.js lokal!
│   ├── leaflet.js
│   ├── leaflet.css
│   └── images/
│
├── icons/                       # Marker-Icons (lokal!)
│   ├── markericon_gruen.png    # H150
│   ├── markericon.png          # H125
│   ├── markericon_blau.png     # H100
│   ├── markericon_rot.png      # H80
│   ├── markericon_aqua.png     # Reservoir
│   └── app-icon-*.png          # PWA Icons
│
├── admin/                       # Admin PWA
│   ├── index.html              # Login
│   ├── dashboard.html          # Haupt-Dashboard
│   ├── manifest-admin.json
│   ├── sw-admin.js
│   ├── css/
│   │   └── admin.css
│   └── js/
│       ├── admin.js            # Admin-Hauptlogik
│       ├── auth.js             # Authentifizierung
│       ├── crud.js             # CRUD-Operationen
│       ├── users.js            # User-Verwaltung
│       ├── logs.js             # Log-Viewer
│       ├── snapshots.js        # Snapshot-Management
│       └── settings.js         # Einstellungen
│
├── api/                         # Backend API
│   ├── .htaccess               # PHP-only
│   ├── index.php               # API-Router
│   ├── common.php              # Hilfsfunktionen
│   ├── auth.php                # Authentifizierung
│   ├── hydrants.php            # Hydranten-CRUD
│   ├── users.php               # User-Verwaltung
│   ├── config.php              # Konfigurations-API
│   ├── upload.php              # Foto-Upload
│   ├── logs.php                # Log-API
│   ├── snapshots.php           # Snapshot-API
│   └── backup.php              # Backup-Download
│
├── data/                        # Datenbank (JSON)
│   ├── .htaccess               # ⚠️ KEIN Direktzugriff!
│   ├── hydrants.json
│   ├── users.json
│   ├── config.json
│   ├── marker_types.json
│   ├── snapshots/
│   │   ├── hydrants_2025-01-20.json
│   │   └── ... (max. 20)
│   └── logs/
│       ├── 2025-01.json
│       └── ... (rotiert)
│
├── uploads/                     # Hochgeladene Fotos
│   ├── .htaccess               # Nur Bilder
│   ├── thumbs/
│   │   └── *.jpg
│   └── full/
│       └── *.jpg
│
└── setup/                       # Setup-Wizard
    ├── index.php               # (wird nach Install gelöscht)
    ├── setup-process.php
    └── setup.css
```

### 4.3 Dateigrößen (geschätzt)

```
Leaflet.js:         ~145 KB
Icons (alle):       ~50 KB
Public PWA Code:    ~30 KB
Admin PWA Code:     ~80 KB
Backend PHP:        ~60 KB
──────────────────────────
App gesamt:         ~365 KB

Pro Hydrant:
- JSON-Eintrag:     ~0.3 KB
- Foto (thumb):     ~30 KB
- Foto (full):      ~150 KB
──────────────────────────
Pro Hydrant:        ~180 KB

50 Hydranten:       ~9 MB
Snapshots (20):     ~1 MB
Logs:               ~0.5 MB
──────────────────────────
Gesamtinstallation: ~11 MB
```

### 4.4 Datenfluss

#### Public PWA (Offline-Szenario)

```
1. User öffnet App
   ↓
2. Service Worker prüft: Online?
   ↓
3a. ONLINE:
    → Lädt hydrants.json von API
    → Speichert in IndexedDB
    → Lädt Marker-Typen
    → Rendert Karte mit Markern
    
3b. OFFLINE:
    → Lädt aus IndexedDB
    → Zeigt "Offline"-Hinweis
    → Rendert Karte mit gecachten Daten
    → Tiles aus Cache
```

#### Admin PWA (Änderungs-Szenario)

```
1. Admin loggt ein
   ↓
2. Session-Cookie erstellt
   ↓
3. Admin bearbeitet Hydrant H100-5
   ↓
4. Klickt "Speichern"
   ↓
5. Frontend: PUT /api/hydrants/h100_005
   ↓
6. Backend:
   a) Session-Check (authentifiziert?)
   b) Rollen-Check (Editor oder Admin?)
   c) Snapshot erstellen (snapshots.php)
   d) Hydrant in hydrants.json updaten
   e) Log-Eintrag schreiben (logs.php)
   f) Response: {success: true}
   ↓
7. Frontend aktualisiert UI
   ↓
8. Auto-Logout-Timer reset
```

---

## 5. Installation & Deployment

### 5.1 Installation via install.php

**Ablauf (5 Minuten):**

```
Schritt 1: Upload
  → install.php
  → hydrant-pwa.zip
  via FTP nach /public_html/

Schritt 2: Browser öffnen
  → https://hydrant.ffw-kappel.de/install.php

Schritt 3: Script prüft automatisch
  ✓ PHP 8.0+?
  ✓ ZipArchive verfügbar?
  ✓ Schreibrechte?

Schritt 4: Automatisches Entpacken
  → hydrant-pwa.zip → alle Dateien
  → install.php löscht sich selbst
  → .zip wird gelöscht
  → Weiterleitung zu /setup/

Schritt 5: Setup-Wizard
  → Wehr-Name eingeben
  → Kartenzentrum festlegen (Klick auf Karte)
  → Start-Zoom wählen
  → Erster Admin-Account anlegen
  → Log-Level wählen
  → Foto-Größe festlegen
  → Auto-Logout Zeit

Schritt 6: Installation abschließen
  → config.json erstellt
  → users.json erstellt (mit erstem Admin)
  → marker_types.json erstellt (Standard-Typen)
  → /setup/ Ordner gelöscht
  → Weiterleitung zu /admin (Login)

Schritt 7: Fertig! 🎉
```

### 5.2 install.php (Code)

```php
<?php
/**
 * Hydrant-PWA Installation Script
 * Entpackt hydrant-pwa.zip und startet Setup
 */

// 1. PHP-Version prüfen
if (version_compare(PHP_VERSION, '8.0.0', '<')) {
    die("❌ PHP 8.0+ erforderlich. Aktuell: " . PHP_VERSION);
}

// 2. HTTPS prüfen (Warnung)
if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off') {
    echo "<div style='background:#ff9800;padding:20px;color:#000;'>
          ⚠️ <strong>Warnung:</strong> HTTPS nicht aktiv! 
          Bitte SSL-Zertifikat installieren bevor Sie weitermachen.
          </div>";
}

// 3. ZipArchive prüfen
if (!class_exists('ZipArchive')) {
    showFallbackInstructions();
    exit;
}

// 4. Schreibrechte prüfen
if (!is_writable('.')) {
    die("❌ Ordner nicht schreibbar. Bitte Rechte auf 755 setzen.");
}

// 5. ZIP-Datei vorhanden?
if (!file_exists('hydrant-pwa.zip')) {
    die("❌ hydrant-pwa.zip nicht gefunden. Bitte hochladen.");
}

// 6. Entpacken
echo "<h2>🚀 Hydrant-PWA Installation</h2>";
echo "<p>Entpacke Dateien...</p>";
flush();

$zip = new ZipArchive;
$result = $zip->open('hydrant-pwa.zip');

if ($result === TRUE) {
    $zip->extractTo('.');
    $zip->close();
    
    echo "<p>✅ Dateien entpackt</p>";
    echo "<p>Räume auf...</p>";
    flush();
    
    // 7. Aufräumen
    unlink('install.php');  // Lösche mich selbst
    unlink('hydrant-pwa.zip');
    
    echo "<p>✅ Installation vorbereitet</p>";
    echo "<p>Weiterleitung zum Setup...</p>";
    
    // 8. Weiterleitung
    header('Refresh: 2; URL=/setup/');
    echo '<p><a href="/setup/">Klicken Sie hier wenn Sie nicht weitergeleitet werden</a></p>';
    
} else {
    die("❌ Fehler beim Entpacken. Code: " . $result);
}

function showFallbackInstructions() {
    ?>
    <!DOCTYPE html>
    <html>
    <head>
        <title>Manuelle Installation</title>
        <style>
            body { font-family: sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            .warning { background: #ff9800; padding: 20px; border-radius: 5px; }
            pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
        </style>
    </head>
    <body>
        <h1>⚠️ ZIP-Erweiterung nicht verfügbar</h1>
        <div class="warning">
            <p>Die PHP-Erweiterung <code>ZipArchive</code> ist auf diesem Server nicht verfügbar.</p>
            <p><strong>Lösung:</strong> Manuelle Installation</p>
        </div>
        
        <h2>Schritte:</h2>
        <ol>
            <li>Entpacken Sie <code>hydrant-pwa.zip</code> auf Ihrem Computer</li>
            <li>Laden Sie alle Dateien per FTP hoch</li>
            <li>Setzen Sie Schreibrechte:
                <pre>chmod 755 data/
chmod 755 data/snapshots/
chmod 755 data/logs/
chmod 755 uploads/
chmod 755 uploads/thumbs/
chmod 755 uploads/full/</pre>
            </li>
            <li>Rufen Sie <code>/setup/</code> im Browser auf</li>
        </ol>
        
        <p><a href="/setup/" style="display:inline-block;background:#2196F3;color:#fff;padding:15px 30px;text-decoration:none;border-radius:5px;">Zum Setup</a></p>
    </body>
    </html>
    <?php
}
?>
```

### 5.3 Fallback: Manuelle Installation

Falls install.php nicht funktioniert:

```markdown
# Manuelle Installation

## Voraussetzungen
- FTP-Zugang zu Ihrem Webspace
- FileZilla oder anderer FTP-Client

## Schritte:

1. **Entpacken**
   - hydrant-pwa.zip auf Ihrem Computer entpacken

2. **Hochladen**
   - Alle Dateien per FTP nach /public_html/ hochladen
   - Dauer: ca. 5-10 Minuten je nach Verbindung

3. **Rechte setzen** (wichtig!)
   ```
   Ordner: 755 (rwxr-xr-x)
   Dateien: 644 (rw-r--r--)
   
   Speziell schreibbar:
   - /data/           → 755
   - /data/snapshots/ → 755
   - /data/logs/      → 755
   - /uploads/        → 755
   - /uploads/thumbs/ → 755
   - /uploads/full/   → 755
   ```

4. **.htaccess prüfen**
   - /data/.htaccess muss vorhanden sein
   - /uploads/.htaccess muss vorhanden sein

5. **Setup aufrufen**
   - Browser: https://hydrant.ffw-kappel.de/setup/

6. **Wizard durchlaufen**
   - Wehr-Name
   - Kartenposition
   - Admin-Account
   - Einstellungen

7. **Fertig!**
```

### 5.4 Sicherheits-Checkliste nach Installation

```
□ HTTPS funktioniert?
  → https://hydrant.ffw-kappel.de
  → Grünes Schloss im Browser?
  → Kein Zertifikatsfehler?

□ /data/ nicht erreichbar?
  → https://hydrant.ffw-kappel.de/data/users.json
  → Muss 403 Forbidden zeigen!

□ /uploads/ nur Bilder ausführbar?
  → Upload test.php → Darf nicht ausgeführt werden

□ Admin-Login funktioniert?
  → https://hydrant.ffw-kappel.de/admin
  → Mit Setup-Credentials einloggen

□ Public PWA installierbar?
  → Auf Smartphone öffnen
  → "Zum Startbildschirm" Option verfügbar?

□ Karte lädt?
  → OSM-Tiles werden geladen?
  → Marker werden angezeigt?

□ /setup/ Ordner gelöscht?
  → Muss nach Installation automatisch entfernt sein
```

---

**Fortsetzung in Teil 2:** Datenbank-Schema, API-Spezifikation, Frontend-Details

