// Service Worker for QR Code Generator PWA
// - Precaches the app shell (HTML + its JS/CSS/fonts) on install so the app works offline.
// - Network-first for HTML so new deployments show up immediately.
// - Cache-first for hashed Next.js build files (/_next/static/*) — they never change.
// Bump VERSION whenever this file changes.

const VERSION = 'v4';
const CACHE_NAME = `qr-generator-${VERSION}`;
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/icon.png',
  '/apple-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/logos/google.png',
  '/logos/instagram.png',
];

// Pull every same-origin asset referenced by the HTML (scripts, styles, fonts, preloads)
function extractAssetUrls(html) {
  const urls = new Set();
  const re = /(?:src|href)="(\/_next\/[^"]+)"/g;
  let match;
  while ((match = re.exec(html))) urls.add(match[1].replace(/&amp;/g, '&'));
  return [...urls];
}

async function precache() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(
    APP_SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => undefined))
  );
  try {
    const res = await fetch('/', { cache: 'reload' });
    if (res.ok) {
      await cache.put('/', res.clone());
      const assets = extractAssetUrls(await res.text());
      await Promise.all(assets.map((url) => cache.add(url).catch(() => undefined)));
    }
  } catch {
    // Offline during install — runtime caching will fill the cache later
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

async function putInCache(request, response) {
  if (response && response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/_next/webpack-hmr') || url.pathname.includes('__nextjs')) return;

  // Page navigations: network first, fall back to cached page, then cached app shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => putInCache(request, res))
        .catch(async () => (await caches.match(request)) || (await caches.match('/')) || Response.error())
    );
    return;
  }

  // Hashed build assets are immutable: cache first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => putInCache(request, res)))
    );
    return;
  }

  // Everything else (icons, logos, manifest, RSC payloads): network first, cache fallback
  event.respondWith(
    fetch(request)
      .then((res) => putInCache(request, res))
      .catch(async () => (await caches.match(request)) || Response.error())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();

  // The page sends the URLs it already loaded, so they get cached right after the first visit
  if (event.data && event.data.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) =>
        Promise.all(
          event.data.urls
            .filter((u) => {
              try {
                return new URL(u, self.location.origin).origin === self.location.origin;
              } catch {
                return false;
              }
            })
            .map((u) => cache.match(u).then((hit) => hit || cache.add(u).catch(() => undefined)))
        )
      )
    );
  }
});
