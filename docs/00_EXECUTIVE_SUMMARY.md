# Hydrant-PWA - Executive Summary & Quick Reference

**Version:** 1.0  
**Stand:** Januar 2025  
**Projekt:** Progressive Web App für Feuerwehr-Hydrantenpläne

---

## 📋 Dokumentation-Übersicht

Die komplette Architektur-Dokumentation ist in 3 Teile aufgeteilt:

1. **[Teil 1: Projekt-Überblick & System-Architektur](01_ARCHITEKTUR_Ueberblick.md)**
   - Vision & Anforderungen
   - Technologie-Stack
   - System-Architektur & Ordnerstruktur
   - Installation & Deployment

2. **[Teil 2: Datenbank-Schema & API](02_DATENBANK_API.md)**
   - JSON-Flatfile-Schema (alle Dateien)
   - Komplette API-Spezifikation (alle Endpoints)
   - Request/Response-Formate

3. **[Teil 3: Frontend, Security & Roadmap](03_FRONTEND_SECURITY_ROADMAP.md)**
   - Log-System (3 Level)
   - Snapshot-System
   - OWASP Top 10 Sicherheitsmaßnahmen
   - DSGVO-Compliance
   - Entwicklungs-Roadmap
   - Testing-Strategie

---

## 🎯 Projekt auf einen Blick

### Was wird gebaut?

Eine **Progressive Web App** zur Verwaltung von Feuerwehr-Hydranten mit:
- **Public PWA:** Offline-fähige Kartenansicht für alle Kameraden (KEIN Login)
- **Admin PWA:** Verwaltungs-Interface für Admins/Editoren (MIT Login)

### Für wen?

**Primär:** FFW Kappel-Kludenbach  
**Sekundär:** Andere kleine bis mittlere Feuerwehren (wiederverwendbar)

### Kern-Prinzipien (KISS)

1. ✅ **Einfachheit:** Drag & Drop Installation, keine Build-Tools
2. ✅ **Sicherheit:** OWASP Top 10, Argon2id, HTTPS
3. ✅ **DSGVO:** Minimale Daten, keine Tracking-Tools
4. ✅ **Offline-First:** Public PWA funktioniert ohne Internet
5. ✅ **Wiederverwendbar:** Für andere Wehren nutzbar

---

## 🛠️ Technologie-Stack

| Komponente | Technologie | Warum? |
|------------|-------------|---------|
| **Frontend** | Vanilla JS (ES6+) | Keine Dependencies |
| **Karten** | Leaflet.js 1.9.4 (lokal) | Bewährt, leichtgewichtig |
| **Backend** | PHP 8.0+ | Standard auf Webspace |
| **Datenbank** | JSON-Flatfiles | Keine Installation nötig |
| **PWA** | Service Worker + Manifest | Offline + Installierbar |
| **Auth** | Session + WebAuthn | Sicher + Biometrie |
| **Bilder** | Canvas API | Kompression im Browser |

**Keine externen Runtime-Dependencies!**

---

## 📦 Features-Übersicht

### Public PWA (für alle)

- [x] Offline-fähige Kartenansicht
- [x] Farbcodierte Marker (H80/H100/H125/H150/Reservoir)
- [x] Popup mit Foto & Beschreibung
- [x] Layer-Auswahl (OSM/Satellit)
- [x] Installierbar auf Android/iOS/Desktop
- [x] DSGVO-Cookie-Consent (einmalig)
- [x] Kein Login erforderlich

### Admin PWA (für Berechtigte)

**Authentifizierung:**
- [x] Login (Username/Passwort)
- [x] Biometrische Auth (WebAuthn, optional)
- [x] Auto-Logout nach X Minuten
- [x] Multi-User Warnung
- [x] 2 Rollen: Admin / Editor

**Hydranten-Verwaltung:**
- [x] CRUD (Create/Read/Update/Delete)
- [x] Foto-Upload (max. 800x400px, Client-seitig komprimiert)
- [x] Drag & Drop auf Karte

**Administration:**
- [x] User-Verwaltung (CRUD, Rollen)
- [x] Konfiguration (Karte, Marker-Typen, Einstellungen)
- [x] Protokollierung (3 Level: Aus/Anonym/Mit User)
- [x] Log-Viewer mit Filter
- [x] Automatische Snapshots (letzte 20 Tage)
- [x] Wiederherstellungs-Funktion
- [x] Manuelles Backup (ohne User-Daten)

---

## 📊 Datenbank-Schema (JSON)

```
/data/
├── hydrants.json          # Hydranten-Daten
├── users.json             # User-Accounts (OHNE persönliche Daten!)
├── config.json            # App-Konfiguration
├── marker_types.json      # Marker-Kategorien
├── snapshots/             # Automatische Backups (max. 20)
│   └── hydrants_YYYY-MM-DD.json
└── logs/                  # Protokolle (rotiert nach Größe)
    └── YYYY-MM.json
```

**Wichtig:** Keine SQL-Datenbank! Alles in JSON-Dateien.

---

## 🔐 Sicherheit

### OWASP Top 10 (2021) addressiert

| Risiko | Maßnahme |
|--------|----------|
| A01: Broken Access Control | Session-Auth, Rollen-Check |
| A02: Cryptographic Failures | Argon2id, Secure Cookies, HTTPS |
| A03: Injection | Input-Sanitization, kein SQL |
| A04: Insecure Design | Fail Secure, Rate Limiting |
| A05: Security Misconfiguration | .htaccess, Headers, Error-Handling |
| A06: Vulnerable Components | Keine npm, Leaflet lokal |
| A07: Authentication Failures | Rate Limiting, Auto-Logout, WebAuthn |
| A08: Software Integrity | Snapshots, Logs |
| A09: Logging Failures | Optionales Logging, keine sensitiven Daten |
| A10: SSRF | Keine User-URLs, nur vordefinierte Tiles |

### Security Headers (automatisch)

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy
- HTTPS erzwungen

---

## 🛡️ DSGVO-Compliance

### Datenminimierung

- ✅ **Public PWA:** Keine personenbezogenen Daten
- ✅ **Admin PWA:** Nur Username (KEIN Klarname, keine Email!)
- ✅ **Logs:** Optional, 3 Stufen
- ✅ **Keine Tracking-Tools**

### Cookie-Consent

- Einmalig bei Installation der Public PWA
- Bei Ablehnung: App nicht nutzbar
- Klare Kommunikation über externe Ressourcen (OSM-Tiles)

### Betroffenenrechte

- **Auskunft:** "Meine Daten exportieren" im Admin-Panel
- **Löschung:** Admin kann User löschen (Logs bleiben - berechtigtes Interesse)
- **Widerspruch:** Möglich, Kontakt zum Admin

### Logs nach User-Löschung

Logs bleiben nach User-Löschung erhalten:
- **Rechtsgrundlage:** Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)
- **Zweck:** Nachvollziehbarkeit sicherheitsrelevanter Änderungen
- **Aufbewahrung:** 90 Tage (Level 1) / 365 Tage (Level 2)

---

## 🗓️ Entwicklungs-Roadmap

| Phase | Aufgaben | Tage | Priorität |
|-------|----------|------|-----------|
| **1: Core Public PWA** | Offline-App, Karte, Marker | 3-4 | 🔴 Hoch |
| **2: Backend & Admin** | PHP-API, Admin-UI, CRUD | 5-6 | 🔴 Hoch |
| **3: Logs & Snapshots** | Protokollierung, Wiederherstellung | 3 | 🟡 Mittel |
| **4: Installation** | install.php, Setup-Wizard, Doku | 2.5 | 🟡 Mittel |

**Gesamt:** 13.5-15.5 Tage (ca. 4-6 Wochen bei 4-6 Std/Tag)

---

## 🚀 Installation (Endnutzer-Perspektive)

### 5-Minuten-Installation

```
1. Upload via FTP:
   - install.php
   - hydrant-pwa.zip

2. Browser öffnen:
   https://hydrant.ffw-kappel.de/install.php

3. Script prüft automatisch:
   ✓ PHP 8.0+?
   ✓ ZipArchive?
   ✓ Schreibrechte?

4. Automatisches Entpacken
   → install.php löscht sich
   → Weiterleitung zu /setup/

5. Setup-Wizard:
   - Wehr-Name
   - Kartenposition (Klick auf Karte)
   - Erster Admin-Account
   - Einstellungen

6. Fertig! 🎉
```

### Fallback: Manuelle Installation

Falls install.php nicht funktioniert:
1. ZIP lokal entpacken
2. Alle Dateien per FTP hochladen
3. Rechte setzen (755 für /data/ und /uploads/)
4. /setup/ im Browser aufrufen

---

## 📝 API-Endpoints (Übersicht)

### Authentifizierung
- `POST /api/auth/login` - Anmelden
- `POST /api/auth/logout` - Abmelden
- `GET /api/auth/check` - Session prüfen
- `POST /api/auth/change-password` - Passwort ändern
- `POST /api/auth/register-biometric` - WebAuthn registrieren

### Hydranten
- `GET /api/hydrants` - Alle Hydranten
- `GET /api/hydrants/:id` - Einzelner Hydrant
- `POST /api/hydrants` - Neu erstellen
- `PUT /api/hydrants/:id` - Aktualisieren
- `DELETE /api/hydrants/:id` - Löschen

### Upload
- `POST /api/upload` - Foto hochladen

### User-Verwaltung (nur Admin)
- `GET /api/users` - Alle User
- `POST /api/users` - User erstellen
- `PUT /api/users/:id` - User aktualisieren
- `DELETE /api/users/:id` - User löschen

### Konfiguration
- `GET /api/config` - Konfiguration abrufen
- `PUT /api/config` - Konfiguration ändern (nur Admin)

### Logs (nur Admin)
- `GET /api/logs` - Logs abrufen
- `GET /api/logs/download` - Als Datei
- `DELETE /api/logs/:month` - Log-Datei löschen

### Snapshots
- `GET /api/snapshots` - Alle Snapshots
- `GET /api/snapshots/:date` - Einzelner Snapshot
- `POST /api/snapshots/create` - Manuell erstellen
- `POST /api/snapshots/restore` - Wiederherstellen (nur Admin)

### Backup
- `GET /api/backup` - Backup herunterladen (ZIP)

### Marker-Typen
- `GET /api/marker-types` - Alle Typen
- `POST /api/marker-types` - Typ erstellen (nur Admin)
- `PUT /api/marker-types/:id` - Typ ändern (nur Admin)
- `DELETE /api/marker-types/:id` - Typ löschen (nur Admin)

---

## 🧪 Testing-Checkliste

### Funktional

**Public PWA:**
- [ ] Installation auf Android/iOS/Desktop
- [ ] Offline-Funktionalität
- [ ] Cookie-Consent (Akzeptieren/Ablehnen)
- [ ] Karte lädt, Marker angezeigt
- [ ] Popup mit Foto

**Admin PWA:**
- [ ] Login/Logout
- [ ] Rate Limiting (5 Versuche)
- [ ] Biometrische Auth
- [ ] CRUD für Hydranten
- [ ] Foto-Upload
- [ ] User-Verwaltung
- [ ] Logs & Snapshots
- [ ] Auto-Logout
- [ ] Backup

### Sicherheit
- [ ] /data/ nicht erreichbar (403)
- [ ] /uploads/ nur Bilder
- [ ] XSS/CSRF Tests
- [ ] Brute-Force Tests

### DSGVO
- [ ] Cookie-Consent funktioniert
- [ ] "Meine Daten exportieren"
- [ ] Backup ohne User-Daten
- [ ] Logs bleiben nach User-Löschung

---

## 📚 Weitere Ressourcen

### Dokumentation
- [Detaillierte Architektur](01_ARCHITEKTUR_Ueberblick.md)
- [Datenbank & API](02_DATENBANK_API.md)
- [Security & DSGVO](03_FRONTEND_SECURITY_ROADMAP.md)

### Externe Links
- [Leaflet.js Docs](https://leafletjs.com/)
- [Web Authentication API](https://webauthn.io/)
- [OWASP Top 10](https://owasp.org/Top10/)
- [DSGVO Info](https://dsgvo-gesetz.de/)

---

## 🎯 Nächste Schritte

1. ✅ **Architektur finalisiert** (Das hier!)
2. 🔜 **Phase 1 starten:** Public PWA entwickeln
3. ⏳ Testing
4. ⏳ Phase 2-4
5. ⏳ Go-Live! 🚀

---

## 💬 Offene Fragen / Diskussion

Alles aus der Planungsphase ist geklärt:
- ✅ Flatfiles (JSON)
- ✅ 2 Rollen (Admin/Editor)
- ✅ Log-System (3 Level)
- ✅ Snapshots (automatisch, max. 20)
- ✅ DSGVO-konform
- ✅ Installation via install.php
- ✅ Foto-Größe konfigurierbar
- ✅ KEIN Undo (Snapshots reichen)

**Bereit für Implementierung!** 🚀

---

**Ende Executive Summary**

