const CACHE_NAME = 'jcl-review-v3';
const APP_SHELL = ['./','./index.html','./manifest.webmanifest','./icon.svg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const requestUrl = new URL(event.request.url);
    const isNavigation = event.request.mode === 'navigate' || requestUrl.pathname.endsWith('/index.html');
    try {
      const response = await fetch(event.request);
      if (requestUrl.origin === self.location.origin) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await caches.match(event.request);
      return cached || (isNavigation ? caches.match('./index.html') : Response.error());
    }
  })());
});