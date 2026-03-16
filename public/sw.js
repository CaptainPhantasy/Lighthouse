/**
 * Lighthouse Service Worker
 * Enables offline functionality and caching for better user experience
 */

const CACHE_NAME = 'lighthouse-v1';
const OFFLINE_URL = '/index.html';

// Assets to cache immediately on service worker installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Cache strategy types
const STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
};

/**
 * Install event - precache core assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

/**
 * Determine cache strategy based on request
 */
function getStrategy(request) {
  const url = new URL(request.url);

  // API calls - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    return STRATEGIES.NETWORK_FIRST;
  }

  // Static assets (JS, CSS) - cache first
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?)$/)) {
    return STRATEGIES.CACHE_FIRST;
  }

  // HTML - stale while revalidate for quick loads
  if (request.headers.get('accept')?.includes('text/html')) {
    return STRATEGIES.STALE_WHILE_REVALIDATE;
  }

  return STRATEGIES.NETWORK_FIRST;
}

/**
 * Fetch event - handle requests with appropriate strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const strategy = getStrategy(request);

  if (strategy === STRATEGIES.CACHE_FIRST) {
    event.respondWith(cacheFirst(request));
  } else if (strategy === STRATEGIES.NETWORK_FIRST) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

/**
 * Cache First: Check cache first, fallback to network
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return offline fallback for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match(OFFLINE_URL);
    }
    throw new Error('Network request failed');
  }
}

/**
 * Network First: Try network first, fallback to cache
 */
async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    // Return offline fallback for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match(OFFLINE_URL);
    }
    throw new Error('Network request failed and no cache available');
  }
}

/**
 * Stale While Revalidate: Return cache immediately, update in background
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  // Fetch in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });

  // Return cached version immediately, or wait for network if no cache
  return cached || fetchPromise;
}

/**
 * Message event - handle messages from clients
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
});
