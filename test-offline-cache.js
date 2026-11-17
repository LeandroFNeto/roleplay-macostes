const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function workerHarness() {
    const origin = 'https://game.test';
    const handlers = new Map();
    const buckets = new Map();
    let networkAvailable = true;
    let requests = 0;
    const key = request => new URL(typeof request === 'string' ? request : request.url, origin + '/').href;
    const fetch = async request => {
        requests++;
        if (!networkAvailable) throw new Error('Sem conexão');
        return new Response(key(request));
    };
    const caches = {
        async open(name) {
            if (!buckets.has(name)) buckets.set(name, new Map());
            const entries = buckets.get(name);
            return {
                async match(request) { return entries.get(key(request))?.clone(); },
                async put(request, response) { entries.set(key(request), response); },
                async addAll(paths) {
                    const downloaded = await Promise.all(paths.map(path => fetch(path)));
                    paths.forEach((path, index) => entries.set(key(path), downloaded[index]));
                }
            };
        },
        async keys() { return [...buckets.keys()]; },
        async delete(name) { return buckets.delete(name); }
    };
    const context = vm.createContext({
        URL, Response, caches, fetch, AbortController, setTimeout, clearTimeout, location: { origin },
        self: {
            addEventListener(name, callback) { handlers.set(name, callback); },
            skipWaiting() {}, clients: { async claim() {}, async matchAll() { return []; } }
        },
        importScripts(path) { vm.runInContext(fs.readFileSync(path, 'utf8'), context); }
    });
    vm.runInContext(fs.readFileSync('sw.js', 'utf8'), context);
    async function dispatch(name, values = {}) {
        const pending = [];
        let response;
        handlers.get(name)({ ...values,
            waitUntil(promise) { pending.push(promise); },
            respondWith(promise) { response = promise; }
        });
        const result = await response;
        await Promise.all(pending);
        return result;
    }
    return {
        context, caches, dispatch,
        get requests() { return requests; },
        disconnect() { networkAvailable = false; },
        request(path, mode) { return dispatch('fetch', { request: { url: key(path), method: 'GET', mode } }); }
    };
}

test('todos os recursos dos cinco mascotes ficam disponíveis sem rede após a preparação inicial', async () => {
    const harness = workerHarness();
    const assets = Array.from(vm.runInContext('ASSETS_TO_CACHE', harness.context));
    const catalog = vm.runInContext('MASCOTS_CATALOG', harness.context);
    for (const asset of assets) assert.ok(fs.existsSync(asset.split('?')[0]), `Arquivo ausente: ${asset}`);
    await harness.dispatch('install');
    harness.disconnect();
    const before = harness.requests;
    for (const sector of Object.values(catalog)) {
        for (const path of [sector.image, sector.throwImage, sector.relicImage, sector.bgImage, ...sector.symbolImages]) {
            const response = await harness.request(path);
            assert.equal(response.status, 200, path);
        }
    }
    const html = fs.readFileSync('index.html', 'utf8');
    for (const match of html.matchAll(/(?:src|href)="([^\"]+\.(?:css|js)(?:\?[^\"]*)?)"/g)) {
        if (/^https?:/.test(match[1])) continue;
        assert.ok(assets.includes('./' + match[1]), `Recurso do HTML fora do pré-cache: ${match[1]}`);
        assert.equal((await harness.request(match[1])).status, 200, match[1]);
    }
    assert.equal(harness.requests, before, 'Imagens em cache não devem consultar a rede');
    const response = await harness.request('/?setor=biologia', 'navigate');
    assert.match(await response.text(), /index\.html$/);
});

test('a indicação de offline pronto depende da integridade do cache e as APIs nunca usam cache', async () => {
    const harness = workerHarness();
    const replies = [];
    const message = { data: { type: 'CHECK_OFFLINE_CACHE' }, source: { postMessage(value) { replies.push(value); } } };
    await harness.dispatch('message', message);
    assert.equal(replies[0].ready, false);
    await harness.dispatch('install');
    await harness.dispatch('message', message);
    assert.equal(replies[1].ready, true);
    harness.disconnect();
    assert.equal(await harness.request('/api/ranking'), undefined);
    assert.equal(await harness.request('/api/login'), undefined);
});

test('atualizar o jogo preserva caches de outras aplicações e fontes externas são opcionais offline', async () => {
    const harness = workerHarness();
    await harness.caches.open('outro-aplicativo');
    await harness.caches.open('atleticas-v7');
    await harness.dispatch('install');
    await harness.dispatch('activate');
    assert.ok((await harness.caches.keys()).includes('outro-aplicativo'));
    assert.ok(!(await harness.caches.keys()).includes('atleticas-v7'));
    harness.disconnect();
    const response = await harness.request('https://fonts.googleapis.com/css2?family=Inter');
    assert.equal(response.status, 200);
    assert.equal(await response.text(), '');
});
