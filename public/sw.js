/* ========================================
   LoeschNetz - Service Worker
   Offline-Funktionalität & Caching
   ======================================== */

const CACHE_VERSION = 'loeschnetz-v1.0.0';
const CACHE_NAME = `${CACHE_VERSION}`;

// === Assets die gecacht werden sollen ===
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/app.js',
    '/manifest.json',
    '/favicon.png',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// === Leaflet-Assets (falls lokal) ===
const LEAFLET_ASSETS = [
    '/leaflet/leaflet.js',
    '/leaflet/leaflet.css',
    '/leaflet/images/marker-icon.png',
    '/leaflet/images/marker-icon-2x.png',
    '/leaflet/images/marker-shadow.png',
    '/leaflet/images/layers.png',
    '/leaflet/images/layers-2x.png'
];

// === Install Event ===
self.addEventListener('install', (event) => {
    console.log('[SW] Installation gestartet...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Cache geöffnet');
                
                // Versuche alle Assets zu cachen
                return cache.addAll(STATIC_ASSETS.concat(LEAFLET_ASSETS))
                    .catch(error => {
                        console.warn('[SW] Einige Assets konnten nicht gecacht werden:', error);
                        // Kritische Assets einzeln cachen
                        return cache.addAll(STATIC_ASSETS);
                    });
            })
            .then(() => {
                console.log('[SW] ✅ Assets gecacht');
                return self.skipWaiting();
            })
    );
});

// === Activate Event ===
self.addEventListener('activate', (event) => {
    console.log('[SW] Aktivierung gestartet...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                // Alte Caches löschen
                return Promise.all(
                    cacheNames
                        .filter(name => name.startsWith('loeschnetz-') && name !== CACHE_NAME)
                        .map(name => {
                            console.log('[SW] Lösche alten Cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] ✅ Aktiviert');
                return self.clients.claim();
            })
    );
});

// === Fetch Event - Offline-Strategie ===
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Verschiedene Strategien je nach Request-Typ
    
    // 1. App-Assets: Cache-First
    if (url.origin === location.origin && !url.pathname.startsWith('/api/')) {
        event.respondWith(cacheFirst(request));
    }
    
    // 2. API-Calls: Network-First (mit Cache-Fallback)
    else if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
    }
    
    // 3. OSM-Tiles: Cache-First mit langem Timeout
    else if (url.hostname.includes('openstreetmap.org') || 
             url.hostname.includes('arcgisonline.com')) {
        event.respondWith(tileCache(request));
    }
    
    // 4. Andere externe Requests: Network-Only
    else {
        event.respondWith(fetch(request));
    }
});

// === Cache-First Strategie ===
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        
        // Nur erfolgreiche Responses cachen
        if (response.ok) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.warn('[SW] Fetch fehlgeschlagen:', request.url);
        
        // Fallback für HTML-Requests
        if (request.destination === 'document') {
            return cache.match('/index.html');
        }
        
        throw error;
    }
}

// === Network-First Strategie ===
async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    
    try {
        const response = await fetch(request);
        
        // Nur erfolgreiche Responses cachen
        if (response.ok) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.warn('[SW] API nicht erreichbar, nutze Cache');
        const cached = await cache.match(request);
        
        if (cached) {
            return cached;
        }
        
        // Fallback-Response für API-Fehler
        return new Response(
            JSON.stringify({
                success: false,
                error: 'Offline - Keine Daten verfügbar',
                offline: true
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// === Tile-Cache Strategie ===
async function tileCache(request) {
    const cache = await caches.open(`${CACHE_NAME}-tiles`);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        
        // Tiles lange cachen (OK weil sie sich nicht ändern)
        if (response.ok) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.warn('[SW] Tile nicht verfügbar:', request.url);
        
        // Fallback: Leerer Tile (grau)
        return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect fill="#e0e0e0" width="256" height="256"/></svg>',
            {
                headers: { 'Content-Type': 'image/svg+xml' }
            }
        );
    }
}

// === Message Event (für zukünftige Features) ===
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] Service Worker geladen');
