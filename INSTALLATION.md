# Installations-Anleitung - Hydrant-PWA

## 📋 Voraussetzungen

Bevor du startest, stelle sicher dass:
- ✅ Du Zugang zu deinem Webspace hast (FTP oder SSH)
- ✅ PHP 8.0+ installiert ist
- ✅ HTTPS/SSL-Zertifikat aktiv ist (Let's Encrypt)
- ✅ ~50 MB Speicherplatz verfügbar sind

## 🚀 Schnellinstallation (5 Minuten)

### Schritt 1: Dateien hochladen

1. **Lade das komplette Repository herunter** (als ZIP)
2. **Entpacke es lokal**
3. **Lade per FTP hoch:**
   - Alle Dateien nach `/public_html/` (oder dein Webroot)
   - Achte darauf dass die Ordnerstruktur erhalten bleibt

### Schritt 2: Browser öffnen

```
https://deine-domain.de/setup/
```

Falls deine Domain noch nicht fertig ist, kannst du auch die IP verwenden.

### Schritt 3: Setup-Wizard

Der Wizard führt dich durch 6 Schritte:

#### Schritt 1: System-Check ✅
- Prüft PHP-Version
- Prüft Schreibrechte
- Prüft benötigte Extensions

#### Schritt 2: Wehr-Daten 🚒
- Name deiner Feuerwehr
- Kontakt-Email

#### Schritt 3: Karten-Konfiguration 🗺️
- Klicke auf die Karte um den Mittelpunkt zu setzen
- Wähle den Start-Zoom
- Setze die Begrenzungen (Bounds)

#### Schritt 4: Erster Admin 👤
- Benutzername (Pseudonym, KEIN Klarname!)
- Sicheres Passwort
- Bestätigung

#### Schritt 5: Rechtliches 📄
- Datenschutzerklärung-Daten eingeben
- Impressum-Daten eingeben
- Vorlagen werden automatisch generiert

#### Schritt 6: Einstellungen ⚙️
- Log-Level (Standard: 1 - Anonym)
- Auto-Logout Zeit (Standard: 30 Min)
- Foto-Größe (Standard: 800x400px)
- Snapshot-Anzahl (Standard: 20)

### Schritt 4: Installation abschließen

- Klicke auf "Installation abschließen"
- Warte bis alles fertig ist
- Du wirst automatisch zum Admin-Login weitergeleitet

### Schritt 5: Erste Schritte 🎉

1. **Admin-Login:**
   ```
   https://deine-domain.de/admin/
   ```
   Mit deinen Setup-Credentials

2. **Ersten Hydranten anlegen:**
   - Klicke auf Karte
   - Typ auswählen
   - Name & Beschreibung eingeben
   - Optional: Foto hochladen
   - Speichern

3. **Public App testen:**
   ```
   https://deine-domain.de/
   ```
   - Öffne auf Smartphone
   - "Zum Startbildschirm hinzufügen"
   - Cookie-Consent akzeptieren
   - Fertig! 🚀

---

## 🔧 Manuelle Installation (falls Setup nicht funktioniert)

### 1. Ordner-Rechte setzen

Per FTP oder SSH:

```bash
chmod 755 data/
chmod 755 data/snapshots/
chmod 755 data/logs/
chmod 755 uploads/
chmod 755 uploads/thumbs/
chmod 755 uploads/full/
```

### 2. Datenbank-Dateien erstellen

Kopiere die Example-Dateien:

```bash
cd data/
cp hydrants.example.json hydrants.json
cp config.example.json config.json
cp marker_types.example.json marker_types.json
```

### 3. config.json anpassen

Öffne `data/config.json` und passe an:
- `app.wehr_name`
- `app.contact_email`
- `map.center` (deine Koordinaten)
- `map.bounds` (dein Gebiet)

### 4. Ersten Admin anlegen

Erstelle `data/users.json`:

```json
{
  "version": "1.0",
  "users": [
    {
      "id": "uuid-1234-5678-abcd",
      "username": "admin",
      "password_hash": "$argon2id$v=19$m=65536,t=4,p=1$...",
      "role": "admin",
      "force_password_change": false,
      "created_at": "2025-11-25T10:00:00Z",
      "last_login": null,
      "biometric_registered": false
    }
  ]
}
```

**Wichtig:** Du musst den `password_hash` selbst generieren:

```php
<?php
// hash.php
echo password_hash('dein-passwort', PASSWORD_ARGON2ID, [
    'memory_cost' => 65536,
    'time_cost' => 4,
    'threads' => 1
]);
?>
```

Führe aus:
```bash
php hash.php
```

Kopiere den Hash in `users.json`.

### 5. Datenschutz & Impressum erstellen

Erstelle `datenschutz.html` und `impressum.html` manuell oder nutze die Vorlagen aus `/docs/`.

---

## ✅ Post-Installation Checks

Nach der Installation prüfe:

### 1. Sicherheit

- [ ] HTTPS funktioniert (grünes Schloss)?
- [ ] `/data/` nicht erreichbar (403)?
  ```
  https://deine-domain.de/data/users.json
  → Muss 403 Forbidden zeigen!
  ```
- [ ] `/uploads/` nur Bilder ausführbar?
- [ ] Admin-Login funktioniert?

### 2. Funktionalität

- [ ] Public PWA lädt?
- [ ] Karte wird angezeigt?
- [ ] Marker werden angezeigt?
- [ ] Admin-Panel erreichbar?
- [ ] Hydrant kann angelegt werden?
- [ ] Foto-Upload funktioniert?

### 3. PWA

- [ ] Auf Smartphone: "Zum Startbildschirm" verfügbar?
- [ ] Cookie-Consent erscheint?
- [ ] Offline-Modus funktioniert?

---

## 🐛 Troubleshooting

### Problem: Setup-Wizard lädt nicht

**Lösung:**
- Prüfe PHP-Version: `php -v` (muss 8.0+)
- Prüfe Error-Log: `error_log` oder `php_errors.log`
- Setze Rechte: `chmod 755 setup/`

### Problem: /data/ ist erreichbar

**Lösung:**
- Prüfe ob `.htaccess` hochgeladen wurde
- Bei Apache: `AllowOverride All` in vhost config
- Bei nginx: Eigene Location-Block nötig

### Problem: Fotos werden nicht hochgeladen

**Lösung:**
- Prüfe Rechte: `chmod 755 uploads/`
- Prüfe PHP upload_max_filesize: `php.ini`
- Prüfe freien Speicherplatz

### Problem: Session läuft sofort ab

**Lösung:**
- Prüfe Cookie-Settings in Browser
- Prüfe ob HTTPS aktiv ist (Secure-Cookies!)
- Prüfe PHP session.cookie_secure in `php.ini`

---

## 📞 Support

Bei Problemen:
1. Prüfe die [Dokumentation](/docs/)
2. Schau in die Error-Logs
3. Kontaktiere deinen Webspace-Provider

---

## 🔄 Updates

### Automatisch (in Zukunft)

Ein Update-Mechanismus ist geplant.

### Manuell

1. Backup erstellen (Admin-Panel → Backup)
2. Neue Dateien hochladen (überschreiben)
3. Browser-Cache leeren
4. Testen

**Wichtig:** `data/` NICHT überschreiben!

---

**Viel Erfolg!** 🚒🚀
