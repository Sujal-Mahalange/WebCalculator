/**
 * sw.js - Service Worker for Offline PWA Support
 * OmniCalc Pro - Engineering Calculator
 * Developer: Sujal Mahalange
 */

const CACHE_NAME = 'omnicalc-pro-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './favicon.svg',
  './manifest.json',
  './js/calculator.js',
  './js/scientific.js',
  './js/programmer.js',
  './js/graph.js',
  './js/matrix.js',
  './js/solver.js',
  './js/converter.js',
  './js/complex.js',
  './js/stats.js',
  './js/history.js',
  './js/theme.js',
  './js/app.js'
];

// Install: Cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up older cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Network first with Cache fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Clone response and cache it
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Offline fallback from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If HTML request and not found, return root
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
  );
});

