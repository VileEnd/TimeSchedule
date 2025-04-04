// Service Worker for TimeBloc PWA
const CACHE_VERSION = 5; // Increment this number when you make significant changes
const CACHE_NAME = `timebloc-cache-v${CACHE_VERSION}`;
const BASE_URL = self.location.origin;

// Import Workbox for background sync
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Configure background sync queue
if (workbox) {
  // Create a background sync queue for AI processing
  const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('aiProcessingQueue', {
    maxRetentionTime: 24 * 60 // Retry for up to 24 hours (in minutes)
  });

  // Register a route for OpenAI API calls to use the background sync queue
  workbox.routing.registerRoute(
    ({url}) => url.href.includes('api.openai.com'),
    new workbox.strategies.NetworkOnly({
      plugins: [bgSyncPlugin]
    }),
    'POST'
  );
}

// Assets to cache when service worker is installed
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon_x192.png',
  './icons/icon_x512.png',
  './icons/apple-touch-icon.png',
  './icons/apple-touch-icon-dark-180x180.png',
  './sounds/bell.mp3',
  './sounds/chime.mp3',
  './sounds/digital.mp3'
];

// Create notification channels
function createNotificationChannels() {
  // For Android
  if ('Notification' in self && 'createNotificationChannel' in Notification) {
    Notification.createNotificationChannel({
      id: 'ai_notifications',
      name: 'AI Processing Notifications', 
      description: 'Notifications about AI schedule processing',
      importance: 'high'
    });
    
    Notification.createNotificationChannel({
      id: 'task_reminders',
      name: 'Task Reminders', 
      description: 'Reminders for scheduled tasks',
      importance: 'high'
    });
  }
}

// Create notification channels when the service worker installs
createNotificationChannels();

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
      // After claiming clients, check if we should notify about the update
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          // Send message to the client that an update is available
          client.postMessage({
            type: 'UPDATE_AVAILABLE',
            version: CACHE_VERSION
          });
        });
      });
      
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
  
  // Network-first strategy for HTML files to ensure users get the latest content
  if (event.request.url.endsWith('.html') || event.request.url.endsWith('/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the fetched response
          caches.open(CACHE_NAME)
            .then(cache => {
              if (response.status === 200) {
                cache.put(event.request, responseToCache);
              }
            });
          
          return response;
        })
        .catch(() => {
          // If network fails, fall back to cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first strategy for other assets
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
  
  // Handle update request from the client
  if (event.data && event.data.type === 'CHECK_FOR_UPDATES') {
    // Force the service worker to activate immediately
    self.skipWaiting().then(() => {
      // Notify the client that update is being applied
      if (event.source) {
        event.source.postMessage({
          type: 'UPDATE_ACTIVATED',
          version: CACHE_VERSION
        });
      }
    });
  }
  
  // Show notification when AI starts processing
  if (event.data && event.data.type === 'AI_PROCESSING') {
    self.registration.showNotification('AI Processing', {
      body: 'AI is analyzing your data and generating your schedule. This may take a minute.',
      icon: `${BASE_URL}/icons/icon_x192.png`,
      badge: `${BASE_URL}/icons/icon_x192.png`,
      tag: 'ai-processing-notification',
      silent: false,
      renotify: true,
      requireInteraction: true, // Keep the notification visible until user dismisses it
      timestamp: Date.now(),
      vibrate: [100, 50, 100],
      actions: [
        { action: 'cancel', title: 'Cancel' }
      ],
      data: {
        inProgress: true,
        timestamp: Date.now()
      }
    });
  }
  
  // Show notification when AI processing is complete
  if (event.data && event.data.type === 'AI_COMPLETE') {
    // First, close any processing notifications
    self.registration.getNotifications({tag: 'ai-processing-notification'})
      .then(notifications => {
        notifications.forEach(notification => notification.close());
      });
    
    // Then show completion notification
    self.registration.showNotification('AI Schedule Creation', {
      body: event.data.message || 'AI has finished creating your schedule.',
      icon: `${BASE_URL}/icons/icon_x192.png`,
      badge: `${BASE_URL}/icons/icon_x192.png`,
      tag: 'ai-notification',
      renotify: true,
      timestamp: Date.now(),
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Now' }
      ],
      data: {
        url: `${BASE_URL}?viewAiSchedule=true`,
        timestamp: Date.now(),
        totalBlocksAdded: event.data.totalBlocksAdded
      },
      vibrate: [200, 100, 200]
    });
    
    // Save the notification data to localStorage to ensure persistence
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'PERSIST_AI_NOTIFICATION',
          message: event.data.message,
          totalBlocksAdded: event.data.totalBlocksAdded,
          timestamp: Date.now()
        });
      });
    });
  }
  
  // Show notification for current task
  if (event.data && event.data.type === 'CURRENT_TASK') {
    self.registration.showNotification('Current Task Reminder', {
      body: `${event.data.taskName} - ${event.data.timeRange}`,
      icon: './icons/icon_x192.png',
      badge: './icons/icon_x192.png',
      tag: 'task-notification',
      actions: [
        { action: 'startTimer', title: 'Start Timer' }
      ],
      data: {
        taskId: event.data.taskId,
        url: self.location.origin + '?startTimer=' + event.data.taskId
      }
    });
  }
  
  // Generic notification sender
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body,
      icon: './icons/icon_x192.png',
      badge: './icons/icon_x192.png',
      tag: event.data.tag || 'generic-notification',
      actions: event.data.actions || [],
      data: event.data.data || {}
    });
  }
});

// Handle the beforeinstallprompt event
self.addEventListener('appinstalled', (event) => {
  // Log the installation to analytics
  console.log('TimeBloc was installed as a PWA');
});

// Handle notification click events
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  notification.close();
  
  // Handle different notification actions
  if (event.action === 'startTimer') {
    // Client will handle the timer start action
    event.waitUntil(clients.openWindow(notification.data.url));
  } else if (event.action === 'view') {
    // Open the window to view AI schedule
    event.waitUntil(clients.openWindow(notification.data.url));
  } else if (event.action === 'cancel') {
    // Cancel the AI processing
    // Notify all clients that AI processing should be cancelled
    event.waitUntil(
      clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'CANCEL_AI_PROCESSING'
          });
        });
      })
    );
    
    // Remove any processing flags
    localStorage.removeItem('aiProcessingInProgress');
    localStorage.removeItem('aiProcessingStartTime');
  } else {
    // Default action for click on notification body
    const urlToOpen = notification.data && notification.data.url 
      ? notification.data.url 
      : `${BASE_URL}`;
    
    // Focus if already open or open new window
    event.waitUntil(
      clients.matchAll({type: 'window'}).then(clientList => {
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  }
});

// Handle the notificationclose event
self.addEventListener('notificationclose', event => {
  // You can track which notifications are closed by the user
  console.log('Notification closed by user:', event.notification.data);
});

// Background sync handler for when queue replay succeeds
self.addEventListener('sync', event => {
  if (event.tag === 'aiProcessingQueue') {
    console.log('Background sync for AI processing completed successfully');
    
    // Notify the client that background sync completed
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'BACKGROUND_SYNC_COMPLETE',
          success: true
        });
      });
    });
  }
});

// Check if there's an ongoing AI processing job
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_AI_PROCESSING_STATUS') {
    // Check if there's an ongoing AI processing job
    const processing = localStorage.getItem('aiProcessingInProgress') === 'true';
    const startTime = parseInt(localStorage.getItem('aiProcessingStartTime') || '0', 10);
    const now = Date.now();
    
    // If processing has been ongoing for more than 30 minutes, consider it failed
    if (processing && (now - startTime > 30 * 60 * 1000)) {
      localStorage.removeItem('aiProcessingInProgress');
      localStorage.removeItem('aiProcessingStartTime');
      
      // Send a message back indicating the processing has timed out
      event.source.postMessage({
        type: 'AI_PROCESSING_STATUS',
        status: 'timeout'
      });
    } else if (processing) {
      // Send a message back indicating processing is still ongoing
      event.source.postMessage({
        type: 'AI_PROCESSING_STATUS',
        status: 'processing',
        startTime: startTime
      });
    } else {
      // Send a message back indicating no processing is happening
      event.source.postMessage({
        type: 'AI_PROCESSING_STATUS',
        status: 'idle'
      });
    }
  }
});