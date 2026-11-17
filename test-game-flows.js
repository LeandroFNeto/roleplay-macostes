const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function storage() {
    const entries = new Map();
    return {
        getItem: key => entries.get(key) ?? null,
        setItem: (key, value) => entries.set(key, String(value)),
        removeItem: key => entries.delete(key)
    };
}

function loadAppMode(context) {
    vm.runInContext(fs.readFileSync('app-mode.js', 'utf8'), context);
}

function loadService(localStorage, fetch, online = true, href = 'https://game.test/') {
    const events = {};
    const context = vm.createContext({ localStorage, fetch, navigator: { onLine: online }, URLSearchParams,
        AbortController, setTimeout, clearTimeout, setInterval() { return 1; }, clearInterval() {},
        window: { location: new URL(href), addEventListener(type, callback) { events[type] = callback; } } });
    loadAppMode(context);
    vm.runInContext(fs.readFileSync('ranking-service.js', 'utf8') + '\nthis.service = RankingService;', context);
    return { context, service: context.service, events };
}

function loadGame(search = '', origin = 'https://game.test', realServices = false) {
    const elements = new Map();
    function element() {
        return {
            children: [], dataset: {}, style: {}, className: '', textContent: '', innerText: '', events: {},
            classList: { add() {}, remove() {}, contains() { return true; } },
            set innerHTML(value) { this.children = []; },
            append(...items) { this.children.push(...items); },
            appendChild(item) { this.children.push(item); },
            setAttribute(key, value) { this[key] = value; },
            addEventListener(type, callback) { this.events[type] = callback; }, querySelector() { return element(); }
        };
    }
    const document = {
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, element());
            return elements.get(id);
        },
        createElement(tagName) { return { ...element(), tagName }; },
        querySelectorAll() { return []; }, addEventListener() {}, title: ''
    };
    const timers = [];
    const context = vm.createContext({
        document, URL, URLSearchParams, Date, Image: class {},
        AbortController, setTimeout, clearTimeout,
        window: { location: new URL(`${origin}/index.html${search}`), addEventListener() {} },
        localStorage: storage(),
        fetch() { throw new Error('O teste não deve acessar o servidor'); },
        AuthStore: { getCurrentUser() { return null; }, saveUser() {} },
        RankingService: { startPeriodicSync() {}, prizeWinner: null },
        setInterval(callback) { timers.push(callback); }
    });
    loadAppMode(context);
    if (realServices) {
        vm.runInContext(fs.readFileSync('auth-store.js', 'utf8'), context);
        vm.runInContext(fs.readFileSync('ranking-service.js', 'utf8'), context);
    }
    vm.runInContext(fs.readFileSync('mascots-config.js', 'utf8'), context);
    vm.runInContext(fs.readFileSync('script.js', 'utf8'), context);
    return { context, elements, timers };
}

test('os cinco mascotes abrem por links próprios e aceitam os parâmetros legados', () => {
    for (const id of ['computacao', 'enfermagem', 'veterinaria', 'agronomia', 'biologia']) {
        for (const parameter of ['setor', 'sector', 'mascote']) {
            const { context } = loadGame(`?${parameter}=${id}`);
            assert.equal(vm.runInContext('currentSector.id', context), id);
            assert.equal(vm.runInContext(`getSectorUrl('${id}')`, context), `https://game.test/index.html?setor=${id}`);
        }
    }
    const { context } = loadGame('?setor=inexistente');
    assert.equal(vm.runInContext('currentSector.id', context), 'computacao');
});

test('o aviso mostra só os dois jogos com maior bônus e preserva o bônus de um giro na rotação', () => {
    const { context, elements, timers } = loadGame();
    const boosted = Array.from(vm.runInContext('getBoostedSectorsState().boostedIds', context));
    assert.equal(new Set(boosted).size, 2);
    const games = elements.get('payout-games').children.filter(child => typeof child === 'object');
    assert.equal(games.length, 2);
    assert.equal(games.filter(child => child.tagName === 'a').length, boosted.includes('computacao') ? 1 : 2);
    for (const game of games.filter(child => child.tagName === 'a')) {
        assert.ok(boosted.includes(new URL(game.href).searchParams.get('setor')));
    }
    vm.runInContext('isSpinning = true; multiplier = 14; lastKnownCycleIndex = -1;', context);
    timers[0]();
    assert.equal(vm.runInContext('multiplier', context), 14);
    assert.match(elements.get('payout-countdown').textContent, /^\d{2}:\d{2}$/);
});

test('um milhão local exibe pendência; só a confirmação do servidor anuncia vitória', () => {
    const { context, elements } = loadGame();
    vm.runInContext("currentUser = { nickname: 'Ana', highScore: 1000000 }; updatePrizeNotice();", context);
    assert.match(elements.get('prize-status').textContent, /Aguardando confirmação/);
    vm.runInContext("RankingService.prizeWinner = { nickname: 'Ana' }; updatePrizeNotice();", context);
    assert.match(elements.get('prize-status').textContent, /Seu telefone cadastrado foi salvo/);
});

test('o recorde offline é enviado após reabrir o jogo, mesmo com saldo menor', async () => {
    const localStorage = storage();
    const offline = loadService(localStorage, () => { throw Error('offline'); }, false).service;
    offline.getMe = () => ({ id: 'usr_001', token: 'test', score: 1000000 });
    offline.submitScore('Ana', 1000000, 'Computação', '🐗');
    const sent = [];
    const online = loadService(localStorage, async (url, options) => {
        if (options.method === 'POST') sent.push(JSON.parse(options.body));
        return { ok: true, json: async () => ({ players: [], prizeWinner: { nickname: 'Ana' } }) };
    }).service;
    online.getMe = () => ({ id: 'usr_001', token: 'test', score: 700000 });
    await online.syncWithServer();
    assert.equal(sent[0].score, 1000000);
    assert.equal(online.prizeWinner.nickname, 'Ana');
    assert.equal(localStorage.getItem(online.OFFLINE_PENDING_KEY), null);
});

test('a sincronização não atribui pontos pendentes de outra conta ao jogador atual', async () => {
    const localStorage = storage();
    localStorage.setItem('tigrinho_offline_pending_score', JSON.stringify({ userId: 'usr_A', score: 1000000 }));
    let submitted;
    const { service } = loadService(localStorage, async (url, options) => {
        if (options.method === 'POST') submitted = JSON.parse(options.body);
        return { ok: true, json: async () => ({ players: [] }) };
    });
    service.getMe = () => ({ id: 'usr_B', token: 'test', score: 5000 });
    await service.syncWithServer();
    assert.equal(submitted.score, 5000);
});

function rankingApi() {
    const values = new Map();
    const hashes = new Map();
    const redis = {
        async get(key) { return values.get(key) ?? null; },
        async set(key, value, options) {
            if (options?.nx && values.has(key)) return null;
            values.set(key, structuredClone(value));
            return 'OK';
        },
        async hget(key, id) { return hashes.get(key)?.[id] ?? null; },
        async hset(key, entries) { hashes.set(key, { ...hashes.get(key), ...entries }); },
        async hgetall(key) { return hashes.get(key) ?? {}; }
    };
    const context = vm.createContext({
        redis,
        clean: (value, length) => String(value ?? '').replace(/[<>]/g, '').trim().slice(0, length),
        body: req => req.body || {},
        getSession: async req => req.session || null
    });
    const source = fs.readFileSync('api/ranking.mjs', 'utf8')
        .replace(/^import .*;\r?\n/, '')
        .replace('export default async function handler', 'async function handler');
    vm.runInContext(source + '\nthis.handler = handler;', context);
    async function request(method, score, phone, nickname = 'Ana') {
        const response = { statusCode: 200, setHeader() {}, status(code) { this.statusCode = code; return this; },
            json(data) { this.data = data; }, end() {} };
        await context.handler({ method, body: { score, phone: 'forged', nickname: 'forged' },
            session: phone ? { phone, user: { nickname } } : null }, response);
        return response;
    }
    return { values, request };
}

test('somente pontuações autenticadas a partir de um milhão podem registrar o prêmio', async () => {
    const { values, request } = rankingApi();
    assert.equal((await request('POST', 1000000)).statusCode, 401);
    assert.equal((await request('POST', 'invalid', '001')).statusCode, 400);
    await request('POST', 999999, '001');
    assert.equal(values.size, 0);
    await request('POST', 1000000, '001');
    assert.equal(values.get('prize:first-million').phone, '001');
    assert.equal(values.get('prize:first-million').nickname, 'Ana');
});

test('requisições simultâneas elegem um único vencedor e a API nunca expõe seu telefone', async () => {
    const { values, request } = rankingApi();
    await Promise.all(Array.from({ length: 20 }, (_, i) => request('POST', 1000000 + i, `phone_${i}`, `Jogador ${i}`)));
    const first = structuredClone(values.get('prize:first-million'));
    await request('POST', 2000000, 'outro', 'Outro jogador');
    assert.deepEqual(values.get('prize:first-million'), first);
    const response = await request('GET');
    assert.equal(response.data.prizeWinner.nickname, first.nickname);
    assert.deepEqual(Object.keys(response.data.prizeWinner).sort(), ['achievedAt', 'nickname', 'score']);
    assert.ok(!JSON.stringify(response.data).includes('phone_'));
});

test('telefone com ou sem DDI recupera a mesma conta e o mesmo saldo', async () => {
    const localStorage = storage();
    const context = vm.createContext({ localStorage, fetch: async () => ({ ok: true, json: async () => ({ nickname: 'Ana', token: 'test' }) }) });
    loadAppMode(context);
    vm.runInContext(fs.readFileSync('auth-store.js', 'utf8') + '\nthis.auth = AuthStore;', context);
    const first = (await context.auth.login('(43) 99999-0000', '1234', 'Ana')).user;
    first.balance = 42;
    context.auth.saveUser(first);
    const second = (await context.auth.login('+55 43 99999-0000', '1234')).user;
    assert.equal(second.id, first.id);
    assert.equal(second.balance, 42);
});

test('demo só funciona em loopback com parâmetro explícito, preservado nos links dos mascotes', () => {
    for (const origin of ['http://localhost:8080', 'http://127.0.0.1:3000', 'http://[::1]:8080']) {
        const { context } = loadGame('?demo=1', origin);
        assert.equal(vm.runInContext('AppMode.localDemo', context), true);
        const link = new URL(vm.runInContext("getSectorUrl('biologia')", context));
        assert.equal(link.searchParams.get('demo'), '1');
        assert.equal(link.searchParams.get('setor'), 'biologia');
    }
    for (const [origin, search] of [
        ['http://localhost:8080', ''],
        ['https://game.test', '?demo=1'],
        ['https://localhost.example.com', '?demo=1'],
        ['http://192.168.1.10:8080', '?demo=1']
    ]) {
        const { context } = loadGame(search, origin);
        assert.equal(vm.runInContext('AppMode.localDemo', context), false);
        assert.equal(new URL(vm.runInContext("getSectorUrl('biologia')", context)).searchParams.has('demo'), false);
    }
});

test('entrar no teste dispensa telefone e PIN, preserva saldo e não cria sessão do servidor', async () => {
    const { context, elements } = loadGame('?demo=1', 'http://localhost:8080', true);
    assert.equal(elements.get('login-form').hidden, true);
    assert.equal(elements.get('demo-login-btn').hidden, false);
    assert.equal(elements.get('demo-notice').hidden, false);
    assert.equal(elements.get('prize-notice').hidden, true);
    elements.get('demo-login-btn').events.click();
    assert.equal(vm.runInContext('currentUser.isDemo', context), true);
    assert.equal(vm.runInContext('currentUser.token', context), undefined);
    assert.equal(vm.runInContext('balance', context), 5000);
    vm.runInContext('balance = 0; updateUI();', context);
    elements.get('logout-btn').events.click();
    elements.get('demo-login-btn').events.click();
    assert.equal(vm.runInContext('balance', context), 0);
    assert.equal(vm.runInContext("localStorage.getItem('tigrinho_active_user')", context), null);
    vm.runInContext("balance = 1000000; updateUI(); RankingService.submitScore(currentUser.nickname, balance, currentSector.sectorName, currentSector.icon);", context);
    await vm.runInContext('RankingService.syncWithServer()', context);
    assert.equal(vm.runInContext('RankingService.getRanking()[0].score', context), 1000000);
    assert.equal(vm.runInContext("localStorage.getItem('tigrinho_offline_pending_score')", context), null);
    assert.equal(vm.runInContext('RankingService.prizeWinner', context), null);
    assert.match(elements.get('prize-status').textContent, /não participa/);
});

test('o modo de teste não faz requisições e não sobrescreve conta ou ranking normais', async () => {
    const localStorage = storage();
    localStorage.setItem('tigrinho_active_user', JSON.stringify({ id: 'real', token: 'real-session', balance: 123 }));
    localStorage.setItem('tigrinho_global_ranking', JSON.stringify([{ nickname: 'Oficial', score: 999 }]));
    let requests = 0;
    const { context, service } = loadService(localStorage, () => { requests++; throw Error('não deve chamar API'); }, true, 'http://localhost:8080/?demo=1');
    vm.runInContext(fs.readFileSync('auth-store.js', 'utf8') + '\nthis.auth = AuthStore;', context);
    const { user } = context.auth.loginDemo();
    service.getMe = () => user;
    service.submitScore(user.nickname, 1000000, 'Computação', '🐗');
    await service.syncWithServer();
    assert.equal(requests, 0);
    assert.equal(JSON.parse(localStorage.getItem('tigrinho_active_user')).balance, 123);
    assert.equal(JSON.parse(localStorage.getItem('tigrinho_global_ranking'))[0].nickname, 'Oficial');
    const normal = loadService(localStorage, () => {}).context;
    vm.runInContext(fs.readFileSync('auth-store.js', 'utf8') + '\nthis.auth = AuthStore;', normal);
    assert.equal(normal.auth.getCurrentUser().id, 'real');
    assert.ok(normal.auth.loginDemo().error);
});

test('todos os arquivos da lista de cache existem e incluem o módulo de modo de teste', () => {
    const worker = fs.readFileSync('sw.js', 'utf8');
    for (const match of worker.matchAll(/'\.\/([^']+)'/g)) {
        assert.ok(fs.existsSync(match[1]), `Arquivo de cache ausente: ${match[1]}`);
    }
    assert.ok(worker.includes("'./app-mode.js'"));
});

test('offline é informado imediatamente e pontos permanecem pendentes até a reconexão', async () => {
    const localStorage = storage();
    let requests = 0;
    const { context, service, events } = loadService(localStorage, async () => {
        requests++;
        return { ok: true, json: async () => ({ players: [] }) };
    }, false);
    const states = [];
    service.onConnectionChange = state => states.push(state);
    service.startPeriodicSync(() => {}, () => ({ id: 'usr_1', token: 'test', score: 7500 }));
    service.submitScore('Ana', 7500, 'Computação', '🐗');
    await service.syncWithServer();
    assert.equal(service.connectionState, 'offline');
    assert.equal(requests, 0);
    assert.ok(localStorage.getItem(service.OFFLINE_PENDING_KEY));
    context.navigator.onLine = true;
    events.online();
    await service.syncPromise;
    assert.equal(service.connectionState, 'online');
    assert.equal(localStorage.getItem(service.OFFLINE_PENDING_KEY), null);
    assert.deepEqual(states.slice(-2), ['syncing', 'online']);
    context.navigator.onLine = false;
    events.offline();
    assert.equal(service.connectionState, 'offline');
});

test('servidor indisponível com internet preserva pontos e uma nova tentativa recupera a conexão', async () => {
    let unavailable = true;
    const localStorage = storage();
    const { service } = loadService(localStorage, async () => ({
        ok: !unavailable, status: unavailable ? 503 : 200,
        json: async () => unavailable ? { error: 'indisponível' } : { players: [] }
    }));
    service.getMe = () => ({ id: 'usr_1', token: 'test', score: 9000 });
    service.submitScore('Ana', 9000, 'Computação', '🐗');
    await service.syncWithServer();
    assert.equal(service.connectionState, 'server-unavailable');
    assert.ok(localStorage.getItem(service.OFFLINE_PENDING_KEY));
    assert.equal(service.getRanking()[0].score, 9000);
    unavailable = false;
    await service.syncWithServer();
    assert.equal(service.connectionState, 'online');
    assert.equal(localStorage.getItem(service.OFFLINE_PENDING_KEY), null);
});

test('timeout de rede libera novas tentativas e não remove os dados pendentes', async () => {
    const localStorage = storage();
    const { service } = loadService(localStorage, (url, options) => new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('Timeout')));
    }));
    service.REQUEST_TIMEOUT_MS = 15;
    service.getMe = () => ({ id: 'usr_1', token: 'test', score: 6000 });
    service.submitScore('Ana', 6000, 'Computação', '🐗');
    await service.syncWithServer();
    assert.equal(service.connectionState, 'server-unavailable');
    assert.equal(service.syncPromise, null);
    assert.ok(localStorage.getItem(service.OFFLINE_PENDING_KEY));
});

test('a interface diferencia falta de internet, servidor indisponível e dados sincronizados', () => {
    const { context, elements } = loadGame();
    for (const [state, pattern] of [
        ['offline', /sem internet/],
        ['server-unavailable', /Sem comunicação/],
        ['syncing', /Sincronizando/],
        ['online', /servidor conectado/]
    ]) {
        vm.runInContext(`renderConnectionStatus('${state}')`, context);
        assert.match(elements.get('connection-title').textContent, pattern);
        assert.equal(elements.get('connection-notice').dataset.state, state);
    }
});
