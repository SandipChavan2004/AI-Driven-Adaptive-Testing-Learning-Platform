const CACHE_NAME = 'vantagelearn-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png'
  // Webpack adds JS/CSS bundles dynamically, so we mostly cache core shell files.
];

// Install event: cache static assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Cache-first for images, Network-first for API logic
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Exclude API calls from caching
  if (url.pathname.startsWith('/api')) {
    return;
  }

  // Network-first strategy for document/HTML, Cache-fallback
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Stale-while-revalidate for assets
  e.respondWith(
    caches.match(e.request).then((cachedResp) => {
      const fetchResp = fetch(e.request).then((networkResp) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (e.request.method === 'GET') {
            cache.put(e.request, networkResp.clone());
          }
          return networkResp;
        });
      });
      return cachedResp || fetchResp;
    })
  );
});
