// sw.js - Minimaler Service Worker für LoeschNetz Admin PWA
// Ermöglicht PWA-Installation ohne Caching

const CACHE_VERSION = 'loeschnetz-admin-v2.0.0';

// Installation: Sofort aktivieren
self.addEventListener('install', (event) => {
    console.log('[Admin SW] Installation gestartet...');
    self.skipWaiting();
});

// Aktivierung: Alle alten Caches löschen
self.addEventListener('activate', (event) => {
    console.log('[Admin SW] Aktivierung...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name.startsWith('loeschnetz-admin-'))
                        .map(name => {
                            console.log('[Admin SW] Lösche alten Cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[Admin SW] Aktiviert - kein Caching aktiv');
                return self.clients.claim();
            })
    );
});

// Fetch: Alle Anfragen direkt durchreichen (kein Caching)
self.addEventListener('fetch', (event) => {
    // Einfach alle Requests durchreichen ohne Caching
    event.respondWith(fetch(event.request));
});

// Message-Handler
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[Admin SW] Skip Waiting angefordert');
        self.skipWaiting();
    }
});
