# Backend API

Hier kommen die PHP-Backend-Dateien.

## 📁 Struktur (geplant)

```
api/
├── .htaccess            # Nur PHP erlauben
├── index.php            # API-Router
├── common.php           # Hilfsfunktionen, Error-Handling
├── auth.php             # Authentifizierung
├── hydrants.php         # Hydranten CRUD
├── users.php            # User-Verwaltung
├── config.php           # Konfigurations-API
├── upload.php           # Foto-Upload
├── logs.php             # Log-API
├── snapshots.php        # Snapshot-API
├── backup.php           # Backup-Download
└── marker_types.php     # Marker-Typen-Verwaltung
```

## 🔐 Sicherheit

- ✅ Session-basierte Authentifizierung
- ✅ CSRF-Protection
- ✅ Rate Limiting
- ✅ Input-Validierung
- ✅ Security Headers
- ✅ .htaccess Protection

## 📡 API-Endpunkte

Siehe [Dokumentation](../docs/02_DATENBANK_API.md) für Details.

### Authentifizierung
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/check`

### Hydranten
- `GET /api/hydrants`
- `POST /api/hydrants`
- `PUT /api/hydrants/:id`
- `DELETE /api/hydrants/:id`

### User
- `GET /api/users` (Admin only)
- `POST /api/users` (Admin only)
- `PUT /api/users/:id`
- `DELETE /api/users/:id` (Admin only)

### Weitere
- Upload, Config, Logs, Snapshots, Backup, Marker-Types

## 🔜 Status

**Phase 2** - Noch nicht entwickelt

Siehe [TODO.md](../TODO.md) für Details.
