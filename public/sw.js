// Service Worker for QR Code Generator PWA
// Network-first for everything, so new code always loads when online.
// Cache is only used as an offline fallback.

const CACHE_NAME = 'qr-generator-v3';
const STATIC_ASSETS = ['/', '/manifest.webmanifest', '/logos/google.png', '/logos/instagram.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch((err) => console.warn('Failed to cache some static assets:', err))
  );
  self.skipWaiting();
});

// Delete every old cache (v1 cached stale JS/CSS cache-first)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  // Never touch dev / HMR traffic
  if (url.pathname.startsWith('/_next/webpack-hmr') || url.pathname.includes('__nextjs')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || Response.error()))
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
