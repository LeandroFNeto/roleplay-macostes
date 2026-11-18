importScripts('./mascots-config.js');

const CACHE_NAME = 'atleticas-v21';
const ASSETS_TO_CACHE = [...new Set([
  './',
  './index.html',
  './style.css',
  './script.js',
  './app-mode.js',
  './auth-store.js',
  './ranking-service.js',
  './sound-manager.js',
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
  './assets/animations/ferradura_relic.png',
  './assets/sounds/clique-interface.wav',
  './assets/sounds/escolha-valor.wav',
  './assets/sounds/momento-roleta-2.wav',
  './assets/sounds/bonus-win-padrao.wav',
  './assets/sounds/bonus-win-2.wav',
  // Inclui todos os fundos, símbolos e animações, mesmo dos jogos ainda não visitados.
  ...Object.values(MASCOTS_CATALOG).flatMap(sector => [
    sector.image, sector.superWinImage, sector.megaWinImage, sector.superMegaWinImage, sector.throwImage, sector.relicImage, sector.bgImage,
    ...(sector.symbolImages || [])
  ]).filter(Boolean).map(path => './' + path)
])];

async function reportOfflineCache(target) {
  const cache = await caches.open(CACHE_NAME);
  const entries = await Promise.all(ASSETS_TO_CACHE.map(path => cache.match(path)));
  target.postMessage({
    type: 'OFFLINE_CACHE_STATUS',
    version: CACHE_NAME,
    ready: entries.every(Boolean)
  });
}

self.addEventListener('message', event => {
  if (event.data?.type === 'CHECK_OFFLINE_CACHE' && event.source) {
    event.waitUntil(reportOfflineCache(event.source));
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith('atleticas-') && key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim()).then(async () => {
      const clients = await self.clients.matchAll({ type: 'window' });
      await Promise.all(clients.map(reportOfflineCache));
    })
  );
});

const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Ranking e sessões devem sempre consultar o servidor, sem cache de respostas.
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return;

  // Navegacao: rede primeiro (versao nova), cache como fallback offline.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      try {
        const response = await fetch(req, { signal: controller.signal });
        if (response.ok) return response;
        return (await cache.match('./index.html')) || response;
      } catch {
        return (await cache.match('./index.html')) || Response.error();
      } finally {
        clearTimeout(timer);
      }
    })());
    return;
  }
  // Fontes externas: cache em tempo de execucao para funcionar offline apos a 1a visita.
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const response = await fetch(req);
        if (response.ok) event.waitUntil(cache.put(req, response.clone()));
        return response;
      } catch {
        // A fonte local padrão permite jogar mesmo sem fontes externas.
        return new Response('', { status: 200 });
      }
    })());
    return;
  }
  // Codigo (js/css/json): rede primeiro, para atualizacoes chegarem logo; cache so offline.
  if (url.origin === location.origin && /\.(js|css|json)$/.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(req);
        if (response.ok) event.waitUntil(cache.put(req, response.clone()));
        return response;
      } catch {
        return (await cache.match(req)) || Response.error();
      }
    })());
    return;
  }
  // Demais assets do mesmo origin: cache primeiro.
  if (url.origin === location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const hit = await cache.match(req);
      if (hit) return hit;
      const response = await fetch(req);
      if (response.ok) event.waitUntil(cache.put(req, response.clone()));
      return response;
    })());
  }
});
