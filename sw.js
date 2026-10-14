// Deja la app abriendo sin conexión. Con conexión siempre trae la última versión.
const CACHE = 'mim-agenda-v4';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'demo.js', 'version.txt', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fuente = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fuente) return;
  const guardar = (res) => { if (res.ok || res.type === 'opaque') { const copia = res.clone(); caches.open(CACHE).then((c) => c.put(req, copia)); } return res; };
  if (fuente) { e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(guardar))); return; }
  // 'no-cache' obliga a preguntarle al servidor si hay algo más nuevo que lo guardado por el navegador
  e.respondWith(fetch(req.url, { cache: 'no-cache' }).then(guardar).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('index.html'))));
});
