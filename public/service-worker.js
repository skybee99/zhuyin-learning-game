const CACHE_NAME = 'zhuyin-bee-v1-3-0';
const OLD_CACHE_NAMES = ['zhuyin-bee-v1-0-0','zhuyin-bee-v1-1-0','zhuyin-bee-v1-2-0','zhuyin-bee-v1-2-1'];
const APP_SHELL = [
  '/offline.html',
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
function canCacheStaticResponse(response, request) {
  const requestUrl = new URL(request.url);
  return Boolean(
    response &&
    response.ok &&
    !response.redirected &&
    response.type === 'basic' &&
    requestUrl.origin === self.location.origin &&
    request.mode !== 'navigate'
  );
}
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys
      .filter((key) => (key.startsWith('zhuyin-bee-') || OLD_CACHE_NAMES.includes(key)) && key !== CACHE_NAME)
      .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});
async function networkFirstNavigate(request) {
  try {
    return await fetch(request);
  } catch {
    return (await caches.match('/offline.html')) || Response.error();
  }
}
async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (canCacheStaticResponse(response, request)) {
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
  event.respondWith(cacheFirstStatic(event.request).catch(() => caches.match('/offline.html')));
});
