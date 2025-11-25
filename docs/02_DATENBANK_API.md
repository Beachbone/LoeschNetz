# Hydrant-PWA - Architektur-Dokumentation
## Teil 2: Datenbank-Schema & API-Spezifikation

---

## 6. Datenbank-Schema (JSON-Flatfiles)

### 6.1 Übersicht

Alle Daten werden in JSON-Dateien in `/data/` gespeichert:

```
/data/
├── hydrants.json          # Hydranten-Daten
├── users.json             # Benutzer-Accounts
├── config.json            # App-Konfiguration
├── marker_types.json      # Marker-Kategorien
├── snapshots/             # Automatische Backups
│   └── hydrants_YYYY-MM-DD.json (max. 20)
└── logs/                  # Protokolle
    └── YYYY-MM.json (rotiert)
```

### 6.2 hydrants.json

**Zweck:** Speichert alle Hydranten und Wasserentnahmestellen

```json
{
  "version": "1.0",
  "last_updated": "2025-01-15T14:30:00Z",
  "hydrants": [
    {
      "id": "h100_001",
      "type": "h100",
      "name": "Gemeindehaus",
      "description": "Mittig auf der Straße",
      "latitude": 50.000378,
      "longitude": 7.357174,
      "photo": "h100_gemeindehaus.jpg",
      "created_at": "2025-01-10T10:00:00Z",
      "updated_at": "2025-01-15T14:30:00Z",
      "created_by": "admin",
      "updated_by": "editor_max"
    }
  ]
}
```

**Felder:**

| Feld | Typ | Beschreibung | Pflicht |
|------|-----|--------------|---------|
| id | string | Eindeutige ID (z.B. h100_001) | Ja |
| type | string | Marker-Typ (referenziert marker_types.json) | Ja |
| name | string | Name/Bezeichnung | Ja |
| description | string | Beschreibung der Lage | Nein |
| latitude | float | GPS-Breitengrad | Ja |
| longitude | float | GPS-Längengrad | Ja |
| photo | string | Dateiname in /uploads/full/ | Nein |
| created_at | ISO-8601 | Erstellungszeitpunkt | Ja |
| updated_at | ISO-8601 | Letzte Änderung | Ja |
| created_by | string | Username des Erstellers | Nein |
| updated_by | string | Username der letzten Änderung | Nein |

### 6.3 users.json

**Zweck:** Benutzer-Accounts (OHNE persönliche Daten!)

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
      "created_at": "2025-01-15T10:00:00Z",
      "last_login": "2025-01-20T14:30:00Z",
      "biometric_registered": true
    },
    {
      "id": "uuid-8765-4321-dcba",
      "username": "editor_max",
      "password_hash": "$argon2id$v=19$m=65536,t=4,p=1$...",
      "role": "editor",
      "force_password_change": true,
      "created_at": "2025-01-16T09:00:00Z",
      "last_login": null,
      "biometric_registered": false
    }
  ]
}
```

**Felder:**

| Feld | Typ | Beschreibung | Pflicht |
|------|-----|--------------|---------|
| id | UUID | Eindeutige User-ID | Ja |
| username | string | Benutzername (Pseudonym!) | Ja |
| password_hash | string | Argon2id Hash | Ja |
| role | enum | "admin" oder "editor" | Ja |
| force_password_change | bool | Beim nächsten Login ändern | Ja |
| created_at | ISO-8601 | Account-Erstellung | Ja |
| last_login | ISO-8601 | Letzter Login | Nein |
| biometric_registered | bool | WebAuthn registriert? | Ja |

**⚠️ Wichtig:** KEINE Email, KEIN Klarname, KEINE Telefonnummer!

### 6.4 config.json

**Zweck:** App-Konfiguration (durch Admin änderbar)

```json
{
  "version": "1.0",
  "app": {
    "wehr_name": "FFW Kappel-Kludenbach",
    "contact_email": "admin@ffw-kappel.de",
    "impressum_url": "/impressum.html",
    "datenschutz_url": "/datenschutz.html"
  },
  "map": {
    "center": [50.000153, 7.356538],
    "zoom": 15,
    "bounds": [
      [50.00387, 7.35199], 
      [49.98652, 7.37710]
    ]
  },
  "photos": {
    "max_width": 800,
    "max_height": 400,
    "jpeg_quality": 85,
    "thumbnail_width": 300,
    "thumbnail_height": 200,
    "thumbnail_quality": 80
  },
  "security": {
    "auto_logout_minutes": 30,
    "max_login_attempts": 5,
    "lockout_duration_minutes": 15,
    "session_lifetime_hours": 24
  },
  "logging": {
    "level": 2,
    "max_size_kb": 2048,
    "retention_days": {
      "level_1": 90,
      "level_2": 365
    },
    "actions": {
      "create": true,
      "update": true,
      "delete": true,
      "login": false
    }
  },
  "snapshots": {
    "enabled": true,
    "max_count": 20,
    "daily_limit": 1
  }
}
```

### 6.5 marker_types.json

**Zweck:** Marker-Kategorien (durch Admin konfigurierbar)

```json
{
  "version": "1.0",
  "types": [
    {
      "id": "h80",
      "label": "H80 Hydrant",
      "icon": "markericon_rot.png",
      "color": "#FF0000",
      "order": 1
    },
    {
      "id": "h100",
      "label": "H100 Hydrant",
      "icon": "markericon_blau.png",
      "color": "#0000FF",
      "order": 2
    },
    {
      "id": "h125",
      "label": "H125 Hydrant",
      "icon": "markericon.png",
      "color": "#3388FF",
      "order": 3
    },
    {
      "id": "h150",
      "label": "H150 Hydrant",
      "icon": "markericon_gruen.png",
      "color": "#00FF00",
      "order": 4
    },
    {
      "id": "reservoir",
      "label": "Wasserreservoir",
      "icon": "markericon_aqua.png",
      "color": "#00FFFF",
      "order": 5
    }
  ]
}
```

### 6.6 Snapshot-Struktur

**Dateien:** `/data/snapshots/hydrants_YYYY-MM-DD.json`

```json
{
  "_snapshot_meta": {
    "created": "2025-01-15T14:30:00Z",
    "hydrant_count": 42,
    "trigger": "before_update",
    "file_size_bytes": 51234
  },
  "version": "1.0",
  "last_updated": "2025-01-15T14:29:58Z",
  "hydrants": [
    // ... komplette hydrants.json zum Zeitpunkt des Snapshots
  ]
}
```

**Regeln:**
- Max. 1 Snapshot pro Tag (vor erster Änderung)
- Max. 20 Snapshots gespeichert
- Älteste werden automatisch gelöscht
- Keine User-Daten enthalten (DSGVO-safe)

### 6.7 Log-Struktur

**Dateien:** `/data/logs/YYYY-MM.json`

```json
{
  "version": "1.0",
  "month": "2025-01",
  "log_level": 2,
  "entries": [
    {
      "timestamp": "2025-01-15T14:30:15Z",
      "action": "create",
      "entity": "hydrant",
      "entity_id": "h100_042",
      "user_id": "uuid-1234",
      "username": "editor_max",
      "details": "Neuer Hydrant H100 angelegt"
    },
    {
      "timestamp": "2025-01-15T16:45:22Z",
      "action": "update",
      "entity": "hydrant",
      "entity_id": "h150_005",
      "user_id": "uuid-8765",
      "username": "admin",
      "details": "Position geändert"
    },
    {
      "timestamp": "2025-01-16T09:12:05Z",
      "action": "delete",
      "entity": "hydrant",
      "entity_id": "h80_003",
      "user_id": "uuid-1234",
      "username": "editor_max",
      "details": "Hydrant entfernt (Neubau)"
    }
  ]
}
```

**Log-Level Felder:**

| Level | Enthält |
|-------|---------|
| 0 (Aus) | Keine Logs |
| 1 (Anonym) | timestamp, action, entity, entity_id, details |
| 2 (Mit User) | Alle Felder (inkl. user_id, username) |

**Rotation:**
- Bei Überschreiten von max_size_kb → neue Datei: 2025-01a.json
- Alte Logs nach retention_days automatisch löschen

---

## 7. API-Spezifikation

### 7.1 Allgemeine Informationen

**Base URL:** `/api/`

**Authentifizierung:** Session-basiert (Cookie)

**Content-Type:** `application/json`

**Standard Response-Format:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional"
}
```

**Error-Format:**
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**HTTP Status Codes:**
- 200: OK
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

### 7.2 Authentifizierung

#### POST /api/auth/login

Benutzer anmelden

**Request:**
```json
{
  "username": "admin",
  "password": "securepassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-1234",
      "username": "admin",
      "role": "admin"
    },
    "session_expires": "2025-01-16T14:30:00Z",
    "force_password_change": false
  }
}
```

**Response (Failure):**
```json
{
  "success": false,
  "error": "Ungültige Anmeldedaten",
  "code": "AUTH_FAILED"
}
```

**Response (Locked):**
```json
{
  "success": false,
  "error": "Zu viele Fehlversuche. Konto gesperrt für 15 Minuten.",
  "code": "ACCOUNT_LOCKED"
}
```

#### POST /api/auth/logout

Benutzer abmelden

**Request:** Keine Body

**Response:**
```json
{
  "success": true,
  "message": "Erfolgreich abgemeldet"
}
```

#### GET /api/auth/check

Session prüfen & aktive User anzeigen

**Response:**
```json
{
  "success": true,
  "data": {
    "logged_in": true,
    "user": {
      "id": "uuid-1234",
      "username": "admin",
      "role": "admin"
    },
    "active_users": [
      {
        "username": "editor_max",
        "last_activity": "2025-01-15T14:25:00Z"
      }
    ]
  }
}
```

#### POST /api/auth/change-password

Passwort ändern

**Request:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword123",
  "confirm_password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Passwort geändert"
}
```

#### POST /api/auth/register-biometric

Biometrische Anmeldung registrieren (WebAuthn)

**Request:**
```json
{
  "credential": { /* WebAuthn PublicKeyCredential */ }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Biometrische Anmeldung registriert"
}
```

### 7.3 Hydranten

#### GET /api/hydrants

Alle Hydranten abrufen

**Query Parameters:**
- `type` (optional): Filter nach Marker-Typ
- `search` (optional): Suche in Name/Beschreibung

**Response:**
```json
{
  "success": true,
  "data": {
    "hydrants": [
      {
        "id": "h100_001",
        "type": "h100",
        "name": "Gemeindehaus",
        "latitude": 50.000378,
        "longitude": 7.357174,
        "photo": "h100_gemeindehaus.jpg"
      }
    ],
    "count": 42
  }
}
```

#### GET /api/hydrants/:id

Einzelnen Hydranten abrufen

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "h100_001",
    "type": "h100",
    "name": "Gemeindehaus",
    "description": "Mittig auf der Straße",
    "latitude": 50.000378,
    "longitude": 7.357174,
    "photo": "h100_gemeindehaus.jpg",
    "created_at": "2025-01-10T10:00:00Z",
    "updated_at": "2025-01-15T14:30:00Z",
    "created_by": "admin",
    "updated_by": "editor_max"
  }
}
```

#### POST /api/hydrants

Neuen Hydranten erstellen

**Berechtigung:** Admin oder Editor

**Request:**
```json
{
  "type": "h100",
  "name": "Neuer Hydrant",
  "description": "Vor dem Rathaus",
  "latitude": 50.001234,
  "longitude": 7.365432
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "h100_043",
    "created_at": "2025-01-20T10:30:00Z"
  },
  "message": "Hydrant erstellt"
}
```

**Automatisch:**
- Snapshot wird erstellt (wenn noch keiner heute)
- Log-Eintrag wird geschrieben

#### PUT /api/hydrants/:id

Hydranten aktualisieren

**Berechtigung:** Admin oder Editor

**Request:**
```json
{
  "name": "Hydrant Rathaus",
  "description": "Direkt vor dem Haupteingang",
  "latitude": 50.001235,
  "longitude": 7.365433
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hydrant aktualisiert"
}
```

#### DELETE /api/hydrants/:id

Hydranten löschen

**Berechtigung:** Admin oder Editor

**Response:**
```json
{
  "success": true,
  "message": "Hydrant gelöscht"
}
```

### 7.4 Foto-Upload

#### POST /api/upload

Foto hochladen

**Berechtigung:** Admin oder Editor

**Request:** `multipart/form-data`
```
file: [JPEG Binary]
hydrant_id: "h100_043"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "h100_043_20250120.jpg",
    "thumbnail": "h100_043_20250120_thumb.jpg",
    "size_bytes": 45120,
    "dimensions": {
      "full": "800x400",
      "thumb": "300x200"
    }
  }
}
```

**Hinweis:** Foto wird im Browser komprimiert, bevor es hochgeladen wird!

### 7.5 User-Verwaltung

#### GET /api/users

Alle Benutzer abrufen

**Berechtigung:** Nur Admin

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid-1234",
        "username": "admin",
        "role": "admin",
        "created_at": "2025-01-15T10:00:00Z",
        "last_login": "2025-01-20T14:30:00Z",
        "biometric_registered": true
      },
      {
        "id": "uuid-5678",
        "username": "editor_max",
        "role": "editor",
        "created_at": "2025-01-16T09:00:00Z",
        "last_login": null,
        "biometric_registered": false
      }
    ]
  }
}
```

#### POST /api/users

Neuen Benutzer erstellen

**Berechtigung:** Nur Admin

**Request:**
```json
{
  "username": "new_editor",
  "password": "temporarypassword123",
  "role": "editor",
  "force_password_change": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-9999",
    "username": "new_editor"
  },
  "message": "Benutzer erstellt"
}
```

#### PUT /api/users/:id

Benutzer aktualisieren

**Berechtigung:** Admin oder eigener Account

**Request:**
```json
{
  "role": "admin",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Benutzer aktualisiert"
}
```

#### DELETE /api/users/:id

Benutzer löschen

**Berechtigung:** Nur Admin

**Response:**
```json
{
  "success": true,
  "message": "Benutzer gelöscht"
}
```

**Hinweis:** Logs bleiben erhalten (berechtigtes Interesse)

### 7.6 Konfiguration

#### GET /api/config

Konfiguration abrufen

**Berechtigung:** Admin oder Editor

**Response:**
```json
{
  "success": true,
  "data": {
    "app": { ... },
    "map": { ... },
    "photos": { ... },
    "security": { ... },
    "logging": { ... },
    "snapshots": { ... }
  }
}
```

#### PUT /api/config

Konfiguration aktualisieren

**Berechtigung:** Nur Admin

**Request:**
```json
{
  "map": {
    "center": [50.001, 7.357],
    "zoom": 16
  },
  "security": {
    "auto_logout_minutes": 45
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Konfiguration aktualisiert"
}
```

### 7.7 Logs

#### GET /api/logs

Logs abrufen

**Berechtigung:** Nur Admin

**Query Parameters:**
- `month` (optional): "2025-01"
- `action` (optional): "create", "update", "delete"
- `user` (optional): Username
- `limit` (optional): Max. Einträge (default: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "timestamp": "2025-01-15T14:30:15Z",
        "action": "create",
        "entity": "hydrant",
        "entity_id": "h100_042",
        "username": "editor_max",
        "details": "Neuer Hydrant H100 angelegt"
      }
    ],
    "count": 42,
    "log_level": 2
  }
}
```

#### GET /api/logs/download

Logs als Datei herunterladen

**Berechtigung:** Nur Admin

**Query Parameters:** Wie GET /api/logs

**Response:** JSON-Datei zum Download

#### DELETE /api/logs/:month

Log-Datei löschen

**Berechtigung:** Nur Admin

**Response:**
```json
{
  "success": true,
  "message": "Log-Datei 2025-01.json gelöscht"
}
```

### 7.8 Snapshots

#### GET /api/snapshots

Alle Snapshots auflisten

**Berechtigung:** Admin oder Editor

**Response:**
```json
{
  "success": true,
  "data": {
    "snapshots": [
      {
        "filename": "hydrants_2025-01-15.json",
        "date": "2025-01-15",
        "hydrant_count": 42,
        "size_bytes": 51234,
        "created": "2025-01-15T14:30:00Z"
      }
    ],
    "count": 20
  }
}
```

#### GET /api/snapshots/:date

Snapshot-Details abrufen (Vorschau)

**Berechtigung:** Admin oder Editor

**Response:**
```json
{
  "success": true,
  "data": {
    "date": "2025-01-15",
    "hydrant_count": 42,
    "hydrants": [
      // ... Preview (erste 10 Hydranten)
    ]
  }
}
```

#### POST /api/snapshots/create

Manuellen Snapshot erstellen

**Berechtigung:** Admin oder Editor

**Response:**
```json
{
  "success": true,
  "data": {
    "filename": "hydrants_2025-01-20.json",
    "hydrant_count": 43
  },
  "message": "Snapshot erstellt"
}
```

#### POST /api/snapshots/restore

Snapshot wiederherstellen

**Berechtigung:** Nur Admin

**Request:**
```json
{
  "date": "2025-01-15"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Snapshot wiederhergestellt",
  "data": {
    "hydrants_restored": 42,
    "backup_created": "hydrants_2025-01-20.json"
  }
}
```

**Wichtig:** Erstellt automatisch Backup des aktuellen Stands!

### 7.9 Backup

#### GET /api/backup

Manuelles Backup herunterladen

**Berechtigung:** Admin oder Editor

**Response:** ZIP-Datei zum Download

**Inhalt:**
- hydrants.json
- config.json
- marker_types.json
- /uploads/ (alle Fotos)

**NICHT enthalten:**
- users.json (DSGVO!)
- logs/ (DSGVO!)
- snapshots/ (intern)

### 7.10 Marker-Typen

#### GET /api/marker-types

Alle Marker-Typen abrufen

**Response:**
```json
{
  "success": true,
  "data": {
    "types": [
      {
        "id": "h80",
        "label": "H80 Hydrant",
        "icon": "markericon_rot.png",
        "color": "#FF0000",
        "order": 1
      }
    ]
  }
}
```

#### POST /api/marker-types

Neuen Marker-Typ erstellen

**Berechtigung:** Nur Admin

**Request:**
```json
{
  "id": "h200",
  "label": "H200 Hydrant",
  "icon": "markericon_gelb.png",
  "color": "#FFFF00",
  "order": 6
}
```

**Response:**
```json
{
  "success": true,
  "message": "Marker-Typ hinzugefügt"
}
```

#### PUT /api/marker-types/:id

Marker-Typ aktualisieren

**Berechtigung:** Nur Admin

**Request:**
```json
{
  "label": "H200 Hydrant (neu)",
  "color": "#FFD700"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Marker-Typ aktualisiert"
}
```

#### DELETE /api/marker-types/:id

Marker-Typ löschen

**Berechtigung:** Nur Admin

**Response (wenn noch in Benutzung):**
```json
{
  "success": false,
  "error": "Marker-Typ wird noch von 5 Hydranten verwendet",
  "code": "MARKER_IN_USE",
  "data": {
    "hydrant_count": 5
  }
}
```

**Response (erfolgreich):**
```json
{
  "success": true,
  "message": "Marker-Typ gelöscht"
}
```

---

**Fortsetzung in Teil 3:** Frontend-Details, Log-System, Snapshot-System, Sicherheit, DSGVO

