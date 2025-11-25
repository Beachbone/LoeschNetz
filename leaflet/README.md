# Leaflet.js

## 📚 Über Leaflet

Leaflet ist eine Open-Source JavaScript-Library für mobile-freundliche interaktive Karten.

**Version:** 1.9.4  
**Lizenz:** BSD-2-Clause  
**Website:** https://leafletjs.com/

## 📥 Download & Installation

### Option 1: Von CDN herunterladen

```bash
# Leaflet JS
wget https://unpkg.com/leaflet@1.9.4/dist/leaflet.js

# Leaflet CSS
wget https://unpkg.com/leaflet@1.9.4/dist/leaflet.css

# Leaflet Images
wget https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png
wget https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png
wget https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png
wget https://unpkg.com/leaflet@1.9.4/dist/images/layers.png
wget https://unpkg.com/leaflet@1.9.4/dist/images/layers-2x.png
```

### Option 2: Von GitHub

1. Gehe zu https://github.com/Leaflet/Leaflet/releases/tag/v1.9.4
2. Lade `leaflet.zip` herunter
3. Entpacke in diesen Ordner

## 📁 Benötigte Struktur

```
leaflet/
├── leaflet.js
├── leaflet.css
└── images/
    ├── marker-icon.png
    ├── marker-icon-2x.png
    ├── marker-shadow.png
    ├── layers.png
    └── layers-2x.png
```

## 🔗 Einbindung

In `public/index.html`:

```html
<link rel="stylesheet" href="/leaflet/leaflet.css" />
<script src="/leaflet/leaflet.js"></script>
```

## ⚠️ Wichtig

- **Lokal hosten!** Nicht von CDN laden (Offline-Funktionalität)
- Version 1.9.4 verwenden (getestet)
- Keine neuere Version ohne Tests!

---

**Status:** ⏳ Noch nicht heruntergeladen  
**Priorität:** 🔴 Hoch (Phase 1)
