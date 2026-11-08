/* Service worker — Chantier PWA : fonctionnement hors ligne.
   La page est chargée depuis le réseau en priorité (mises à jour immédiates),
   avec repli sur la copie en cache quand il n'y a pas de connexion. */
const CACHE = 'chantier-v5';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const putCache = (req, res) => {
  if(res && res.status === 200 && res.type === 'basic'){
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
  }
  return res;
};

self.addEventListener('fetch', e => {
  const req = e.request;
  if(req.method !== 'GET') return;
  const isPage = req.mode === 'navigate' || req.destination === 'document';
  if(isPage){
    e.respondWith(
      fetch(req).then(res => putCache(req, res))
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => putCache(req, res)))
  );
});
