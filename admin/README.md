# Admin PWA

Hier kommen die Dateien für die Admin Progressive Web App.

## 📁 Struktur (geplant)

```
admin/
├── index.html           # Login-Seite
├── dashboard.html       # Haupt-Dashboard
├── manifest-admin.json  # Admin-PWA-Manifest
├── sw-admin.js          # Admin Service Worker
├── css/
│   └── admin.css        # Admin-Styles
└── js/
    ├── admin.js         # Haupt-Admin-Logik
    ├── auth.js          # Authentifizierung
    ├── crud.js          # CRUD-Operationen
    ├── users.js         # User-Verwaltung
    ├── logs.js          # Log-Viewer
    ├── snapshots.js     # Snapshot-Management
    └── settings.js      # Einstellungen
```

## ✨ Features

- ✅ Login (Username/Passwort)
- ✅ Biometrische Auth (WebAuthn)
- ✅ Auto-Logout bei Inaktivität
- ✅ Multi-User Warnung
- ✅ Hydranten CRUD
- ✅ Foto-Upload mit Kompression
- ✅ User-Verwaltung (2 Rollen)
- ✅ Log-Viewer
- ✅ Snapshot-Management
- ✅ Einstellungen

## 🔜 Status

**Phase 2** - Noch nicht entwickelt

Siehe [TODO.md](../TODO.md) für Details.
