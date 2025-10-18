/**
 * Service Worker for RumahSubsidi.id
 * Implements 5-minute caching strategy
 */

const CACHE_NAME = 'rumahsubsidi-v1';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/search.html',
  '/detail.html',
  '/css/style.css',
  '/js/script.js',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with time-based caching
  if (url.origin === 'https://sikumbang.tapera.go.id') {
    event.respondWith(handleAPIRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handle API requests with 5-minute cache
async function handleAPIRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      const cachedTime = new Date(cachedResponse.headers.get('sw-cached-time'));
      const now = new Date();
      
      if (now - cachedTime < CACHE_DURATION) {
        console.log('Service Worker: Returning cached API response');
        return cachedResponse;
      }
    }

    console.log('Service Worker: Fetching fresh API data');
    const networkResponse = await fetch(request);
    
    const responseToCache = networkResponse.clone();
    const headers = new Headers(responseToCache.headers);
    headers.append('sw-cached-time', new Date().toISOString());
    
    const cachedResponseWithTime = new Response(await responseToCache.blob(), {
      status: responseToCache.status,
      statusText: responseToCache.statusText,
      headers: headers
    });
    
    await cache.put(request, cachedResponseWithTime);
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Fetch failed', error);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Network error', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Handle static assets
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log('Service Worker: Returning cached static asset');
    return cachedResponse;
  }

  try {
    console.log('Service Worker: Fetching static asset from network');
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker: Network fetch failed', error);
    
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}