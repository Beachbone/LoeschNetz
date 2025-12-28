// sw.js - Minimaler Service Worker für LoeschNetz Admin PWA
// Minimales Caching für Offline-Start

const CACHE_VERSION = 'loeschnetz-admin-v2.1.0';
const CACHE_NAME = `${CACHE_VERSION}-minimal`;

// Minimale Dateien für Offline-Start
const MINIMAL_ASSETS = [
    './index.php',
    './icons/icon-192x192.png',
    './icons/icon-512x512.png'
];

// Installation: Minimale Assets cachen
self.addEventListener('install', (event) => {
    console.log('[Admin SW] Installation gestartet...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Admin SW] Cache minimale Assets für Offline-Start');
                return cache.addAll(MINIMAL_ASSETS);
            })
            .then(() => {
                console.log('[Admin SW] Installation erfolgreich');
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
                        .filter(name => name.startsWith('loeschnetz-admin-') && name !== CACHE_NAME)
                        .map(name => {
                            console.log('[Admin SW] Lösche alten Cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[Admin SW] Aktiviert - minimales Caching aktiv');
                return self.clients.claim();
            })
    );
});

// Fetch: Minimale Assets aus Cache, Rest aus Netzwerk
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Nur minimale Assets cachen (index.php und Icons)
    if (url.origin === location.origin &&
        (url.pathname.endsWith('/admin/index.php') ||
         url.pathname.endsWith('/admin/') ||
         url.pathname.includes('/admin/icons/icon-192x192.png') ||
         url.pathname.includes('/admin/icons/icon-512x512.png'))) {

        event.respondWith(
            caches.match(event.request)
                .then(cached => {
                    if (cached) {
                        console.log('[Admin SW] Aus Cache:', event.request.url);
                    }
                    // Network-First für index.php, Cache als Fallback
                    return fetch(event.request)
                        .then(response => {
                            // Clone SOFORT vor jeder anderen Verwendung (Race Condition vermeiden)
                            const responseClone = response.clone();

                            // Update Cache im Hintergrund
                            if (response.ok) {
                                caches.open(CACHE_NAME).then(cache => {
                                    cache.put(event.request, responseClone);
                                });
                            }
                            return response;
                        })
                        .catch(() => {
                            console.log('[Admin SW] Offline - nutze Cache:', event.request.url);
                            return cached || new Response('Offline', { status: 503 });
                        });
                })
        );
        return;
    }

    // Alle anderen Requests: Network-Only
    event.respondWith(fetch(event.request));
});

// Message-Handler
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[Admin SW] Skip Waiting angefordert');
        self.skipWaiting();
    }
});
