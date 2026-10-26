/**
 * sw.js - Service Worker for Prompt Studio offline app shell caching.
 * Version: prompt-studio-v2
 */

const CACHE_NAME = "prompt-studio-v2";

const APP_SHELL_FILES = [
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

// Install event - Pre-cache app shell with individual failure tolerance
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        APP_SHELL_FILES.map((url) =>
          cache.add(new Request(url, { redirect: "follow" })).catch((err) => {
            console.warn("[SW] Non-critical: Failed to cache", url, err);
          })
        )
      );
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

// Fetch event - Stale-while-revalidate strategy for same-origin app shell files
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);

  // Only handle same-origin http/https requests
  if (!url.protocol.startsWith("http") || url.origin !== self.location.origin) {
    return;
  }

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
