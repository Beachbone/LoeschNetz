/* ========================================
   LoeschNetz - Public PWA App Logic
   ======================================== */

'use strict';

// === Globale App-State ===
const App = {
    config: null,       // Geladene Config
    map: null,
    markers: [],
    markerTypes: [],
    hydrants: [],
    userLocationMarker: null,  // GPS-Marker
    isOnline: navigator.onLine,
    deferredPrompt: null
};

// === DOM Ready ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚒 LoeschNetz wird geladen...');
    
    // Cookie-Consent prüfen
    checkCookieConsent();
    
    // Online/Offline Events
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Install Prompt Event
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    
    // Info Modal
    document.getElementById('infoButton')?.addEventListener('click', openInfoModal);
    document.getElementById('closeInfo')?.addEventListener('click', closeInfoModal);
    
    // Legende Toggle
    document.getElementById('legendToggle')?.addEventListener('click', toggleLegend);
    
    // GPS Button
    document.getElementById('gpsButton')?.addEventListener('click', gotoUserLocation);

    // Reload Button
    document.getElementById('reloadButton')?.addEventListener('click', reloadData);

    // Legende auf Mobile standardmäßig eingeklappt
    if (window.innerWidth <= 600) {
        document.getElementById('legend')?.classList.add('collapsed', 'auto-collapsed');
    }
});

// === Cookie Consent ===
function checkCookieConsent() {
    const consent = getCookie('loeschnetz_consent');
    
    if (consent === 'accepted') {
        // Cookie akzeptiert → App laden
        initApp();
    } else if (consent === 'declined') {
        // Cookie abgelehnt → Declined Message
        showCookieDeclined();
    } else {
        // Noch nicht entschieden → Banner zeigen
        showCookieBanner();
    }
}

function showCookieBanner() {
    const banner = document.getElementById('cookieConsent');
    banner.style.display = 'block';
    
    document.getElementById('acceptCookies').addEventListener('click', () => {
        setCookie('loeschnetz_consent', 'accepted', 365);
        banner.style.display = 'none';
        initApp();
    });
    
    document.getElementById('declineCookies').addEventListener('click', () => {
        setCookie('loeschnetz_consent', 'declined', 365);
        banner.style.display = 'none';
        showCookieDeclined();
    });
}

function showCookieDeclined() {
    document.getElementById('cookieDeclined').style.display = 'flex';
    
    document.getElementById('reconsiderCookies')?.addEventListener('click', () => {
        deleteCookie('loeschnetz_consent');
        location.reload();
    });
}

// === App Initialisierung ===
async function initApp() {
    console.log('✅ Cookie akzeptiert, App wird initialisiert...');
    
    try {
        // 1. Config laden
        await loadConfig();
        
        // 2. Theme anwenden
        applyTheme();
        
        // 3. Marker-Typen laden
        await loadMarkerTypes();
        
        // 4. Hydranten laden
        await loadHydrants();
        
        // WICHTIG: UI ERST zeigen, DANN Karte initialisieren!
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        
        // Kurz warten damit der Browser das Layout berechnen kann
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // 5. JETZT Karte initialisieren (Container ist sichtbar!)
        initMap();
        
        // Online-Status
        updateOnlineStatus();
        
        // Install-Prompt (nach 30 Sek, wenn nicht installiert)
        setTimeout(checkInstallPrompt, 30000);
        
        console.log('✅ LoeschNetz bereit!');
    } catch (error) {
        console.error('❌ Fehler beim Laden:', error);
        showError('Fehler beim Laden der App. Bitte neu laden.');
    }
}

// === Daten neu laden ===
async function reloadData() {
    const button = document.getElementById('reloadButton');

    try {
        // Visuelle Rückmeldung (Spinning-Animation)
        button?.classList.add('loading');
        button.disabled = true;

        console.log('🔄 Daten werden neu geladen...');

        // 1. Config neu laden (mit Cache-Busting)
        await loadConfig(true);

        // 2. Theme neu anwenden
        applyTheme();

        // 3. Marker-Typen neu laden (mit Cache-Busting)
        await loadMarkerTypes(true);

        // 4. Hydranten neu laden (mit Cache-Busting)
        await loadHydrants(true);

        // 5. Bestehende Marker von der Karte entfernen
        App.markers.forEach(marker => {
            App.map.removeLayer(marker);
        });
        App.markers = [];

        // 6. Neue Marker hinzufügen
        addMarkers();

        // 7. Karte neu zentrieren auf Bounds
        if (App.hydrants && App.hydrants.length > 0) {
            const bounds = calculateBounds(App.hydrants);
            if (bounds) {
                App.map.fitBounds(bounds, { padding: [50, 50] });
            }
        }

        console.log('✅ Daten erfolgreich neu geladen!');

        // Erfolgsmeldung kurz anzeigen
        button?.classList.remove('loading');
        button.textContent = '✅';
        setTimeout(() => {
            button.textContent = '🔄';
            button.disabled = false;
        }, 1500);

    } catch (error) {
        console.error('❌ Fehler beim Neuladen:', error);

        // Fehlermeldung
        button?.classList.remove('loading');
        button.textContent = '❌';
        setTimeout(() => {
            button.textContent = '🔄';
            button.disabled = false;
        }, 2000);

        alert('Fehler beim Neuladen der Daten. Bitte versuchen Sie es erneut.');
    }
}

// === Config laden ===
async function loadConfig(forceReload = false) {
    try {
        const url = forceReload
            ? `/config.json?_=${Date.now()}`
            : '/config.json';
        const response = await fetch(url, forceReload ? { cache: 'no-cache' } : {});
        if (!response.ok) throw new Error('Config nicht gefunden');
        
        App.config = await response.json();
        console.log('✅ Config geladen');
    } catch (error) {
        console.warn('⚠️ Config nicht gefunden, nutze Defaults');
        
        // Fallback: Default-Config
        App.config = {
            organization: { name: 'LoeschNetz', logo: '/icons/icon-192x192.png' },
            map: {
                center: [50.000153, 7.356538],
                zoom: 15,
                minZoom: 10,
                maxZoom: 19,
                locationZoom: 18,
                tileServers: {
                    osm: {
                        name: 'Karte',
                        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                        attribution: '© OpenStreetMap',
                        maxZoom: 19
                    }
                }
            },
            theme: { primaryColor: '#d32f2f', backgroundColor: '#ffffff' },
            data: { hydrants: '/data/hydrants.json', markerTypes: '/data/marker-types.json' },
            legal: { impressum: '/impressum.html', datenschutz: '/datenschutz.html' }
        };
    }
}

// === Theme anwenden ===
function applyTheme() {
    if (!App.config?.theme) return;
    
    const root = document.documentElement;
    if (App.config.theme.primaryColor) {
        root.style.setProperty('--primary-color', App.config.theme.primaryColor);
    }
    if (App.config.theme.backgroundColor) {
        root.style.setProperty('--background', App.config.theme.backgroundColor);
    }
    
    console.log('✅ Theme angewendet');
}

// === Marker-Typen laden ===
async function loadMarkerTypes(forceReload = false) {
    try {
        let url = App.config?.data?.markerTypes || '/data/marker-types.json';
        if (forceReload) {
            url += `?_=${Date.now()}`;
        }
        const response = await fetch(url, forceReload ? { cache: 'no-cache' } : {});
        if (!response.ok) throw new Error('Marker-Typen JSON nicht gefunden');
        
        const data = await response.json();
        App.markerTypes = data.types || [];
        
        console.log(`✅ ${App.markerTypes.length} Marker-Typen aus JSON geladen`);
        
        // Legende erstellen
        createLegend();
    } catch (error) {
        console.error('❌ Fehler beim Laden der Marker-Typen:', error);
        
        // Fallback: Minimale Standard-Typen
        App.markerTypes = [
            { id: 'h80', label: 'H80', color: '#FF0000', icon: 'markericon_rot.png' },
            { id: 'h100', label: 'H100', color: '#0000FF', icon: 'markericon_blau.png' },
            { id: 'h125', label: 'H125', color: '#3388FF', icon: 'markericon.png' },
            { id: 'h150', label: 'H150', color: '#00FF00', icon: 'markericon_gruen.png' },
            { id: 'reservoir', label: 'Reservoir', color: '#00FFFF', icon: 'markericon_aqua.png' }
        ];
        
        console.warn('⚠️ Nutze Fallback-Marker-Typen');
        createLegend();
    }
}

// === Hydranten laden ===
async function loadHydrants(forceReload = false) {
    try {
        let url = App.config?.data?.hydrants || '/data/hydrants.json';
        if (forceReload) {
            url += `?_=${Date.now()}`;
        }
        const response = await fetch(url, forceReload ? { cache: 'no-cache' } : {});
        if (!response.ok) throw new Error('JSON-Datei nicht gefunden');
        
        const data = await response.json();
        App.hydrants = data.hydrants || [];
        
        console.log(`✅ ${App.hydrants.length} Hydranten aus JSON-Datei geladen`);
        
        // In IndexedDB speichern für Offline
        await saveToIndexedDB('hydrants', App.hydrants);
    } catch (error) {
        console.warn('⚠️ JSON-Datei nicht verfügbar, versuche IndexedDB Cache');
        
        // Fallback: IndexedDB Cache
        const cached = await loadFromIndexedDB('hydrants');
        if (cached && cached.length > 0) {
            App.hydrants = cached;
            console.log(`✅ ${App.hydrants.length} Hydranten aus IndexedDB Cache geladen`);
        } else {
            // Letzter Fallback: Leere Daten
            console.error('❌ Keine Hydranten-Daten verfügbar!');
            App.hydrants = [];
        }
    }
}

// === Karte initialisieren ===
function initMap() {
    console.log('🗺️ Initialisiere Karte...');
    
    if (typeof L === 'undefined') {
        console.error('❌ Leaflet.js nicht geladen!');
        showError('Kartenbibliothek nicht verfügbar. Bitte Seite neu laden.');
        return;
    }
    
    const mapElement = document.getElementById('map');
    
    try {
        App.map = L.map(mapElement, { tap: false, zoomControl: true });
        console.log('✅ Leaflet-Map-Objekt erstellt');
    } catch (error) {
        console.error('❌ Fehler beim Erstellen der Karte:', error);
        showError('Karte konnte nicht erstellt werden: ' + error.message);
        return;
    }
    
    // Tile-Layer aus Config
    const tileServers = App.config?.map?.tileServers || {};
    const baseLayers = {};
    
    // OSM Layer
    if (tileServers.osm) {
        const osmLayer = L.tileLayer(tileServers.osm.url, {
            maxZoom: tileServers.osm.maxZoom || 19,
            attribution: tileServers.osm.attribution || '© OpenStreetMap',
            crossOrigin: true
        });
        osmLayer.addTo(App.map);
        baseLayers[tileServers.osm.name || 'Karte'] = osmLayer;
    }
    
    // Satellit Layer
    if (tileServers.satellite) {
        const satelliteLayer = L.tileLayer(tileServers.satellite.url, {
            maxZoom: tileServers.satellite.maxZoom || 19,
            attribution: tileServers.satellite.attribution || '© Esri',
            crossOrigin: true
        });
        baseLayers[tileServers.satellite.name || 'Satellit'] = satelliteLayer;
    }
    
    // Layer-Control
    if (Object.keys(baseLayers).length > 1) {
        L.control.layers(baseLayers).addTo(App.map);
    }
    
    // Maßstab
    L.control.scale({ imperial: false }).addTo(App.map);
    console.log('✅ Tile-Layer hinzugefügt');
    
    // Bounds berechnen oder Fallback
    let bounds;
    if (App.hydrants && App.hydrants.length > 0) {
        bounds = calculateBounds(App.hydrants);
        console.log('✅ Bounds automatisch aus Hydranten berechnet');
    } else {
        const center = App.config?.map?.center || [50.000153, 7.356538];
        const zoom = App.config?.map?.zoom || 15;
        App.map.setView(center, zoom);
        console.log('✅ Karten-Ansicht aus Config gesetzt');
    }
    
    // Size neu berechnen und Bounds setzen
    setTimeout(() => {
        App.map.invalidateSize();
        if (bounds) {
            App.map.fitBounds(bounds, { padding: [50, 50] });
        }
        console.log('✅ Map-Size invalidiert und Bounds gesetzt');
        addMarkers();
    }, 100);
    
    // Resize-Event
    App.map.on('resize', () => {
        if (bounds) {
            App.map.fitBounds(bounds, { padding: [50, 50] });
        }
    });
    
    console.log('✅ Karte initialisiert');
}

// === Bounds aus Hydranten berechnen ===
function calculateBounds(hydrants) {
    if (!hydrants || hydrants.length === 0) return null;
    
    let minLat = Infinity, maxLat = -Infinity;
    let minLng = Infinity, maxLng = -Infinity;
    
    hydrants.forEach(h => {
        const lat = parseFloat(h.lat);
        const lng = parseFloat(h.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
            console.warn("Ungueltige Koordinaten:", h.id);
            return;
        }
        
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;
    });
    
    if (minLat === Infinity || minLng === Infinity) {
        console.warn('⚠️ Keine gültigen Koordinaten gefunden');
        return null;
    }
    
    return [[minLat, minLng], [maxLat, maxLng]];
}


// === Marker hinzufügen ===
function addMarkers() {
    App.hydrants.forEach(hydrant => {
        const markerType = App.markerTypes.find(t => t.id === hydrant.type);
        
        if (!markerType) {
            console.warn(`⚠️ Marker-Typ "${hydrant.type}" nicht gefunden`);
            return;
        }
        
        // Custom Icon
        const icon = L.icon({
            iconUrl: `/icons/${markerType.icon}`,
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [0, -29]
        });
        
        // Marker erstellen
        const marker = L.marker([hydrant.lat, hydrant.lng], {
            icon: icon,
            title: hydrant.title
        });
        
        // Popup
        const popupContent = createPopupContent(hydrant, markerType);
        marker.bindPopup(popupContent);
        
        // Zur Karte hinzufügen
        marker.addTo(App.map);
        App.markers.push(marker);
    });
    
    console.log(`✅ ${App.markers.length} Marker hinzugefügt`);
}

// === Popup-Content erstellen ===
function createPopupContent(hydrant, markerType) {
    let html = `
        <div class="hydrant-popup">
            <h3>${markerType.label}</h3>
            <p><strong>${hydrant.title}</strong></p>
    `;

    if (hydrant.description) {
        html += `<p>${hydrant.description}</p>`;
    }

    // Support new photos array structure
    if (hydrant.photos && Array.isArray(hydrant.photos) && hydrant.photos.length > 0) {
        html += '<div class="popup-photos">';
        hydrant.photos.forEach(photo => {
            const photoPath = `/uploads/hydrants/${hydrant.id}/${photo.filename}`;
            html += `
                <img src="${photoPath}"
                     alt="${hydrant.title}"
                     loading="lazy"
                     onclick="openPhotoOverlay('${photoPath}', '${hydrant.title}')">
            `;
        });
        html += '</div>';
    }
    // Fallback for old single photo field (backward compatibility)
    else if (hydrant.photo) {
        html += `
            <img src="/uploads/${hydrant.photo}"
                 alt="${hydrant.title}"
                 loading="lazy"
                 onclick="openPhotoOverlay('/uploads/${hydrant.photo}', '${hydrant.title}')">
        `;
    }

    html += '</div>';
    return html;
}

// === Legende erstellen ===
function createLegend() {
    const legendContent = document.getElementById('legendContent');
    legendContent.innerHTML = '';
    
    App.markerTypes.forEach(type => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        
        const icon = document.createElement('div');
        icon.className = 'legend-icon';
        icon.style.backgroundColor = type.color;
        
        const label = document.createElement('span');
        label.textContent = type.label;
        
        item.appendChild(icon);
        item.appendChild(label);
        legendContent.appendChild(item);
    });
}

// === Online/Offline Status ===
function handleOnlineStatus() {
    App.isOnline = navigator.onLine;
    updateOnlineStatus();
}

function updateOnlineStatus() {
    const notice = document.getElementById('offlineNotice');
    
    if (App.isOnline) {
        notice.style.display = 'none';
        console.log('🌐 Online');
    } else {
        notice.style.display = 'flex';
        console.log('📡 Offline-Modus');
    }
}

// === Install Prompt ===
function handleInstallPrompt(e) {
    e.preventDefault();
    App.deferredPrompt = e;
    console.log('📱 Install-Prompt verfügbar');
}

function checkInstallPrompt() {
    // Prüfe ob bereits installiert
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('✅ App bereits installiert');
        return;
    }
    
    // Zeige Install-Prompt wenn verfügbar
    if (App.deferredPrompt) {
        const prompt = document.getElementById('installPrompt');
        prompt.style.display = 'flex';
        
        document.getElementById('installButton').addEventListener('click', async () => {
            App.deferredPrompt.prompt();
            const { outcome } = await App.deferredPrompt.userChoice;
            console.log(`📱 Install ${outcome === 'accepted' ? 'akzeptiert' : 'abgelehnt'}`);
            App.deferredPrompt = null;
            prompt.style.display = 'none';
        });
        
        document.getElementById('dismissInstall').addEventListener('click', () => {
            prompt.style.display = 'none';
        });
    }
}

// === Info Modal ===
function openInfoModal() {
    document.getElementById('infoModal').style.display = 'flex';
}

function closeInfoModal() {
    document.getElementById('infoModal').style.display = 'none';
}

// === Photo Overlay (Fullscreen-Zoom) ===
function openPhotoOverlay(src, alt) {
    // Erstelle Overlay wenn nicht vorhanden
    let overlay = document.getElementById('photoOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'photoOverlay';
        overlay.className = 'photo-overlay';
        overlay.onclick = closePhotoOverlay;
        document.body.appendChild(overlay);
    }
    
    // Setze Bild
    overlay.innerHTML = `<img src="${src}" alt="${alt}">`;
    overlay.classList.add('active');
}

function closePhotoOverlay() {
    const overlay = document.getElementById('photoOverlay');
    if (overlay) {
        overlay.classList.remove('active');
    }
}

// === Fehler anzeigen ===
function showError(message) {
    alert('❌ ' + message);
}

// === Cookie-Funktionen ===
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = 'expires=' + date.toUTCString();
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
}

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return value;
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// === IndexedDB-Funktionen ===
async function saveToIndexedDB(key, data) {
    try {
        const db = await openDB();
        const tx = db.transaction('cache', 'readwrite');
        const store = tx.objectStore('cache');
        await store.put({ key, data, timestamp: Date.now() });
        console.log(`✅ ${key} in IndexedDB gespeichert`);
    } catch (error) {
        console.warn('⚠️ IndexedDB Fehler:', error);
    }
}

async function loadFromIndexedDB(key) {
    try {
        const db = await openDB();
        const tx = db.transaction('cache', 'readonly');
        const store = tx.objectStore('cache');
        const result = await store.get(key);
        return result ? result.data : null;
    } catch (error) {
        console.warn('⚠️ IndexedDB Fehler:', error);
        return null;
    }
}

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('LoeschNetz', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('cache')) {
                db.createObjectStore('cache', { keyPath: 'key' });
            }
        };
    });
}

console.log('🚒 LoeschNetz App-Script geladen');

// === Legende Toggle ===
function toggleLegend() {
    const legend = document.getElementById('legend');
    legend?.classList.toggle('collapsed');
}

// === GPS-Funktionen ===
function gotoUserLocation() {
    const button = document.getElementById('gpsButton');
    
    if (!navigator.geolocation) {
        alert('Geolocation wird von Ihrem Browser nicht unterstützt.');
        return;
    }
    
    button?.classList.add('active');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            const zoom = App.config?.map?.locationZoom || 18;
            
            // Karte zentrieren
            App.map.setView([latitude, longitude], zoom);
            
            // User-Marker anzeigen
            showUserLocationMarker(latitude, longitude, position.coords.accuracy);
            
            button?.classList.remove('active');
            console.log('✅ GPS-Position gefunden:', latitude, longitude);
        },
        (error) => {
            button?.classList.remove('active');
            console.error('❌ GPS-Fehler:', error.message);
            
            let message = 'Standort konnte nicht ermittelt werden.';
            if (error.code === error.PERMISSION_DENIED) {
                message = 'Standort-Berechtigung wurde verweigert.';
            } else if (error.code === error.POSITION_UNAVAILABLE) {
                message = 'Standort ist nicht verfügbar.';
            } else if (error.code === error.TIMEOUT) {
                message = 'Standort-Abfrage Timeout.';
            }
            
            alert(message);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function showUserLocationMarker(lat, lng, accuracy) {
    // Entferne alten Marker
    if (App.userLocationMarker) {
        App.map.removeLayer(App.userLocationMarker);
    }
    
    // Erstelle Kreis für Genauigkeit
    const circle = L.circle([lat, lng], {
        radius: accuracy,
        color: '#4285F4',
        fillColor: '#4285F4',
        fillOpacity: 0.2,
        weight: 2
    });
    
    // Erstelle Punkt-Marker
    const marker = L.circleMarker([lat, lng], {
        radius: 8,
        color: 'white',
        fillColor: '#4285F4',
        fillOpacity: 1,
        weight: 2
    });
    
    // Gruppiere als Layer
    App.userLocationMarker = L.layerGroup([circle, marker]).addTo(App.map);
    
    // Popup
    marker.bindPopup(`
        <div style="text-align: center;">
            <strong>📍 Ihr Standort</strong><br>
            <small>Genauigkeit: ±${Math.round(accuracy)}m</small>
        </div>
    `).openPopup();
}

