# Hydrant-PWA
In Entwicklung. Noch ohne Funktion!!

**Progressive Web App zur Verwaltung von Feuerwehr-Hydranten**

Version: 1.0  
Stand: November 2025

## 📋 Über das Projekt

Eine moderne, offline-fähige Web-App zur Verwaltung und Anzeige von Feuerwehr-Hydranten mit:
- **Public PWA:** Kartenansicht für alle Kameraden (offline-fähig, kein Login)
- **Admin PWA:** Verwaltungs-Interface für Admins/Editoren (mit Login)

## ✨ Features

### Public App
- ✅ Offline-fähige Kartenansicht
- ✅ Farbcodierte Marker (H80/H100/H125/H150/Reservoir)
- ✅ Popup mit Foto & Beschreibung
- ✅ Installierbar auf allen Plattformen
- ✅ DSGVO-konform

### Admin App
- ✅ Vollständiges CRUD für Hydranten
- ✅ User-Verwaltung (Admin/Editor-Rollen)
- ✅ Foto-Upload mit automatischer Kompression
- ✅ Log-System (3 Stufen)
- ✅ Automatische Snapshots
- ✅ Wiederherstellungs-Funktion
- ✅ Biometrische Authentifizierung (WebAuthn)

## 🛠️ Technologie

- **Frontend:** Vanilla JavaScript (ES6+)
- **Karten:** Leaflet.js 1.9.4 (lokal gehostet)
- **Backend:** PHP 8.0+
- **Datenbank:** JSON-Flatfiles
- **PWA:** Service Worker + Web App Manifest

## 📦 Installation

### Voraussetzungen
- Webspace mit PHP 8.0+
- HTTPS/SSL-Zertifikat
- ~50 MB Speicherplatz
- Schreibrechte für Ordner

### Schnellinstallation (5 Minuten)

1. **Dateien hochladen:**
   ```
   install.php
   hydrant-pwa.zip
   ```
   Via FTP in dein Webspace-Root hochladen

2. **Browser öffnen:**
   ```
   https://deine-domain.de/install.php
   ```

3. **Setup-Wizard durchlaufen:**
   - Wehr-Name eingeben
   - Kartenposition festlegen
   - Ersten Admin-Account anlegen
   - Einstellungen konfigurieren

4. **Fertig!** 🎉

### Manuelle Installation

Falls `install.php` nicht funktioniert:

1. Alle Dateien aus diesem Repository hochladen
2. Ordner-Rechte setzen:
   ```bash
   chmod 755 data/
   chmod 755 data/snapshots/
   chmod 755 data/logs/
   chmod 755 uploads/
   chmod 755 uploads/thumbs/
   chmod 755 uploads/full/
   ```
3. Browser öffnen: `https://deine-domain.de/setup/`

## 📚 Dokumentation

Vollständige Dokumentation in `/docs/`:
- [Executive Summary](docs/00_EXECUTIVE_SUMMARY.md)
- [Architektur-Übersicht](docs/01_ARCHITEKTUR_Ueberblick.md)
- [Datenbank & API](docs/02_DATENBANK_API.md)
- [Security & Roadmap](docs/03_FRONTEND_SECURITY_ROADMAP.md)
- [Ergänzungen](docs/04_ERGAENZUNGEN.md)

## 🔐 Sicherheit

- ✅ OWASP Top 10 (2021) addressiert
- ✅ Argon2id Password-Hashing
- ✅ Rate Limiting
- ✅ HTTPS obligatorisch
- ✅ Security Headers
- ✅ .htaccess Protection

## 🛡️ DSGVO-Compliance

- ✅ Minimale Datenerhebung
- ✅ Keine Tracking-Tools
- ✅ Cookie-Consent
- ✅ Betroffenenrechte erfüllbar
- ✅ Server in Deutschland

## 📁 Projektstruktur

```
hydrant-pwa/
├── docs/              # Dokumentation
├── public/            # Public PWA
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── manifest.json
│   └── sw.js
├── admin/             # Admin PWA
│   ├── css/
│   ├── js/
│   ├── index.html
│   └── dashboard.html
├── api/               # Backend (PHP)
│   ├── index.php
│   ├── auth.php
│   ├── hydrants.php
│   └── ...
├── data/              # JSON-Datenbank
│   ├── hydrants.json
│   ├── users.json
│   ├── config.json
│   ├── snapshots/
│   └── logs/
├── uploads/           # Fotos
│   ├── thumbs/
│   └── full/
├── icons/             # Marker-Icons
├── leaflet/           # Leaflet.js (lokal)
├── setup/             # Setup-Wizard
└── install.php        # Installations-Script
```

## 🚀 Entwicklungs-Status

### ✅ Fertig: Architektur & Planung
- [x] Komplette Architektur dokumentiert
- [x] API-Spezifikation
- [x] Datenbank-Schema
- [x] Sicherheitskonzept
- [x] DSGVO-Compliance

### 🔜 In Arbeit: Phase 1 - Public PWA
- [ ] Leaflet.js Integration
- [ ] Service Worker
- [ ] Offline-Funktionalität
- [ ] PWA-Manifest
- [ ] Cookie-Consent

### ⏳ Geplant: Phase 2-4
- Phase 2: Backend & Admin PWA
- Phase 3: Log-System & Snapshots
- Phase 4: Installation & Deployment

## 🤝 Beitragen

Dieses Projekt ist primär für die FFW Kappel-Kludenbach entwickelt, aber wiederverwendbar für andere Feuerwehren.

## 📄 Lizenz

[Noch festzulegen]

## 👥 Kontakt

**Entwickelt für:**  
Freiwillige Feuerwehr Kappel-Kludenbach  
[Kontaktdaten]

## 🙏 Danksagungen

- [Leaflet.js](https://leafletjs.com/) für die Karten-Library
- [OpenStreetMap](https://www.openstreetmap.org/) für die Karten-Tiles
- Alle Feuerwehrkameraden für Feedback und Testing

---

**Stand:** November 2025  
**Version:** 1.0.0-alpha
