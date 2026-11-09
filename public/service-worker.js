importScripts('/src/version.js');
const CACHE_NAME = 'zhuyin-island-' + ZHUYIN_RELEASE.assetRevision.toLowerCase().replaceAll('.', '-');
const APP_SHELL = [
  '/offline.html', '/src/styles.css', '/src/island.css', '/src/curriculum.css', '/src/island-explore.css', '/src/version.js', '/src/app.js',
  '/src/storage.js', '/src/ticket-ledger.js', '/src/island.js', '/src/island-world.js', '/src/island-explore.js', '/src/curriculum.js',
  '/manifest.json', '/assets/icons/icon.svg', '/assets/icons/icon-192.png', '/assets/icons/icon-512.png',
  '/assets/audio/audio-manifest.json',
  '/data/zhuyin.json', '/data/characters.json', '/data/words.json', '/data/categories.json',
  '/data/media-map.json', '/data/questions.json'
];
const CORE = new Set(APP_SHELL);
const RELEASE_QUERY = '?v=' + ZHUYIN_RELEASE.assetRevision;

function isProjectCache(key) {
  return ['zhuyin-bee-', 'zhuyin-zoo-', 'zhuyin-island-'].some((prefix) => key.startsWith(prefix));
}

function canCacheStaticResponse(response, request) {
  const url = new URL(request.url);
  return response.ok && !response.redirected && response.type === 'basic'
    && request.mode !== 'navigate' && url.origin === self.location.origin && CORE.has(url.pathname) && !url.search;
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const path of APP_SHELL) {
      const request = new Request(new URL(path, self.location.origin), { cache: 'reload', redirect: 'error' });
      try {
        const response = await fetch(request);
        if (!canCacheStaticResponse(response, request)) throw new Error('Unsafe offline response');
        await cache.put(request, response);
      } catch (error) {
        console.error('Offline installation failed:', path, error.message);
        throw error;
      }
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME && isProjectCache(key)).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirstNavigate(request) {
  try { return await fetch(request); }
  catch {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match('/offline.html')) || Response.error();
  }
}

async function cacheFirstStatic(request) {
  const cache = await caches.open(CACHE_NAME);
  return (await cache.match(new URL(request.url).pathname)) || fetch(request);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    // Only known app URLs can open the shell. Navigations never write to Cache Storage.
    if (url.pathname === '/' || url.pathname === '/index.html' || url.pathname === '/offline.html') {
      event.respondWith(networkFirstNavigate(request));
    }
    return;
  }
  if (CORE.has(url.pathname) && (!url.search || url.search === RELEASE_QUERY)) event.respondWith(cacheFirstStatic(request));
});
