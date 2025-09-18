const CACHE_NAME = 'chopped-pwa-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/account.html', 
  '/chopping-board.html',
  '/profile.html',
  '/mobile.html',
  '/manifest.json',
  '/vite.svg',
  '/favicon.ico'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Service worker install failed:', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control immediately
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  const request = event.request;
  const isNavigation = request.mode === 'navigate' || (request.destination === 'document');

  if (isNavigation) {
    // Network-first for HTML navigations so new deployments are picked up
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const respClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone)).catch(() => {});
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/index.html');
        })
    );
    return;
  }

  // Cache-first for other GET requests
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((networkResponse) => {
        const respClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, respClone)).catch(() => {});
        return networkResponse;
      }).catch(() => undefined);
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


