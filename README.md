# LoeschNetz

**Offline-fähige Hydrantenverwaltung für Feuerwehren**

LoeschNetz ist eine Progressive Web App (PWA) zur Verwaltung und Visualisierung von Hydranten auf einer interaktiven Karte. Die Anwendung wurde speziell für Feuerwehren entwickelt und bietet umfassende Funktionen zur Erfassung, Verwaltung und Lokalisierung von Wasserentnahmestellen.

## Features

### Öffentliche Ansicht
- **Interactive Karte** mit Leaflet.js
- **Mehrere Kartenebenen** (OpenStreetMap, Satellit)
- **Marker-basierte Darstellung** verschiedener Hydrantentypen
- **Offline-Fähigkeit** durch Service Worker
- **GPS-Lokalisierung** für schnelle Orientierung
- **Responsive Design** für Desktop, Tablet und Mobile

### Admin-Bereich
- **Hydrantenverwaltung** - Anlegen, Bearbeiten und Löschen von Hydranten
- **Marker-Typen** - Verwaltung verschiedener Hydrantentypen mit individuellen Farben und Icons
- **Foto-Upload** - Anhängen von Fotos an Hydranten mit automatischer Komprimierung
- **Benutzerverwaltung** - Multi-User-System mit Rollen (Admin/User)
- **Snapshots** - Automatische Backups der Hydrantendatenbank
- **Aktivitätsprotokolle** - Nachvollziehbare CRUD-Operationen
- **Einstellungen** - Anpassbare Konfiguration (Kartenausschnitt, Organisation, Theme, etc.)

## Technologie-Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Kartenbibliothek**: Leaflet.js
- **Backend**: PHP 7.4+
- **Datenspeicherung**: JSON-basierte Dateien
- **PWA**: Service Worker, Web App Manifest
- **Authentifizierung**: Session-basiert mit Token

## Struktur

```
loeschnetz/
├── admin/              # Admin-Panel
│   ├── js/            # Admin JavaScript Module
│   └── css/           # Admin Styling
├── api/               # PHP Backend API
├── data/              # JSON Datenspeicher
├── uploads/           # Hochgeladene Hydrantenfotos
├── icons/             # App-Icons und Marker
├── leaflet/           # Leaflet.js Bibliothek
├── js/                # Frontend JavaScript
├── css/               # Frontend Styling
├── index.html         # Hauptanwendung (Karte)
└── config.json        # Konfigurationsdatei
```

## Installation

1. Repository klonen oder herunterladen
2. Webserver (Apache/Nginx) mit PHP 7.4+ konfigurieren
3. `config.json` anpassen (Kartenmittelpunkt, Organisation, etc.)
4. Standardbenutzer über Admin-Panel anlegen
5. Hydranten über die Admin-Oberfläche erfassen

## Konfiguration

Die zentrale Konfiguration erfolgt über `config.json`:

- **Map**: Kartenmittelpunkt, Zoom-Level, Grenzen
- **Organization**: Name und Logo der Feuerwehr
- **Theme**: Primärfarbe und Hintergrundfarbe
- **Security**: Auto-Logout, Session-Timeout
- **Logging**: Protokollierung von Änderungen
- **Snapshots**: Automatische Backups
- **Photos**: Bildkomprimierung und -größe

## Sicherheit

- Session-basierte Authentifizierung
- Geschützter Admin-Bereich
- Automatisches Logout nach Inaktivität
- CRUD-Logging für Nachvollziehbarkeit
- `.htaccess`-geschützte Datenverzeichnisse

## Datenschutz

Die Anwendung lädt Kartenmaterial von OpenStreetMap. Die Nutzer werden über einen Cookie-Banner informiert und müssen der Nutzung zustimmen.

## Browser-Unterstützung

- Chrome/Edge (empfohlen)
- Firefox
- Safari
- Mobile Browser (iOS Safari, Chrome Mobile)

## Lizenz

Dieses Projekt wurde für die Freiwillige Feuerwehr Kappel entwickelt.

---

**LoeschNetz** - Damit jeder Hydrant zählt.
