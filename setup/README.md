# Setup-Wizard

Hier kommen die Dateien für den Installations-Wizard.

## 📁 Struktur (geplant)

```
setup/
├── index.php            # Haupt-Wizard
├── setup-process.php    # Verarbeitung
├── setup.css            # Styles
└── templates/
    ├── datenschutz.tpl.html
    └── impressum.tpl.html
```

## 🎯 Funktionen

### 6-Schritte-Wizard

1. **System-Check**
   - PHP-Version ≥ 8.0?
   - Schreibrechte?
   - Extensions vorhanden?

2. **Wehr-Daten**
   - Name der Feuerwehr
   - Kontakt-Email

3. **Karten-Konfiguration**
   - Kartenmittelpunkt (Klick)
   - Start-Zoom
   - Begrenzungen (Bounds)

4. **Erster Admin**
   - Benutzername
   - Passwort
   - Bestätigung

5. **Rechtliches**
   - Datenschutzerklärung (Generator)
   - Impressum (Generator)

6. **Einstellungen**
   - Log-Level
   - Auto-Logout
   - Foto-Größe
   - Snapshot-Anzahl

### Nach Abschluss

- Erstellt `data/config.json`
- Erstellt `data/users.json` (erster Admin)
- Erstellt `data/marker_types.json`
- Generiert `datenschutz.html`
- Generiert `impressum.html`
- **Löscht `/setup/` Ordner**
- Weiterleitung zu `/admin/`

## 🔜 Status

**Phase 4** - Noch nicht entwickelt

Siehe [TODO.md](../TODO.md) für Details.

## ⚠️ Wichtig

Dieser Ordner wird nach erfolgreicher Installation **automatisch gelöscht**!
