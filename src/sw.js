/* Service worker : garde l'application en mémoire pour qu'elle fonctionne sans Internet.
   Fichier généré par build.mjs : la version change à chaque préparation. */
const VERSION = '__VERSION__';
const CACHE = `petanque-atout-${VERSION}`;
const FILES = __FILES__;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('petanque-atout-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/* D'abord la copie en mémoire (hors ligne) ; la nouvelle version s'installe en arrière-plan
   et sert à la prochaine ouverture. Les appels à GitHub ne passent jamais par le cache. */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).catch(() =>
      req.mode === 'navigate' ? caches.match('./index.html') : Response.error())),
  );
});
