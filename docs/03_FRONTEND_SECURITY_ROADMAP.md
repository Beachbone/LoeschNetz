# Hydrant-PWA - Architektur-Dokumentation
## Teil 3: Frontend, Logs, Snapshots, Sicherheit & DSGVO

---

## 8. Log-System

### 8.1 Übersicht

3 Stufen der Protokollierung:

| Level | Name | Inhalt | DSGVO | Use-Case |
|-------|------|--------|-------|----------|
| 0 | Aus | Keine Logs | ✅ Keine Daten | Kleine Wehren ohne Bedarf |
| 1 | Anonym | Was/Wann | ✅ Keine Personendaten | Fehlersuche ohne Personenbezug |
| 2 | Mit User | Was/Wann/Wer | ⚠️ Dokumentationspflichtig | Nachvollziehbarkeit für größere Wehren |

### 8.2 Log-Rotation

**Trigger:** Dateigröße > max_size_kb (Standard: 2048 KB)

**Mechanismus:**
```
/data/logs/
├── 2025-01.json      (aktiv, 1.8 MB)
├── 2025-01a.json     (voll, 2 MB) 
├── 2024-12.json      (alt)
└── 2024-11.json      (wird bald gelöscht)
```

**Automatische Löschung:**
- Level 1: Nach 90 Tagen
- Level 2: Nach 365 Tagen

### 8.3 Log-Viewer UI

```
┌────────────────────────────────────────┐
│ Protokolle                             │
├────────────────────────────────────────┤
│ Filter:                                │
│ Zeitraum: [Letzte 7 Tage ▾]          │
│ Aktion:   [Alle ▾]                    │
│ Benutzer: [Alle ▾]                    │
│ [Filtern]  [CSV Export]  [Löschen]   │
├────────────────────────────────────────┤
│ 📊 42 Einträge gefunden                │
├────────────────────────────────────────┤
│ ✏️ 15.01.2025 14:30                    │
│ editor_max hat Hydrant H150-5         │
│ Position geändert                      │
│                                        │
│ ➕ 14.01.2025 09:15                    │
│ admin hat Hydrant H100-42             │
│ Neuer Hydrant angelegt                │
│                                        │
│ ❌ 12.01.2025 16:45                    │
│ editor_max hat Hydrant H80-3          │
│ Hydrant entfernt                       │
└────────────────────────────────────────┘
```

---

## 9. Snapshot-System

### 9.1 Konzept

**Automatische Snapshots von hydrants.json vor Änderungen**

**Regeln:**
- ✅ Max. 1 Snapshot pro Tag (vor erster Änderung)
- ✅ Max. 20 Snapshots gespeichert
- ✅ Älteste werden automatisch gelöscht
- ✅ Nur Hydrantendaten (keine User, keine Logs)
- ✅ DSGVO-safe (keine personenbezogenen Daten)

**Trigger:**
- Automatisch vor jeder CREATE/UPDATE/DELETE Operation
- Manuell durch Admin

### 9.2 Wiederherstellungs-UI

```
┌────────────────────────────────────────┐
│ Snapshots & Wiederherstellung          │
├────────────────────────────────────────┤
│ ℹ️ Automatische Snapshots vor Änderungen│
│ Max. 20 Snapshots, 1 pro Tag           │
├────────────────────────────────────────┤
│ ○ 20.01.2025 14:30 (42 Hydranten)     │
│   [Vorschau] [Wiederherstellen]       │
│                                        │
│ ○ 19.01.2025 09:15 (42 Hydranten)     │
│   [Vorschau] [Wiederherstellen]       │
│                                        │
│ ○ 18.01.2025 16:20 (41 Hydranten)     │
│   [Vorschau] [Wiederherstellen]       │
└────────────────────────────────────────┘

⚠️ WARNUNG: Wiederherstellung überschreibt
   alle aktuellen Hydranten! Automatisches
   Backup wird vorher erstellt.
```

### 9.3 Integration in CRUD

**Beispiel:**
```javascript
async function updateHydrant(id, data) {
    // 1. Snapshot erstellen (automatisch)
    await fetch('/api/snapshots/create', {method: 'POST'});
    
    // 2. Normale Update-Operation
    const response = await fetch(`/api/hydrants/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    
    return await response.json();
}
```

---

## 10. Sicherheit

### 10.1 OWASP Top 10 (2021) - Maßnahmen

#### A01: Broken Access Control

**Maßnahmen:**
- ✅ Jeder API-Call prüft Authentifizierung
- ✅ Rollen-basierte Zugriffskontrolle (Admin/Editor)
- ✅ Session-Validierung
- ✅ CSRF-Token bei State-Changing Operations

**Code-Beispiel:**
```php
function requireAuth() {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        die(json_encode(['error' => 'Nicht authentifiziert']));
    }
    return getUser($_SESSION['user_id']);
}

function requireAdmin() {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        die(json_encode(['error' => 'Keine Berechtigung']));
    }
    return $user;
}
```

#### A02: Cryptographic Failures

**Maßnahmen:**
- ✅ Argon2id Password-Hashing
- ✅ Secure Session-Cookies (HttpOnly, Secure, SameSite=Strict)
- ✅ HTTPS obligatorisch

**Code-Beispiel:**
```php
// Passwort-Hashing
function hashPassword($password) {
    return password_hash($password, PASSWORD_ARGON2ID, [
        'memory_cost' => 65536,  // 64 MB
        'time_cost' => 4,
        'threads' => 1
    ]);
}

// Session-Konfiguration
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => true,      // Nur HTTPS
    'httponly' => true,    // Kein JS-Zugriff
    'samesite' => 'Strict' // CSRF-Protection
]);
```

#### A03: Injection

**Maßnahmen:**
- ✅ Keine SQL-Datenbank (JSON-Flatfiles)
- ✅ Input-Sanitization für alle User-Inputs
- ✅ Output-Encoding

**Code-Beispiel:**
```php
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

// Verwendung
$name = sanitizeInput($_POST['name']);
$description = sanitizeInput($_POST['description']);
```

#### A04: Insecure Design

**Maßnahmen:**
- ✅ Principle of Least Privilege (2 Rollen nur)
- ✅ Fail Secure (bei Fehler → Zugriff verweigern)
- ✅ Rate Limiting bei Login
- ✅ Auto-Logout nach Inaktivität

#### A05: Security Misconfiguration

**Maßnahmen:**
- ✅ .htaccess für /data/ (kein Direktzugriff)
- ✅ .htaccess für /uploads/ (nur Bilder)
- ✅ Error-Reporting aus in Production
- ✅ PHP-Version-Header entfernen
- ✅ Directory Listing deaktiviert

**Code-Beispiele:**

`.htaccess` für `/data/`:
```apache
# /data/.htaccess
Order Deny,Allow
Deny from all
```

`.htaccess` für `/uploads/`:
```apache
# /uploads/.htaccess
<FilesMatch "\.(php|phtml|php3|php4|php5|pl|py|jsp|asp|sh|cgi)$">
    Order Deny,Allow
    Deny from all
</FilesMatch>

# Nur Bilder erlauben
<FilesMatch "\.(jpg|jpeg|png|gif|webp)$">
    Order Allow,Deny
    Allow from all
</FilesMatch>
```

#### A06: Vulnerable Components

**Maßnahmen:**
- ✅ Keine npm-Packages
- ✅ Leaflet.js lokal gehostet (kontrollierte Updates)
- ✅ PHP Standard Library only
- ✅ Keine externen Dependencies

#### A07: Authentication Failures

**Maßnahmen:**
- ✅ Argon2id Password Hashing
- ✅ Rate Limiting (5 Versuche → 15 Min Sperre)
- ✅ Session Fixation Prevention
- ✅ Auto-Logout nach Inaktivität
- ✅ Biometrische Auth optional (WebAuthn)

**Code-Beispiel:**
```php
// Rate Limiting
function checkLoginAttempts($username) {
    $attempts = getLoginAttempts($username);
    $config = $GLOBALS['config']['security'];
    
    if ($attempts['count'] >= $config['max_login_attempts']) {
        $lockoutEnd = $attempts['last_attempt'] + 
                     ($config['lockout_duration_minutes'] * 60);
        
        if (time() < $lockoutEnd) {
            http_response_code(429);
            die(json_encode([
                'error' => 'Zu viele Fehlversuche. Konto gesperrt.',
                'code' => 'ACCOUNT_LOCKED',
                'retry_after' => $lockoutEnd
            ]));
        } else {
            // Sperre abgelaufen, zurücksetzen
            resetLoginAttempts($username);
        }
    }
}
```

#### A08: Software & Data Integrity

**Maßnahmen:**
- ✅ Snapshots vor Änderungen (Daten-Integrität)
- ✅ Log-System (Audit Trail)
- ✅ Versionierung von config.json

#### A09: Logging Failures

**Maßnahmen:**
- ✅ Login-Versuche loggen (optional)
- ✅ Keine sensiblen Daten in Logs (keine Passwörter!)
- ✅ Log-Rotation
- ✅ IP-Anonymisierung möglich (nicht implementiert, da nicht nötig)

#### A10: Server-Side Request Forgery (SSRF)

**Maßnahmen:**
- ✅ Keine User-provided URLs
- ✅ Nur vordefinierte Tile-Server (OSM, Esri)
- ✅ Keine externen HTTP-Requests aus User-Input

### 10.2 Security Headers

**Automatisch gesetzt:**
```php
// api/common.php
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: geolocation=(), microphone=(), camera=()');

// CSP
$csp = "default-src 'self'; 
        script-src 'self'; 
        style-src 'self' 'unsafe-inline'; 
        img-src 'self' data: https://*.openstreetmap.org https://server.arcgisonline.com;
        connect-src 'self';";
header("Content-Security-Policy: $csp");

// HTTPS erzwingen
if (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off') {
    http_response_code(301);
    header('Location: https://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']);
    exit;
}
```

---

## 11. DSGVO-Compliance

### 11.1 Grundprinzipien

#### Datenminimierung
- ✅ Nur Username (kein Klarname, keine Email, keine Telefonnummer)
- ✅ Keine Tracking-Tools
- ✅ Keine Analytics
- ✅ Logs optional

#### Transparenz
- ✅ Cookie-Consent beim ersten Start
- ✅ Datenschutzerklärung verlinkt
- ✅ Klare Kommunikation was gespeichert wird

#### Zweckbindung
- ✅ Daten nur für Hydrantenverwaltung
- ✅ Keine Weitergabe an Dritte
- ✅ Keine Werbung

### 11.2 Cookie-Consent

**Public PWA - Einmalig bei Installation:**

```html
<div id="cookieConsent" class="cookie-banner">
    <h3>🍪 Diese App nutzt Kartenmaterial</h3>
    <p>
        Um Hydranten anzuzeigen, lädt diese App Kartenmaterial 
        von <strong>OpenStreetMap.org</strong>. 
        Dabei wird Ihre IP-Adresse übertragen.
    </p>
    <p><strong>Es werden keine Tracking-Tools verwendet.</strong></p>
    <div class="cookie-buttons">
        <button id="acceptCookies">Akzeptieren</button>
        <button id="declineCookies">Ablehnen</button>
        <a href="/datenschutz.html">Mehr erfahren</a>
    </div>
</div>
```

**Bei Ablehnung:**
```
⚠️ Ohne Zustimmung kann die App nicht genutzt werden.

Bitte deinstallieren Sie die App:
- Android: Einstellungen → Apps → Hydrant-PWA → Deinstallieren
- iOS: App gedrückt halten → App entfernen
- Desktop: Adressleiste → ⓘ → App deinstallieren
```

### 11.3 Datenschutzerklärung (Vorlage)

```markdown
# Datenschutzerklärung Hydrant-PWA

## 1. Verantwortlicher
Freiwillige Feuerwehr Kappel-Kludenbach
[Adresse]
[Kontakt]

## 2. Datenverarbeitung

### Public App (ohne Login)
**Erhobene Daten:** Keine personenbezogenen Daten

**Externe Dienste:**
- OpenStreetMap.org (Karten-Tiles)
  - Zweck: Kartendarstellung
  - IP-Übertragung: Ja (technisch notwendig)
  - Rechtsgrundlage: Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)

**Lokale Speicherung:**
- 1 Cookie für DSGVO-Zustimmung (12 Monate)
- Service Worker Cache (Karten, Hydranten)
- Löschung: Durch Deinstallation der App

### Admin-Bereich (mit Login)
**Erhobene Daten:**
- Username (Pseudonym, KEIN Klarname)
- Passwort (verschlüsselt mit Argon2id)
- Login-Zeitstempel
- Änderungen an Hydranten (bei aktiviertem Logging)

**Zweck:** 
- Zugriffskontrolle
- Nachvollziehbarkeit von Änderungen

**Rechtsgrundlage:** 
Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO)
- Gewährleistung der Einsatzfähigkeit der Feuerwehr

**Speicherdauer:**
- Account: Bis zur Löschung durch Admin
- Logs: 90 Tage (Level 1) / 365 Tage (Level 2)

**WICHTIG:** Logs bleiben auch nach Löschung des User-Accounts 
für die volle Dauer erhalten (berechtigtes Interesse).

## 3. Keine Weitergabe an Dritte

Ihre Daten werden nicht an Dritte weitergegeben.

## 4. Ihre Rechte

- **Auskunft** (Art. 15 DSGVO): Übersicht Ihrer gespeicherten Daten
- **Löschung** (Art. 17 DSGVO): Löschung Ihres Accounts
- **Widerspruch** (Art. 21 DSGVO): Widerspruch gegen Datenverarbeitung

Kontakt: [Admin-Email]

Stand: Januar 2025
```

### 11.4 Betroffenenrechte

#### Auskunftsrecht (Art. 15 DSGVO)

**Admin-Panel: "Meine Daten exportieren"**

```json
{
  "account": {
    "username": "editor_max",
    "role": "editor",
    "created_at": "2025-01-16T09:00:00Z",
    "last_login": "2025-01-20T10:00:00Z"
  },
  "logs": [
    // Nur Logs dieses Users (letzte 12 Monate)
  ],
  "note": "Diese Daten werden auch nach Löschung Ihres Accounts für [X Monate] aufbewahrt."
}
```

#### Löschungsrecht (Art. 17 DSGVO)

**Admin kann User löschen:**
- Account wird gelöscht
- Logs bleiben erhalten (berechtigtes Interesse)
- Bearbeitete Hydranten bleiben erhalten

**Begründung für Log-Aufbewahrung:**
```
Art. 17 Abs. 3 lit. b DSGVO:
"Das Recht auf Löschung besteht nicht, soweit die Verarbeitung 
erforderlich ist zur Erfüllung einer rechtlichen Verpflichtung 
oder zur Wahrnehmung einer Aufgabe, die im öffentlichen Interesse liegt."

→ Nachvollziehbarkeit von Änderungen an sicherheitsrelevanten Daten
  dient dem öffentlichen Interesse (Einsatzfähigkeit der Feuerwehr)
```

### 11.5 TOMs (Technische & Organisatorische Maßnahmen)

**Für DSGVO-Dokumentation:**

✅ **Verschlüsselung im Transit:** HTTPS/TLS  
✅ **Verschlüsselung at Rest:** Passwort-Hashing (Argon2id)  
✅ **Zugriffskontrolle:** Login erforderlich, 2 Rollen  
✅ **Session-Timeout:** Auto-Logout nach X Minuten  
✅ **Logging:** Optional, 3 Stufen  
✅ **Backups:** Regelmäßig, ohne User-Daten  
✅ **Datensparsamkeit:** Minimale Erhebung  
✅ **Lokale Verarbeitung:** Server in Deutschland  
✅ **Keine Weitergabe:** An Dritte  
✅ **Löschkonzept:** User-Accounts, Logs rotieren  

---

## 12. Entwicklungs-Roadmap

### Phase 1: Core Public PWA (MVP)
**Ziel:** Offline-fähige Anzeige-App

**Aufgaben:**
- [ ] Projekt-Setup & Ordnerstruktur
- [ ] Leaflet.js 1.9.4 lokal integrieren
- [ ] Service Worker implementieren
- [ ] Web App Manifest
- [ ] Cookie-Consent UI
- [ ] Karten-Initialisierung
- [ ] Marker aus API laden & anzeigen
- [ ] Popup mit Foto
- [ ] Layer-Auswahl (OSM/Satellit)
- [ ] Offline-Handling
- [ ] Testing auf Android/iOS/Desktop

**Geschätzte Zeit:** 3-4 Tage  
**Priorität:** 🔴 Hoch

---

### Phase 2: Backend & Admin PWA
**Ziel:** Daten online bearbeiten

**Aufgaben:**

**2.1 Backend API (2 Tage)**
- [ ] PHP-Struktur aufsetzen
- [ ] Session-Auth implementieren
- [ ] Rate Limiting
- [ ] CRUD-Endpoints für Hydranten
- [ ] User-Verwaltung
- [ ] Config-API
- [ ] Upload-Endpoint
- [ ] Security Headers
- [ ] .htaccess für /data/ und /uploads/

**2.2 Admin Frontend (2-3 Tage)**
- [ ] Login-Screen
- [ ] Dashboard-Layout
- [ ] Karten-Editor (Marker CRUD)
- [ ] Foto-Upload mit Canvas-Kompression
- [ ] User-Verwaltung UI
- [ ] Einstellungen UI
- [ ] Auto-Logout Mechanismus
- [ ] Multi-User Warnung
- [ ] Biometrische Auth (WebAuthn)

**2.3 JSON-Datenbank (1 Tag)**
- [ ] hydrants.json Schema
- [ ] users.json Schema
- [ ] config.json Schema
- [ ] marker_types.json Schema
- [ ] CRUD-Funktionen in PHP
- [ ] Validierung

**Geschätzte Zeit:** 5-6 Tage  
**Priorität:** 🔴 Hoch

---

### Phase 3: Log-System & Snapshots
**Ziel:** Nachvollziehbarkeit & Wiederherstellung

**Aufgaben:**

**3.1 Log-System (1.5 Tage)**
- [ ] Log-Funktion (Level 0/1/2)
- [ ] Log-Rotation nach Größe
- [ ] Automatische Löschung nach Retention
- [ ] Log-Viewer UI
- [ ] Filter-Funktionen
- [ ] CSV-Export

**3.2 Snapshot-System (1.5 Tage)**
- [ ] Snapshot-Funktion (vor Änderungen)
- [ ] Max. 1 pro Tag
- [ ] Rotation (max. 20)
- [ ] Snapshot-Liste UI
- [ ] Vorschau-Funktion
- [ ] Wiederherstellungs-Funktion
- [ ] Backup vor Restore

**Geschätzte Zeit:** 3 Tage  
**Priorität:** 🟡 Mittel

---

### Phase 4: Installation & Deployment
**Ziel:** Einfache Installation für Endnutzer

**Aufgaben:**

**4.1 Installation (1 Tag)**
- [ ] install.php erstellen
- [ ] ZIP-Entpack-Logik
- [ ] Fallback für manuell
- [ ] Setup-Wizard
  - [ ] Wehr-Name
  - [ ] Kartenposition
  - [ ] Erster Admin
  - [ ] Einstellungen
- [ ] Initialisierung von JSON-Files

**4.2 Backup-Funktion (0.5 Tage)**
- [ ] ZIP-Erstellung (ohne User/Logs)
- [ ] Download-Endpoint

**4.3 Dokumentation (1 Tag)**
- [ ] README.md
- [ ] INSTALLATION.md
- [ ] SICHERHEIT.md
- [ ] Datenschutzerklärung (Vorlage)
- [ ] Impressum (Vorlage)

**Geschätzte Zeit:** 2.5 Tage  
**Priorität:** 🟡 Mittel

---

### Gesamtaufwand

| Phase | Tage | Priorität |
|-------|------|-----------|
| Phase 1: Core Public PWA | 3-4 | 🔴 Hoch |
| Phase 2: Backend & Admin | 5-6 | 🔴 Hoch |
| Phase 3: Logs & Snapshots | 3 | 🟡 Mittel |
| Phase 4: Installation | 2.5 | 🟡 Mittel |
| **Gesamt** | **13.5-15.5 Tage** | |

**Bei 4-6 Stunden/Tag:** ~4-6 Wochen

---

## 13. Testing-Strategie

### 13.1 Manuelle Tests

**Public PWA:**
- [ ] Installation auf Android
- [ ] Installation auf iOS
- [ ] Installation auf Desktop (Chrome/Edge)
- [ ] Offline-Funktionalität
- [ ] Cookie-Consent (Akzeptieren/Ablehnen)
- [ ] Karte lädt
- [ ] Marker werden angezeigt
- [ ] Popup öffnet sich
- [ ] Foto wird geladen
- [ ] Layer-Wechsel funktioniert

**Admin PWA:**
- [ ] Login funktioniert
- [ ] Falsches Passwort → Fehler
- [ ] 5 Fehlversuche → Sperre 15 Min
- [ ] Biometrische Auth (auf Smartphone)
- [ ] Hydrant erstellen
- [ ] Hydrant bearbeiten
- [ ] Hydrant löschen
- [ ] Foto hochladen
- [ ] User anlegen
- [ ] User löschen
- [ ] Einstellungen ändern
- [ ] Log-Viewer
- [ ] Snapshot erstellen
- [ ] Snapshot wiederherstellen
- [ ] Backup herunterladen
- [ ] Auto-Logout nach 30 Min
- [ ] Multi-User Warnung

### 13.2 Sicherheitstests

- [ ] /data/ direkter Zugriff → 403
- [ ] /uploads/test.php hochladen → nicht ausführbar
- [ ] SQL-Injection Tests (obwohl kein SQL)
- [ ] XSS-Tests (Script-Tags in Inputs)
- [ ] CSRF-Tests
- [ ] Session-Hijacking Tests
- [ ] Brute-Force Login Tests

### 13.3 DSGVO-Tests

- [ ] Cookie-Consent zeigt sich
- [ ] Bei Ablehnung: App nicht nutzbar
- [ ] Datenschutzerklärung verlinkt
- [ ] "Meine Daten exportieren" funktioniert
- [ ] User löschen → Logs bleiben
- [ ] Backup enthält KEINE User-Daten
- [ ] Backup enthält KEINE Logs

---

## 14. Deployment-Checkliste

### 14.1 Vor Go-Live

**Server:**
- [ ] PHP 8.0+ installiert
- [ ] HTTPS/SSL-Zertifikat aktiv
- [ ] Domain korrekt konfiguriert
- [ ] Schreibrechte für /data/ und /uploads/

**Code:**
- [ ] Alle Phasen abgeschlossen
- [ ] Tests durchgeführt
- [ ] Deployment-ZIP erstellt
- [ ] install.php + hydrant-pwa.zip bereit

**Dokumentation:**
- [ ] README.md vollständig
- [ ] INSTALLATION.md geprüft
- [ ] Datenschutzerklärung angepasst (Wehr-Name, Kontakt)
- [ ] Impressum erstellt

### 14.2 Installation durchführen

1. Upload install.php + hydrant-pwa.zip
2. Browser öffnen: https://hydrant.ffw-kappel.de/install.php
3. Setup-Wizard durchlaufen
4. Sicherheits-Checks durchführen

### 14.3 Nach Go-Live

- [ ] Public PWA auf 3 Geräten testen
- [ ] Admin-PWA auf Desktop testen
- [ ] Ersten echten Hydranten anlegen
- [ ] Foto hochladen
- [ ] Backup erstellen
- [ ] Kameraden informieren & einweisen
- [ ] Feedback sammeln

---

## 15. Offene Punkte / Diskussion

### 15.1 Optional für später

Diese Features NICHT im MVP, aber für später diskutierbar:

- [ ] Undo-Funktion (Level 3 Logs mit Snapshots)
- [ ] Mehrere Fotos pro Hydrant
- [ ] Clustering bei >100 Hydranten
- [ ] Export als PDF/KML
- [ ] Push-Notifications bei Änderungen
- [ ] Multi-Tenant (mehrere Wehren auf einer Installation)
- [ ] Offline-Bearbeitung (kompliziert!)
- [ ] Eigene Tile-Server (OSM-Tiles lokal hosten)

### 15.2 Design / UX

- [ ] Logo für PWA
- [ ] Farbschema festlegen (Feuerwehr-Rot?)
- [ ] Icons für Marker (aktuell vorhanden aus altem System)
- [ ] Splash-Screen für PWA

---

## 16. Zusammenfassung

### Was wir gebaut haben (Planung):

**Public PWA:**
✅ Offline-fähige Hydrantenkarte  
✅ Farbcodierte Marker  
✅ DSGVO-konform  
✅ Installierbar auf allen Plattformen  

**Admin PWA:**
✅ Vollständiges CRUD für Hydranten  
✅ User-Verwaltung (2 Rollen)  
✅ Foto-Upload mit Kompression  
✅ Log-System (3 Level)  
✅ Automatische Snapshots  
✅ Wiederherstellungs-Funktion  
✅ Sicher (OWASP Top 10)  

**Technologie:**
✅ Vanilla JS (keine Frameworks)  
✅ PHP 8+ Backend  
✅ JSON-Flatfiles (keine Datenbank)  
✅ Leaflet.js (lokal)  
✅ Läuft auf einfachem Webspace  

**Installation:**
✅ Drag & Drop via install.php  
✅ Setup-Wizard  
✅ <5 Minuten bis fertig  

---

## Nächste Schritte

1. **Feedback zu Architektur einholen** ✅ (Das hier!)
2. **Phase 1 starten:** Public PWA entwickeln
3. **Testing:** Auf echten Geräten testen
4. **Phase 2:** Backend & Admin entwickeln
5. **Phase 3:** Logs & Snapshots
6. **Phase 4:** Installation & Deployment
7. **Go-Live!** 🚀

---

**Ende der Architektur-Dokumentation**

Du hast jetzt eine vollständige Blaupause für die Entwicklung!

