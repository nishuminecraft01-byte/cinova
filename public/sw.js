// CINOVA Progressive Web App Service Worker
// Version: 1.0.0

const CACHE_VERSION = "cinova-v1.0.0";
const STATIC_CACHE = `cinova-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `cinova-runtime-${CACHE_VERSION}`;

// Pre-cache essential static shell assets
const PRECACHE_URLS = [
  "/offline",
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-192.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
  "/styles/globals.css",
];

// Security & Compliance: Explicitly excluded URL patterns
// Never cache private user sessions, auth tokens, playback auth gates, admin endpoints, or streaming video segments
const NEVER_CACHE_PATTERNS = [
  /\/api\/auth\//i,
  /\/api\/admin\//i,
  /\/api\/watch-time/i,
  /\/api\/playback\//i,
  /\/api\/stream\//i,
  /\/api\/monetization\//i,
  /\.m3u8($|\?)/i,
  /\.ts($|\?)/i,
  /\.mp4($|\?)/i,
  /\.webm($|\?)/i,
  /\/auth\/v1\//i, // Supabase Auth API
];

function shouldNeverCache(url, request) {
  // Only GET requests can be cached
  if (request.method !== "GET") {
    return true;
  }

  // Check against blacklisted URL patterns
  const urlString = url.href;
  for (const pattern of NEVER_CACHE_PATTERNS) {
    if (pattern.test(urlString)) {
      return true;
    }
  }

  // Never cache requests containing authorization headers
  if (request.headers && request.headers.has("Authorization")) {
    return true;
  }

  return false;
}

// Service Worker Installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(PRECACHE_URLS).catch((err) => {
          // Non-fatal: individual asset failures should not abort SW activation
          console.warn("[CINOVA SW] Precache warning:", err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Service Worker Activation & Cache Cleanup
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Routing Strategy
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-HTTP protocols (e.g. chrome-extension://, blob:)
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Security bypass for restricted patterns
  if (shouldNeverCache(url, request)) {
    return; // Pass through to standard browser network stack
  }

  // HTML Navigation Requests (App Shell & Pages)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If valid response, clone into runtime cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback: try runtime cache first, then pre-cached /offline
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          const offlinePage = await caches.match("/offline");
          if (offlinePage) {
            return offlinePage;
          }
          return new Response(
            "<html><head><meta charset='utf-8'><title>Offline - CINOVA</title><style>body{background:#080506;color:#F5F1F3;font-family:sans-serif;padding:2rem;text-align:center}</style></head><body><h1>CINOVA is Offline</h1><p>Check your internet connection to stream movies and series.</p><button onclick='location.reload()' style='background:#E11D48;color:#fff;border:none;padding:10px 20px;border-radius:20px;cursor:pointer'>Retry</button></body></html>",
            { headers: { "Content-Type": "text/html" } }
          );
        })
    );
    return;
  }

  // Static Assets (_next/static, public styles, icons, fonts)
  const isStaticAsset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/styles/") ||
    url.pathname.startsWith("/icon") ||
    url.pathname === "/manifest.json" ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff2") ||
    url.pathname.endsWith(".svg");

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch updated version in background (Stale-While-Revalidate)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(STATIC_CACHE).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Cache miss: fetch and store
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Non-sensitive image assets (TMDB posters / backdrops)
  const isImage =
    request.destination === "image" ||
    url.hostname === "image.tmdb.org" ||
    /\.(jpg|jpeg|png|webp|avif)($|\?)/i.test(url.pathname);

  if (isImage) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(RUNTIME_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Return cached fallback icon if available
            return caches.match("/icon.svg");
          });
      })
    );
    return;
  }

  // Default: Network with Cache Fallback for other GET requests
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});

// Update Control: Skip waiting when signaled by application
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
