const CACHE_NAME = 'zhuyin-bee-v1-2-0';
const APP_SHELL = [
  '/index.html',
  '/src/styles.css',
  '/src/app.js',
  '/manifest.json',
  '/assets/icons/icon.svg',
  '/assets/audio/audio-manifest.json',
  '/data/zhuyin.json',
  '/data/characters.json',
  '/data/words.json',
  '/data/categories.json'
];
function canCacheResponse(response, request) {
  return (
    response &&
    response.ok &&
    !response.redirected &&
    response.type === 'basic' &&
    new URL(request.url).origin === self.location.origin
  );
}
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('zhuyin-bee-') && key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});
async function networkFirstNavigate(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (canCacheResponse(response, request)) await cache.put('/index.html', response.clone());
    return response;
  } catch {
    return (await cache.match('/index.html')) || Response.error();
  }
}
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (canCacheResponse(response, request)) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirstNavigate(event.request));
    return;
  }
  event.respondWith(cacheFirst(event.request).catch(() => caches.match('/index.html')));
});
