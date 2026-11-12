const CACHE_NAME = 'atleticas-v5';
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
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
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

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navegacao: rede primeiro (versao nova), cache como fallback offline.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  // Fontes externas: cache em tempo de execucao para funcionar offline apos a 1a visita.
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then((c) => c.put(req, copy));
      return res;
    })));
    return;
  }
  // Demais assets do mesmo origin: cache primeiro.
  if (url.origin === location.origin) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});


