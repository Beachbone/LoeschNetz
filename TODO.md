# Entwicklungs-Status - Hydrant-PWA

## ✅ Phase 0: Planung & Architektur (FERTIG)

- [x] Anforderungsanalyse
- [x] System-Architektur
- [x] Datenbank-Schema
- [x] API-Spezifikation
- [x] Sicherheitskonzept
- [x] DSGVO-Compliance
- [x] Dokumentation

## 🔜 Phase 1: Core Public PWA (3-4 Tage)

### Infrastruktur
- [ ] Projekt-Setup (Ordnerstruktur) ✅ (erledigt)
- [ ] Leaflet.js 1.9.4 lokal hosten
- [ ] Icons kopieren (aus /mnt/project/)

### PWA-Grundlagen
- [ ] `manifest.json` erstellen
- [ ] Service Worker implementieren
  - [ ] Cache-Strategie
  - [ ] Offline-Erkennung
  - [ ] Update-Mechanismus
- [ ] IndexedDB-Wrapper

### UI/UX
- [ ] `index.html` (Hauptseite)
- [ ] CSS (Mobile-First)
- [ ] Cookie-Consent-Banner
- [ ] Karten-Initialisierung
- [ ] Marker-Rendering
- [ ] Popup mit Foto

### Testing
- [ ] Desktop (Chrome, Firefox, Edge)
- [ ] Android (Chrome)
- [ ] iOS (Safari)
- [ ] Offline-Funktionalität

**Geschätzte Zeit:** 3-4 Tage

---

## ⏳ Phase 2: Backend & Admin PWA (5-6 Tage)

### Backend-API
- [ ] PHP-Struktur (`api/`)
- [ ] `common.php` (Error-Handling, Auth-Check)
- [ ] `auth.php` (Login, Logout, Session)
- [ ] `hydrants.php` (CRUD)
- [ ] `upload.php` (Foto-Upload)
- [ ] `users.php` (User-Verwaltung)
- [ ] `config.php` (Einstellungen)
- [ ] Security Headers
- [ ] Rate Limiting
- [ ] .htaccess Protection

### JSON-Datenbank
- [ ] CRUD-Funktionen
- [ ] Validierung
- [ ] Atomare Schreiboperationen
- [ ] Backup vor Schreibzugriff

### Admin-Frontend
- [ ] `admin/index.html` (Login)
- [ ] `admin/dashboard.html`
- [ ] Login-Logic
- [ ] Auto-Logout (Inaktivität)
- [ ] Hydranten CRUD UI
- [ ] Foto-Upload mit Canvas-Kompression
- [ ] User-Verwaltung UI
- [ ] Einstellungen UI
- [ ] Multi-User Warnung

### Biometrische Auth
- [ ] WebAuthn Integration
- [ ] Registrierung
- [ ] Login mit Fingerabdruck/Face ID

**Geschätzte Zeit:** 5-6 Tage

---

## ⏳ Phase 3: Log-System & Snapshots (3 Tage)

### Log-System
- [ ] Log-Funktion (3 Level)
- [ ] Log-Rotation
- [ ] Automatische Löschung
- [ ] Log-Viewer UI
- [ ] Filter-Funktionen
- [ ] CSV-Export

### Snapshot-System
- [ ] Snapshot vor Änderungen
- [ ] Rotation (max. konfigurierbar)
- [ ] Daily Limit
- [ ] Snapshot-Liste UI
- [ ] Vorschau-Funktion
- [ ] Wiederherstellung
- [ ] Backup vor Restore

### Error-Handling
- [ ] Detaillierte Error-Codes
- [ ] Error-Modal UI
- [ ] Lösungsvorschläge
- [ ] Debug-Info (Development)
- [ ] Error-Log-Datei

**Geschätzte Zeit:** 3 Tage

---

## ⏳ Phase 4: Installation & Deployment (2.5 Tage)

### Installation
- [ ] `install.php`
  - [ ] System-Checks
  - [ ] ZIP-Entpackung
  - [ ] Fallback für manuell
- [ ] Setup-Wizard (`setup/`)
  - [ ] Schritt 1: System-Check
  - [ ] Schritt 2: Wehr-Daten
  - [ ] Schritt 3: Karten-Config
  - [ ] Schritt 4: Erster Admin
  - [ ] Schritt 5: Rechtliches (Generator)
  - [ ] Schritt 6: Einstellungen
- [ ] Initialisierung (JSON-Files)
- [ ] Aufräumen (Setup-Ordner löschen)

### Rechtliches
- [ ] Datenschutz-Generator
- [ ] Impressum-Generator
- [ ] Template-System

### Backup
- [ ] ZIP-Erstellung
- [ ] Download-Endpoint
- [ ] Ohne User-Daten/Logs

### Deployment-Paket
- [ ] `hydrant-pwa.zip` erstellen
- [ ] Mit `install.php`
- [ ] Testing

**Geschätzte Zeit:** 2.5 Tage

---

## 🎯 Gesamtaufwand

| Phase | Tage | Status |
|-------|------|--------|
| Phase 0: Planung | - | ✅ Fertig |
| Phase 1: Public PWA | 3-4 | 🔜 Nächster |
| Phase 2: Backend & Admin | 5-6 | ⏳ Geplant |
| Phase 3: Logs & Snapshots | 3 | ⏳ Geplant |
| Phase 4: Installation | 2.5 | ⏳ Geplant |
| **Gesamt** | **13.5-15.5 Tage** | |

---

## 📝 Notizen

- Bei 4-6 Stunden/Tag: ~4-6 Wochen Entwicklungszeit
- Testing sollte parallel laufen
- Feedback von Kameraden einholen
- Iterative Verbesserungen

---

**Letztes Update:** November 2025
