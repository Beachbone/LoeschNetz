/* ========================================
   LoeschNetz - Public PWA App Logic
   ======================================== */

'use strict';

// === Globale App-State ===
const App = {
    map: null,
    markers: [],
    markerTypes: [],
    hydrants: [],
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
        // Marker-Typen laden
        await loadMarkerTypes();
        
        // Hydranten laden
        await loadHydrants();
        
        // Karte initialisieren
        initMap();
        
        // UI zeigen
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        
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

// === Marker-Typen laden ===
async function loadMarkerTypes() {
    try {
        const response = await fetch('/api/marker-types');
        if (!response.ok) throw new Error('Marker-Typen nicht geladen');
        
        const data = await response.json();
        App.markerTypes = data.types || [];
        
        console.log(`✅ ${App.markerTypes.length} Marker-Typen geladen`);
        
        // Legende erstellen
        createLegend();
    } catch (error) {
        console.warn('⚠️ Marker-Typen nicht verfügbar, nutze Fallback');
        
        // Fallback: Standard-Typen
        App.markerTypes = [
            { id: 'h80', label: 'H80 Hydrant', color: '#FF0000', icon: 'markericon_rot.png' },
            { id: 'h100', label: 'H100 Hydrant', color: '#0000FF', icon: 'markericon_blau.png' },
            { id: 'h125', label: 'H125 Hydrant', color: '#3388FF', icon: 'markericon.png' },
            { id: 'h150', label: 'H150 Hydrant', color: '#00FF00', icon: 'markericon_gruen.png' },
            { id: 'reservoir', label: 'Wasserreservoir', color: '#00FFFF', icon: 'markericon_aqua.png' }
        ];
        
        createLegend();
    }
}

// === Hydranten laden ===
async function loadHydrants() {
    try {
        const response = await fetch('/api/hydrants');
        if (!response.ok) throw new Error('Hydranten nicht geladen');
        
        const data = await response.json();
        App.hydrants = data.hydrants || [];
        
        console.log(`✅ ${App.hydrants.length} Hydranten geladen`);
        
        // In IndexedDB speichern für Offline
        await saveToIndexedDB('hydrants', App.hydrants);
    } catch (error) {
        console.warn('⚠️ API nicht verfügbar, lade aus IndexedDB');
        
        // Versuche aus IndexedDB zu laden
        const cached = await loadFromIndexedDB('hydrants');
        if (cached && cached.length > 0) {
            App.hydrants = cached;
            console.log(`✅ ${App.hydrants.length} Hydranten aus Cache geladen`);
        } else {
            // Fallback: Beispiel-Hydranten
            console.warn('⚠️ Keine Hydranten verfügbar, nutze Beispiel-Daten');
            App.hydrants = getExampleHydrants();
        }
    }
}

// === Karte initialisieren ===
function initMap() {
    // Prüfe ob Leaflet geladen ist
    if (typeof L === 'undefined') {
        console.error('❌ Leaflet.js nicht geladen!');
        showError('Kartenbibliothek nicht verfügbar. Bitte Seite neu laden.');
        return;
    }
    
    // Karte erstellen
    const mapElement = document.getElementById('map');
    App.map = L.map(mapElement, {
        tap: false // Wichtig für mobile Geräte
    });
    
    // Standard-Ansicht: Kappel-Kludenbach
    // TODO: Aus config.json laden
    const center = [50.000153, 7.356538];
    const zoom = 15;
    const bounds = [
        [50.00387, 7.35199],
        [49.98652, 7.37710]
    ];
    
    App.map.setView(center, zoom);
    App.map.fitBounds(bounds);
    
    // Tile-Layer (OSM)
    const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
    });
    
    // Satellit-Layer (Esri)
    const satelliteLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
            maxZoom: 19,
            attribution: '© <a href="http://www.esri.com/">Esri</a>'
        }
    );
    
    // OSM als Standard
    osmLayer.addTo(App.map);
    
    // Layer-Control
    const baseLayers = {
        'Karte': osmLayer,
        'Satellit': satelliteLayer
    };
    L.control.layers(baseLayers).addTo(App.map);
    
    // Maßstab
    L.control.scale({ imperial: false }).addTo(App.map);
    
    // Marker hinzufügen
    addMarkers();
    
    // Resize-Event
    App.map.on('resize', () => {
        App.map.fitBounds(bounds);
    });
    
    console.log('✅ Karte initialisiert');
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
        const marker = L.marker([hydrant.latitude, hydrant.longitude], {
            icon: icon,
            title: hydrant.name
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
            <p><strong>${hydrant.name}</strong></p>
    `;
    
    if (hydrant.description) {
        html += `<p>${hydrant.description}</p>`;
    }
    
    if (hydrant.photo) {
        html += `
            <img src="/uploads/thumbs/${hydrant.photo}" 
                 alt="${hydrant.name}"
                 loading="lazy">
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

// === Beispiel-Hydranten (Fallback) ===
function getExampleHydrants() {
    return [
        {
            id: 'example_h100',
            type: 'h100',
            name: 'Beispiel-Hydrant',
            description: 'Dies ist ein Beispiel-Hydrant. Die echten Daten werden vom Server geladen.',
            latitude: 50.000153,
            longitude: 7.356538,
            photo: null
        }
    ];
}

console.log('🚒 LoeschNetz App-Script geladen');
