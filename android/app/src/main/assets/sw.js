const CACHE_NAME = 'atleticas-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './auth-store.js',
  './ranking-service.js',
  './mascots-config.js',
  './tailwind.cdn.js',
  './manifest.json',
  './assets/cards/card-sprite.jpg',
  './assets/mascots/computacao-javali.png',
  './assets/mascots/enfermagem-abelha.png',
  './assets/mascots/veterinaria-burro.png',
  './assets/mascots/agronomia-galo.png',
  './assets/mascots/biologia-urso.png',
  './assets/relics/xicara_java.png',
  './assets/relics/seringa_jade.png',
  './assets/relics/ferradura_ouro.png',
  './assets/relics/milho_sagrado.png',
  './assets/relics/peixe_carpa.png',
  './assets/animations/javali_base_mascot.png',
  './assets/animations/javali_buff.png',
  './assets/animations/javali_throw.png',
  './assets/animations/abelha_buff.png',
  './assets/animations/abelha_throw.png',
  './assets/animations/burro_base_mascot.png',
  './assets/animations/burro_buff.png',
  './assets/animations/burro_throw.png',
  './assets/animations/galo_buff.png',
  './assets/animations/galo_throw.png',
  './assets/animations/urso_buff.png',
  './assets/animations/urso_throw.png',
  './assets/animations/xicara_relic.png',
  './assets/animations/ferradura_relic.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request).catch(() => caches.match('./index.html')))
  );
});
