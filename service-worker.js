// Service Worker for TimeBloc PWA
const CACHE_NAME = 'timebloc-cache-v1';

// Assets to cache when service worker is installed
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon_x192.png',
  './icons/icon_x512.png',
  './sounds/bell.mp3',
  './sounds/chime.mp3',
  './sounds/digital.mp3'
];

// Install event: cache static assets
self.addEventListener('install', event => {
  // Skip waiting to make the service worker activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell and content');
        return cache.addAll(ASSETS_TO_CACHE);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients for version', CACHE_NAME);
      return self.clients.claim();
    })
  );
});

// Fetch event: serve content from cache if available, fetch from network if not
self.addEventListener('fetch', event => {
  // Skip cross-origin requests like Google Fonts, Analytics, etc.
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if found
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network
        return fetch(event.request)
          .then(response => {
            // Clone the response
            const responseToCache = response.clone();
            
            // Cache the fetched response
            caches.open(CACHE_NAME)
              .then(cache => {
                // Don't cache responses that aren't successful
                if (response.status === 200) {
                  cache.put(event.request, responseToCache);
                }
              });
            
            return response;
          })
          .catch(error => {
            console.log('Service Worker: Fetch failed; returning offline page instead.', error);
            
            // When offline and the asset isn't in cache, we might return a fallback
            // or just let the browser handle the error
          });
      })
  );
});

// Handle messages from the client
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  // Show notification when app is installed
  if (event.data && event.data.type === 'APP_INSTALLED') {
    self.registration.showNotification('TimeBloc Installed', {
      body: 'TimeBloc has been successfully installed as an app. You can now access it from your home screen!',
      icon: './icons/icon_x192.png',
      badge: './icons/icon_x192.png'
    });
  }
});

// Handle the beforeinstallprompt event
self.addEventListener('appinstalled', (event) => {
  // Log the installation to analytics
  console.log('TimeBloc was installed as a PWA');
});