// sw.js - Service Worker für LoeschNetz Public PWA
// Version mit Leaflet-Support und Offline-Fähigkeit

const CACHE_VERSION = 'loeschnetz-v1.0.2';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;
const CACHE_IMAGES = `${CACHE_VERSION}-images`;
const CACHE_TILES = `${CACHE_VERSION}-tiles`;

// Dateien die sofort beim Install gecacht werden
const STATIC_ASSETS = [
    './',
    './index.html',
    './datenschutz.html',
    './impressum.html',
    './css/style.css',
    './js/app.js',
    './manifest.php',
    './favicon.png',
    // Leaflet (lokal)
    './leaflet/leaflet.css',
    './leaflet/leaflet.js',
    './leaflet/images/marker-icon.png',
    './leaflet/images/marker-icon-2x.png',
    './leaflet/images/marker-shadow.png',
    './leaflet/images/layers.png',
    './leaflet/images/layers-2x.png',
    // Icons
    './icons/icon-192x192.png',
    './icons/icon-512x512.png',
    './icons/markericon.png',
    './icons/markericon_rot.png',
    './icons/markericon_blau.png',
    './icons/markericon_gruen.png',
    './icons/markericon_aqua.png'
];

// Installation: Cache füllen
self.addEventListener('install', (event) => {
    console.log('[SW] Installation gestartet...');
    
    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then(cache => {
                console.log('[SW] Cache wird gefüllt...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Installation erfolgreich!');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('[SW] Installation fehlgeschlagen:', err);
            })
    );
});

// Aktivierung: Alte Caches löschen
self.addEventListener('activate', (event) => {
    console.log('[SW] Aktivierung...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name.startsWith('loeschnetz-') && name !== CACHE_STATIC && name !== CACHE_DYNAMIC && name !== CACHE_IMAGES && name !== CACHE_TILES)
                        .map(name => {
                            console.log('[SW] Lösche alten Cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Aktiviert und bereit!');
                return self.clients.claim();
            })
    );
});

// Fetch: Anfragen abfangen
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Karten-Tiles von OpenStreetMap
    if (url.origin.includes('tile.openstreetmap.org') || 
        url.origin.includes('arcgisonline.com')) {
        event.respondWith(cacheFirstStrategy(request, CACHE_TILES));
        return;
    }
    
    // API-Anfragen (Config, Hydranten)
    if (url.pathname.includes('/api/')) {
        event.respondWith(networkFirstStrategy(request, CACHE_DYNAMIC));
        return;
    }
    
    // Hydrant-Fotos
    if (url.pathname.includes('/uploads/')) {
        event.respondWith(cacheFirstStrategy(request, CACHE_IMAGES));
        return;
    }
    
    // Statische Assets (HTML, CSS, JS, Icons)
    if (url.origin === location.origin) {
        event.respondWith(cacheFirstStrategy(request, CACHE_STATIC));
        return;
    }
    
    // Alles andere: Network only
    event.respondWith(fetch(request));
});

/**
 * Cache-First Strategie
 * Versucht aus Cache zu laden, bei Miss aus Netzwerk
 */
async function cacheFirstStrategy(request, cacheName) {
    try {
        const cache = await caches.open(cacheName);
        const cached = await cache.match(request);
        
        if (cached) {
            console.log('[SW] Aus Cache:', request.url);
            return cached;
        }
        
        console.log('[SW] Lade aus Netzwerk:', request.url);
        const response = await fetch(request);
        
        // Nur erfolgreiche Antworten cachen
        if (response.status === 200) {
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.error('[SW] Cache-First fehlgeschlagen:', error);
        
        // Offline-Fallback für HTML
        if (request.destination === 'document') {
            const cache = await caches.open(CACHE_STATIC);
            return cache.match('./index.html');
        }
        
        throw error;
    }
}

/**
 * Network-First Strategie
 * Versucht aus Netzwerk zu laden, bei Fehler aus Cache
 */
async function networkFirstStrategy(request, cacheName) {
    try {
        console.log('[SW] Lade aus Netzwerk:', request.url);
        const response = await fetch(request);
        
        // Nur GET-Requests cachen (PUT/POST/DELETE nicht cachebar)
        if (response.status === 200 && request.method === 'GET') {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        
        return response;
    } catch (error) {
        console.log('[SW] Netzwerk nicht verfügbar, versuche Cache:', request.url);

        // Nur GET-Requests aus Cache holen
        if (request.method === 'GET') {
            const cache = await caches.open(cacheName);
            const cached = await cache.match(request);

            if (cached) {
                console.log('[SW] Aus Cache geladen:', request.url);
                return cached;
            }
        }

        // Kein Cache für non-GET oder nichts gefunden
        console.log('[SW] Kein Cache verfügbar für:', request.url);
        throw error;
    }
}

/**
 * Message-Handler für Updates
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[SW] Skip Waiting angefordert');
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        console.log('[SW] Zusätzliche URLs cachen:', event.data.urls);
        event.waitUntil(
            caches.open(CACHE_DYNAMIC)
                .then(cache => cache.addAll(event.data.urls))
        );
    }
});
