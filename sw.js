/**
 * sw.js - Service Worker for Prompt Studio offline app shell caching.
 */

const CACHE_NAME = "prompt-studio-v1";

const APP_SHELL_FILES = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/data.js",
  "./js/prompt.js",
  "./js/store.js",
  "./js/app.js",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/apple-touch-icon.png",
  "./assets/favicon.svg"
];

// Install event - Pre-cache app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_FILES);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - Clean up old caches
self.addEventListener("activate", (event) => {
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

// Fetch event - Stale-while-revalidate strategy
self.addEventListener("fetch", (event) => {
  // Only handle GET requests for http/https
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith("http")) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
