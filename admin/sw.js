// sw.js - Service Worker für LoeschNetz Admin PWA
// Version mit Offline-Fähigkeit für Admin-Interface

const CACHE_VERSION = 'loeschnetz-admin-v1.3.0';
const CACHE_STATIC = `${CACHE_VERSION}-static`;
const CACHE_DYNAMIC = `${CACHE_VERSION}-dynamic`;

// Dateien die sofort beim Install gecacht werden
const STATIC_ASSETS = [
    './',
    './index.php',
    './login.php',
    './marker-types.php',
    './users.php',
    './settings.php',
    './snapshots.php',
    './logs.php',
    './manifest.json',
    './css/admin.css',
    './js/admin-utils.js',
    './js/admin-auth.js',
    './js/admin-menu.js',
    './js/admin-hydrants.js',
    './js/admin-map.js',
    './js/admin-photos.js',
    './js/admin-password.js',
    './js/admin-marker-types.js',
    './js/admin-users.js',
    './js/admin-settings.js',
    './js/admin-snapshots.js',
    './js/admin-logs.js'
];

// Installation: Cache füllen
self.addEventListener('install', (event) => {
    console.log('[Admin SW] Installation gestartet...');

    event.waitUntil(
        caches.open(CACHE_STATIC)
            .then(cache => {
                console.log('[Admin SW] Cache wird gefüllt...');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Admin SW] Installation erfolgreich!');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('[Admin SW] Installation fehlgeschlagen:', err);
            })
    );
});

// Aktivierung: Alte Caches löschen
self.addEventListener('activate', (event) => {
    console.log('[Admin SW] Aktivierung...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name.startsWith('loeschnetz-admin-') &&
                                       name !== CACHE_STATIC &&
                                       name !== CACHE_DYNAMIC)
                        .map(name => {
                            console.log('[Admin SW] Lösche alten Cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[Admin SW] Aktiviert und bereit!');
                return self.clients.claim();
            })
    );
});

// Fetch: Anfragen abfangen
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // API-Anfragen: Network-first (immer frische Daten wenn online)
    if (url.pathname.includes('/api/')) {
        event.respondWith(networkFirstStrategy(request, CACHE_DYNAMIC));
        return;
    }

    // Leaflet von CDN: Cache-first
    if (url.origin.includes('unpkg.com') && url.pathname.includes('leaflet')) {
        event.respondWith(cacheFirstStrategy(request, CACHE_STATIC));
        return;
    }

    // Upload-Fotos: Cache-first
    if (url.pathname.includes('/uploads/')) {
        event.respondWith(cacheFirstStrategy(request, CACHE_DYNAMIC));
        return;
    }

    // Admin-Dateien (HTML, CSS, JS): Cache-first mit Network-Fallback
    if (url.origin === location.origin && url.pathname.startsWith('/admin/')) {
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
            console.log('[Admin SW] Aus Cache:', request.url);
            return cached;
        }

        console.log('[Admin SW] Lade aus Netzwerk:', request.url);
        const response = await fetch(request);

        // Nur erfolgreiche Antworten cachen
        if (response.status === 200) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.error('[Admin SW] Cache-First fehlgeschlagen:', error);

        // Offline-Fallback für HTML - zeige Login-Seite
        if (request.destination === 'document') {
            const cache = await caches.open(CACHE_STATIC);
            const fallback = await cache.match('./login.php');
            if (fallback) {
                return fallback;
            }
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
        console.log('[Admin SW] Lade aus Netzwerk:', request.url);
        const response = await fetch(request);

        // Nur GET-Requests cachen (PUT/POST/DELETE nicht cachebar)
        if (response.status === 200 && request.method === 'GET') {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.log('[Admin SW] Netzwerk nicht verfügbar, versuche Cache:', request.url);

        // Nur GET-Requests aus Cache holen
        if (request.method === 'GET') {
            const cache = await caches.open(cacheName);
            const cached = await cache.match(request);

            if (cached) {
                console.log('[Admin SW] Aus Cache geladen:', request.url);
                return cached;
            }
        }

        // Kein Cache für non-GET oder nichts gefunden
        console.log('[Admin SW] Kein Cache verfügbar für:', request.url);
        throw error;
    }
}

/**
 * Message-Handler für Updates
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[Admin SW] Skip Waiting angefordert');
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_URLS') {
        console.log('[Admin SW] Zusätzliche URLs cachen:', event.data.urls);
        event.waitUntil(
            caches.open(CACHE_DYNAMIC)
                .then(cache => cache.addAll(event.data.urls))
        );
    }
});
