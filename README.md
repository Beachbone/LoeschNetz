# LoeschNetz

**Offline-fähige Hydrantenverwaltung für Feuerwehren**

LoeschNetz ist eine Progressive Web App (PWA) zur Verwaltung und Visualisierung von Hydranten und Wasserentnahmestellen auf einer interaktiven Karte. Die Anwendung wurde speziell für die Freiwillige Feuerwehr Kappel entwickelt und bietet umfassende Funktionen zur Erfassung, Verwaltung und Lokalisierung von Wasserentnahmestellen - auch ohne Internetverbindung.

## Hauptmerkmale

- **Offline-First Design** - Funktioniert auch ohne Internetverbindung dank Service Worker
- **Interaktive Karte** - Leaflet.js-basierte Kartenansicht mit mehreren Tile-Layern
- **GPS-Integration** - Präzise Koordinatenerfassung mit 9 Dezimalstellen (~1cm Genauigkeit)
- **Foto-Dokumentation** - Upload und Verwaltung von Hydrantenfotos mit automatischer Komprimierung
- **Automatische Backups** - Tägliche Snapshots mit optionalem Bilder-Backup
- **Einfaches 2-Rollen-System** - Admin und Editor mit klaren Berechtigungen
- **Vollständiges Audit-Log** - Nachvollziehbare CRUD-Operationen
- **PWA-Installation** - Als App auf Desktop und Mobile installierbar

## Features

### Öffentliche Ansicht (Karte)

**Kartenanzeige:**
- Interactive Karte mit Leaflet.js
- Mehrere Kartenebenen (OpenStreetMap, ESRI Satellit)
- Farbcodierte Marker für verschiedene Hydrantentypen
- Marker-Clustering für bessere Übersicht
- Responsive Design für Desktop, Tablet und Mobile

**Navigation & Lokalisierung:**
- GPS-Lokalisierung für schnelle Orientierung
- Kartenausschnitt zentriert auf Nutzerposition
- Zoom- und Pan-Steuerung
- Interaktive Legende mit allen Marker-Typen

**Hydranteninformationen:**
- Detailansicht per Marker-Klick
- Anzeige von: Typ, Titel, Beschreibung, Koordinaten
- Foto-Galerie für jeden Hydranten
- Keine Authentifizierung erforderlich (öffentlicher Lesezugriff)

**Offline-Funktionalität:**
- Zugriff auf zwischengespeicherte Hydrantendaten
- Zuvor geladene Kacheln verfügbar
- Offline-Modus-Indikator
- GPS-Lokalisierung funktioniert offline

### Admin-Bereich

**Hydrantenverwaltung:**
- Vollständige CRUD-Operationen (Erstellen, Lesen, Aktualisieren, Löschen)
- Statistik-Dashboard (Gesamtzahl, Typen, sichtbare Hydranten)
- Sortierbare Tabelle mit erweiterten Filteroptionen
- Suchfunktion über alle Hydranten
- Mobile-optimierte Steuerung

**Hydranteneditor:**
- Interaktive Kartenpositionierung (Marker ziehen oder klicken)
- GPS-unterstützte Koordinateneingabe
- Koordinatenpräzision: 9 Dezimalstellen (~1cm genau)
- Typ-Auswahl aus verfügbaren Marker-Typen
- Titel und Beschreibungsfelder
- Foto-Galerie mit Upload-Funktion

**Marker-Typen-Verwaltung:**
- Eigene Hydrantentypen erstellen und verwalten
- Farb-Codes und Beschreibungen anpassen
- Automatische SVG-Marker-Icon-Generierung
- 7 vorinstallierte Typen:
  - H80, H100, H125 Hydrant (Unterflur)
  - H150 Hydrant (Überflur)
  - Wasserreservoir (Teich, Zisterne)
  - Gebäude (Feuerwehrhaus)
  - Erhöhte Gefahr (Gefahrenstelle)

**Foto-Management:**
- Upload mehrerer Fotos pro Hydrant
- Automatische Bildkomprimierung (max. 1200x800px, 85% Qualität)
- Thumbnail-Generierung (200x200px)
- Foto-Löschung mit Papierkorb-Funktion
- Bereinigungsfunktion für verwaiste Dateien
- Unterstützte Formate: JPEG, PNG, GIF

**Snapshot-System (Backups):**
- Automatische tägliche Backups der Hydrantendatenbank
- Manuelle Snapshot-Erstellung
- Snapshot-Vorschau mit Statistiken
- Daten-Wiederherstellung (nur Admin)
- **NEU:** Bilder-Backup in ZIP-Archiven
- **NEU:** Download von Snapshots als Backup-Dateien
- Konfigurierbare Aufbewahrung (max. 20 Snapshots)
- Getrennte Größenverfolgung für Daten und Bilder

**Benutzerverwaltung:**
- Einfaches 2-Rollen-System (Admin und Editor)
- **Admin:** Volle Kontrolle über Hydranten, Benutzer, Snapshots, Einstellungen
- **Editor:** Verwaltung von Hydranten und Fotos, kein Zugriff auf System-Einstellungen
- Benutzeranlage mit automatischer Passwort-Generierung
- Passwort-Änderungsfunktion
- Session-Management mit Auto-Logout
- Tracking fehlgeschlagener Login-Versuche

**Aktivitätsprotokolle (CRUD-Logs):**
- Vollständiger Audit-Trail aller Datenänderungen
- Protokollierung von: Zeitstempel, Benutzer, Operation, Ressource, Änderungen
- Log-Viewer im Admin-Panel mit Filteroptionen
- Konfigurierbare Aufbewahrung (Standard: 365 Tage)
- Automatische Log-Rotation bei Größenlimit

**Einstellungen:**
- **Karte:** Mittelpunkt, Zoom-Level, Grenzen
- **Organisation:** Name, Kurzname, Logo
- **Theme:** Primärfarbe, Hintergrundfarbe
- **Sicherheit:** Auto-Logout-Zeit, Session-Timeout
- **Fotos:** Max. Abmessungen, Qualität, Dateigröße
- **Snapshots:** Auto-Erstellung, Bilder-Backup
- **Erweitert:** Debug-Modus, Debug-Button
- Echtzeit-Konfigurationsaktualisierung

## Technologie-Stack

### Frontend

- **Vanilla JavaScript (ES6+)** - Keine Framework-Abhängigkeiten
- **HTML5** mit semantischem Markup
- **CSS3** mit responsivem Design
- **Leaflet.js** - Interaktive Kartenbibliothek
- **OpenStreetMap & ESRI ArcGIS** - Karten-Tile-Quellen

### Backend

- **PHP 8.2+** - Server-seitige Logik (ältere Versionen sind out of support)
- **JSON-basierte Dateispeicherung** - Keine Datenbank erforderlich
- **RESTful API** - Standardisierte HTTP-Endpunkte
- **Session-basierte Authentifizierung** - Sichere Anmeldung
- **Bcrypt-Passwort-Hashing** - Sichere Passwortspeicherung

### PWA-Features

- **Service Worker (sw.js)** - Offline-Caching und Funktionalität
- **Web App Manifest** - Installation und Homescreen-Icon
- **Multi-Level-Caching:**
  - Statische Assets (HTML, CSS, JS, Icons)
  - Dynamische Daten (API-Antworten)
  - Bilder und Fotos
  - Karten-Tiles
- **Caching-Strategien:**
  - Cache-First für statische Ressourcen
  - Network-First für API-Aufrufe

## Projektstruktur

```
loeschnetz/
├── admin/                     # Admin-Panel
│   ├── js/                   # Admin JavaScript Module
│   │   ├── admin-auth.js     # Login/Logout/Session
│   │   ├── admin-hydrants.js # Hydrant CRUD UI
│   │   ├── admin-map.js      # Kartenpositionierung
│   │   ├── admin-photos.js   # Foto-Management
│   │   ├── admin-snapshots.js# Snapshot UI
│   │   ├── admin-users.js    # Benutzerverwaltung
│   │   ├── admin-logs.js     # Log-Viewer
│   │   └── ...
│   ├── css/                  # Admin Styling
│   ├── includes/             # PHP Header/Footer Templates
│   └── *.php                 # Admin-Seiten
│
├── api/                       # PHP Backend API
│   ├── auth.php              # Authentifizierung
│   ├── hydrants.php          # Hydrant CRUD
│   ├── snapshots.php         # Backup-Verwaltung
│   ├── photos.php            # Foto-Löschung
│   ├── upload-photo.php      # Foto-Upload
│   ├── users-admin.php       # Benutzerverwaltung
│   ├── config.php            # Konfiguration
│   ├── logs.php              # Aktivitätsprotokolle
│   ├── marker-types.php      # Marker-Typen
│   ├── common.php            # Gemeinsame Funktionen
│   └── ...
│
├── data/                      # Anwendungsdaten (geschützt)
│   ├── hydrants.json         # Hydrantendatenbank
│   ├── marker-types.json     # Typ-Definitionen
│   ├── users.json            # Benutzer-Credentials
│   ├── sessions.json         # Aktive Sessions
│   ├── crud.log              # Aktivitätsprotokoll
│   ├── snapshots/            # Backup-Snapshots
│   │   ├── hydrants_*.json   # Daten-Backups
│   │   └── images_*.zip      # Bilder-Backups
│   └── .htaccess             # Verzeichnisschutz
│
├── uploads/                   # Hydrantenfotos
│   └── hydrants/
│       └── {hydrant_id}/     # Pro-Hydrant-Verzeichnis
│           ├── photo_*.jpg   # Original-Fotos
│           ├── thumbs/       # Thumbnails
│           └── recycle/      # Gelöschte Fotos
│
├── js/                        # Frontend JavaScript
│   └── app.js                # Hauptanwendungslogik
├── css/                       # Frontend Styling
│   └── style.css
├── icons/                     # App-Icons (48-512px)
├── leaflet/                   # Leaflet.js Bibliothek
│
├── index.html                 # Hauptanwendung (Karte)
├── manifest.php               # Dynamisches PWA-Manifest
├── sw.js                      # Service Worker
├── config.json                # Hauptkonfiguration
├── .htaccess                  # Root-Sicherheitsregeln
├── impressum.html             # Impressum
├── datenschutz.html           # Datenschutzerklärung
└── README.md                  # Diese Datei
```

## Installation

### Voraussetzungen

- Webserver (Apache empfohlen) mit mod_rewrite
- **PHP 8.2 oder höher** (ältere Versionen sind out of support)
- Schreibrechte für `/data/`, `/uploads/`, `/admin/`
- HTTPS-Fähigkeit (empfohlen für PWA)
- Moderne Browser mit Service Worker-Unterstützung

### Installationsschritte

1. **Repository klonen oder herunterladen**
   ```bash
   git clone https://github.com/Beachbone/LoeschNetz.git
   cd LoeschNetz
   ```

2. **Webserver konfigurieren**
   - DocumentRoot auf Projektverzeichnis setzen
   - `.htaccess` aktivieren (mod_rewrite)
   - HTTPS einrichten

3. **Konfiguration anpassen**
   - `config.json` bearbeiten:
     - Kartenmittelpunkt und Grenzen festlegen
     - Organisationsinformationen eintragen
     - Theme-Farben anpassen
     - Sicherheitseinstellungen prüfen

4. **Admin-Benutzer anlegen**
   - Im Admin-Panel einloggen (Standard-Credentials aus Dokumentation)
   - Neuen Admin-Benutzer erstellen
   - Standard-Benutzer löschen/deaktivieren

5. **Marker-Typen konfigurieren**
   - Marker-Typen-Editor öffnen
   - Farben und Beschreibungen anpassen
   - Bei Bedarf neue Typen erstellen

6. **Hydranten erfassen**
   - Über Admin-Panel Hydranten hinzufügen
   - GPS-Koordinaten erfassen
   - Fotos hochladen
   - Daten speichern

## Konfiguration

Die zentrale Konfiguration erfolgt über `config.json`:

### Karteneinstellungen
```json
"map": {
  "center": [50.000153, 7.356538],
  "zoom": 10,
  "bounds": [[50.00387, 7.35199], [49.98652, 7.3771]],
  "minZoom": 10,
  "maxZoom": 19,
  "locationZoom": 18
}
```

### Organisation
```json
"organization": {
  "name": "FFW Kappel",
  "shortName": "FFW Kappel",
  "logo": "/icons/icon-192x192.png"
}
```

### Theme
```json
"theme": {
  "primaryColor": "#d32f2f",
  "backgroundColor": "#ffffff"
}
```

### Sicherheit
```json
"security": {
  "autoLogoutMinutes": 30,
  "sessionTimeout": 1800
}
```

### Foto-Einstellungen
```json
"photos": {
  "maxWidth": 1200,
  "maxHeight": 800,
  "quality": 85,
  "maxSizeKb": 512
}
```

### Snapshot-Einstellungen
```json
"snapshots": {
  "enabled": true,
  "maxCount": 20,
  "autoCreate": true,
  "backupImages": true
}
```

## API-Endpunkte

### Öffentliche Endpunkte (keine Auth erforderlich)
- `GET /api/hydrants.php` - Alle Hydranten abrufen
- `GET /api/config.php?public=true` - Öffentliche Konfiguration

### Geschützte Endpunkte (Auth erforderlich)

**Authentifizierung:**
- `POST /api/auth.php/login` - Anmeldung
- `POST /api/auth.php/logout` - Abmeldung
- `GET /api/auth.php/check` - Session-Validierung
- `POST /api/auth.php/change-password` - Passwort ändern

**Hydranten:**
- `POST /api/hydrants.php` - Neuen Hydranten erstellen
- `PUT /api/hydrants.php?id=xxx` - Hydranten aktualisieren
- `DELETE /api/hydrants.php?id=xxx` - Hydranten löschen

**Fotos:**
- `POST /api/upload-photo.php` - Foto hochladen
- `DELETE /api/photos.php?endpoint=delete` - Foto löschen

**Snapshots:**
- `GET /api/snapshots.php?action=list` - Snapshots auflisten
- `POST /api/snapshots.php?action=create` - Snapshot erstellen
- `POST /api/snapshots.php?action=restore` - Snapshot wiederherstellen
- `DELETE /api/snapshots.php?action=delete` - Snapshot löschen
- `GET /api/snapshots.php?action=download` - Snapshot herunterladen

**Weitere Endpunkte:**
- Benutzerverwaltung (`/api/users-admin.php`)
- Marker-Typen (`/api/marker-types.php`)
- Konfiguration (`/api/config.php`)
- Protokolle (`/api/logs.php`)

## Sicherheit

### Authentifizierung & Autorisierung
- Session-basierte Authentifizierung mit sicheren HTTP-only Cookies
- Bcrypt-Passwort-Hashing
- Einfaches 2-Rollen-System (Admin und Editor)
- CSRF-Token-Validierung
- Tracking fehlgeschlagener Login-Versuche
- Automatisches Logout bei Inaktivität

### Datenschutz
- `.htaccess`-Schutz für `/data/` und `/api/`
- JSON-Dateien außerhalb des Web-Root (kein direkter Zugriff)
- Directory Listing deaktiviert
- Entfernung sensibler Daten vor API-Antworten

### HTTP-Sicherheitsheader
- X-Frame-Options: SAMEORIGIN (Clickjacking-Schutz)
- X-XSS-Protection aktiviert
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- HSTS-bereit (für Produktionsumgebung)

### Eingabevalidierung
- Typprüfung aller API-Eingaben
- Dateinamen-Sanitization für Uploads
- Farbformat-Validierung (#RRGGBB)
- Koordinatenpräzisions-Validierung (9 Dezimalstellen)
- ID-Format-Validierung (alphanumerisch, Bindestrich, Unterstrich)

### Datei-Upload-Sicherheit
- Dateityp-Validierung (nur JPEG, PNG, GIF)
- Bildabmessungs-Limits
- Dateigrößen-Limits
- MIME-Type-Verifizierung mit `getimagesize()`
- Eindeutige Dateinamen-Generierung
- Separate Upload-Verzeichnisse pro Hydrant

## Aktuelle Features & Verbesserungen

### Dezember 2025

- **Download-Funktion für Snapshot-Backups** - Snapshots können jetzt als Backup-Dateien heruntergeladen werden
- **Bilder-Backup für Snapshots** - Vollständige Wiederherstellungsfähigkeit inklusive Fotos
- **Koordinaten-Präzision auf 9 Dezimalstellen** - Erhöhte GPS-Genauigkeit (~1cm)
- **HTML5-Validierung angepasst** - Unterstützung für maximale Koordinatenpräzision
- **Marker-Animation-Fix** - Stabilere Marker-Animationen
- **Floating Action Button** - Schnellzugriff zum Erstellen neuer Hydranten
- **PWA-Verbesserungen** - Optimierte Caching-Strategie

## Browser-Unterstützung

- **Chrome/Edge** (empfohlen)
- **Firefox**
- **Safari**
- **Mobile Browser:** iOS Safari, Chrome Mobile

## Datenschutz

Die Anwendung lädt Kartenmaterial von OpenStreetMap und ESRI. Die Nutzer werden über einen Cookie-Banner informiert und müssen der Nutzung externer Dienste zustimmen. Weitere Informationen in der Datenschutzerklärung.

## Lizenz

Dieses Projekt ist unter der [MIT License](LICENSE) lizenziert.

Copyright (c) 2025 Freiwillige Feuerwehr Kappel

Das Projekt darf frei verwendet, modifiziert und weitergegeben werden. Siehe [LICENSE](LICENSE) Datei für Details.

## Support & Entwicklung

**Entwickelt mit:** Vanilla JavaScript, PHP, Leaflet.js
**Projektgröße:** ~45 Code-Dateien, 33MB Gesamtgröße
**Status:** Aktive Entwicklung

---

**LoeschNetz** - Damit jeder Hydrant zählt.
