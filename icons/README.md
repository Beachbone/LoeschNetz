# Marker-Icons

## 📍 Benötigte Icons

Bitte füge die folgenden Marker-Icons in diesen Ordner ein:

### Standard-Icons (aus altem Projekt)
- `markericon_rot.png` (H80 - Rot, #FF0000)
- `markericon_blau.png` (H100 - Blau, #0000FF)
- `markericon.png` (H125 - Hellblau, #3388FF)
- `markericon_gruen.png` (H150 - Grün, #00FF00)
- `markericon_aqua.png` (Reservoir - Aqua, #00FFFF)

### Zusätzliche Icons (optional)
- `markericon_gelb.png` (Gelb, #FFFF00)
- `markericon_orange.png` (Orange, #FFA500)
- `markericon_lila.png` (Lila, #800080)
- `markericon_grau.png` (Grau, #808080)

## 📐 Spezifikationen

- **Größe:** 25x41 Pixel (Leaflet-Standard)
- **Format:** PNG mit Transparenz
- **Stil:** Marker-Pin mit Punkt unten

## 🎨 Icon-Design

Leaflet-Standard-Marker-Format:
```
    △
   ╱ ╲
  ╱   ╲
 ╱  •  ╲
╱       ╲
╲       ╱
 ╲     ╱
  ╲   ╱
   ╲ ╱
    ▽
    •
```

## 📥 Quelle

Die Icons aus dem alten Projekt findest du hier:
`/mnt/project/markericon*.png`

Kopiere sie einfach in diesen Ordner.

## ⚙️ Nutzung

Icons werden in `data/marker_types.json` referenziert:

```json
{
  "id": "h100",
  "label": "H100 Hydrant",
  "icon": "markericon_blau.png",
  "color": "#0000FF"
}
```

---

**Hinweis:** Ohne diese Icons wird die App nicht korrekt funktionieren!
