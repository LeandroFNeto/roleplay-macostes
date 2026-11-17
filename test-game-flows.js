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

function loadGame(search = '', origin = 'https://game.test', realServices = false, sharedStorage = storage(), instantTimers = false) {
    const elements = new Map();
    function element() {
        return {
            children: [], dataset: {}, style: {}, className: '', textContent: '', innerText: '', events: {},
            open: false, openCount: 0,
            showModal() { this.open = true; this.openCount++; }, close() { this.open = false; },
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
        AbortController, setTimeout: instantTimers ? callback => { callback(); return 1; } : setTimeout, clearTimeout,
        window: { location: new URL(`${origin}/index.html${search}`), addEventListener() {} },
        localStorage: sharedStorage,
        fetch() { throw new Error('O teste não deve acessar o servidor'); },
        AuthStore: { getCurrentUser() { return null; }, saveUser() {}, shouldShowGuidance() { return false; } },
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

test('um milhão não vence; um bilhão local aguarda confirmação; só o servidor anuncia vitória', () => {
    const { context, elements } = loadGame();
    vm.runInContext("currentUser = { nickname: 'Ana', highScore: 1000000 }; updatePrizeNotice();", context);
    assert.doesNotMatch(elements.get('prize-status').textContent, /venceu|Você venceu|Aguardando confirmação/);
    vm.runInContext("currentUser.highScore = 1250000000; updatePrizeNotice();", context);
    assert.match(elements.get('prize-status').textContent, /Aguardando confirmação/);
    vm.runInContext("RankingService.competition = { status: 'closed', reason: 'target', winner: { nickname: 'Ana', score: 1250000000 } }; updatePrizeNotice();", context);
    assert.match(elements.get('prize-status').textContent, /Você venceu/);
    assert.match(elements.get('competition-status').textContent, /Vencedor: Ana/);
});

test('o recorde offline é enviado após reabrir o jogo, mesmo com saldo menor', async () => {
    const localStorage = storage();
    const offline = loadService(localStorage, () => { throw Error('offline'); }, false).service;
    offline.getMe = () => ({ id: 'usr_001', token: 'test', score: 1000000 });
    offline.submitScore('Ana', 1000000, 'Computação', '🐗');
    const sent = [];
    const online = loadService(localStorage, async (url, options) => {
        if (options.method === 'POST') sent.push(JSON.parse(options.body));
        return { ok: true, json: async () => ({ players: [], competition: { status: 'closed', winner: { nickname: 'Ana' } } }) };
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

test('orientações aparecem uma vez por conta nova e continuam acessíveis após reload, login e troca de mascote', () => {
    const localStorage = storage();
    const user = { id: 'usr_A', nickname: 'Ana', token: 'test', guidanceRequired: true, balance: 5000 };
    localStorage.setItem('tigrinho_active_user', JSON.stringify(user));
    const first = loadGame('', 'https://game.test', true, localStorage);
    assert.equal(first.elements.get('info-panel').openCount, 1);
    first.elements.get('info-understood-btn').events.click();
    assert.equal(first.elements.get('info-panel').open, false);
    const reload = loadGame('?setor=agronomia', 'https://game.test', true, localStorage);
    assert.equal(reload.elements.get('info-panel').openCount, 0);
    reload.elements.get('open-info-btn').events.click();
    assert.equal(reload.elements.get('info-panel').openCount, 1);
    reload.elements.get('close-info-btn').events.click();
    vm.runInContext("AuthStore.logout(); AuthStore.saveUser({ id: 'usr_A', nickname: 'Ana', token: 'new', guidanceRequired: true });", reload.context);
    const login = loadGame('', 'https://game.test', true, localStorage);
    assert.equal(login.elements.get('info-panel').openCount, 0);
    vm.runInContext("AuthStore.saveUser({ id: 'usr_B', nickname: 'Bia', token: 'test', guidanceRequired: true });", login.context);
    assert.equal(loadGame('', 'https://game.test', true, localStorage).elements.get('info-panel').openCount, 1);
});

test('contas existentes não recebem orientação automática; confirmação do servidor funciona em outro aparelho', async () => {
    for (const required of [false, undefined]) {
        const localStorage = storage();
        localStorage.setItem('tigrinho_active_user', JSON.stringify({ id: 'old', token: 'test', nickname: 'Antigo', guidanceRequired: required }));
        assert.equal(loadGame('', 'https://game.test', true, localStorage).elements.get('info-panel').openCount, 0);
    }
    const localStorage = storage();
    const context = vm.createContext({ localStorage, fetch: async () => ({ ok: true,
        json: async () => ({ nickname: 'Ana', token: 'test', guidanceRequired: false }) }) });
    loadAppMode(context);
    vm.runInContext(fs.readFileSync('auth-store.js', 'utf8') + '\nthis.auth = AuthStore;', context);
    const { user } = await context.auth.login('43999990000', '1234');
    assert.equal(context.auth.shouldShowGuidance(user), false);
    assert.equal(context.auth.guidanceFor(user.id).seen, true);
});

test('apresentar orientações offline persiste imediatamente e a confirmação sincroniza ao reconectar', async () => {
    const localStorage = storage();
    localStorage.setItem('tigrinho_active_user', JSON.stringify({ id: 'usr_A', token: 'test', nickname: 'Ana', guidanceRequired: true }));
    const game = loadGame('', 'https://game.test', true, localStorage);
    assert.equal(game.elements.get('info-panel').openCount, 1);
    assert.equal(JSON.parse(localStorage.getItem('tigrinho_account_guidance_v1')).usr_A.pending, true);
    const sent = [];
    const { service } = loadService(localStorage, async (url, options) => {
        if (options.method === 'POST') sent.push(JSON.parse(options.body));
        return { ok: true, json: async () => ({ players: [], guidanceSeen: true }) };
    });
    service.getMe = () => ({ id: 'usr_A', token: 'test', score: 5000, guidanceSeen: true });
    service.onScoreConfirmed = id => vm.runInContext(`AuthStore.markGuidanceSeen('${id}', true)`, game.context);
    await service.syncWithServer();
    assert.equal(sent[0].guidanceSeen, true);
    assert.equal(JSON.parse(localStorage.getItem('tigrinho_account_guidance_v1')).usr_A.pending, false);
});

test('recordes pendentes de duas contas sobrevivem à troca de jogador e sincronizam com suas identidades', async () => {
    const localStorage = storage();
    const { service: offline } = loadService(localStorage, () => { throw Error('offline'); }, false);
    offline.getMe = () => ({ id: 'A', score: 900000000 });
    offline.submitScore('Ana', 900000000, 'Computação', '🐗');
    offline.getMe = () => ({ id: 'B', score: 800000000 });
    offline.submitScore('Bia', 800000000, 'Biologia', '🐻');
    const sent = [];
    const { service } = loadService(localStorage, async (url, options) => {
        if (options.method === 'POST') sent.push(JSON.parse(options.body));
        return { ok: true, json: async () => ({ players: [], competition: { status: 'closed', winner: { nickname: 'Outra' } },
            confirmedScore: 900000000, eligibleScore: null, awardEligibility: 'closed' }) };
    });
    for (const id of ['A', 'B']) {
        service.getMe = () => ({ id, token: id, score: 5000 });
        await service.syncWithServer();
    }
    assert.equal(sent[0].score, 900000000);
    assert.equal(sent[0].token, 'A');
    assert.equal(sent[1].score, 800000000);
    assert.equal(sent[1].token, 'B');
    assert.equal(Object.keys(service.pendingByUser()).length, 0);
});

test('novo recorde durante envio não é removido pela resposta do envio anterior', async () => {
    const localStorage = storage();
    let release;
    const blocked = new Promise(resolve => { release = resolve; });
    const { service } = loadService(localStorage, async (url, options) => {
        if (options.method === 'POST') await blocked;
        return { ok: true, json: async () => ({ players: [] }) };
    });
    service.getMe = () => ({ id: 'A', token: 'test', score: 5000 });
    service.submitScore('Ana', 10000, 'Computação', '🐗');
    service.submitScore('Ana', 20000, 'Computação', '🐗');
    release();
    await service.syncPromise;
    assert.equal(service.pendingFor('A').score, 20000);
});

test('resultado confirmado da competição permanece disponível após reabrir offline', async () => {
    const localStorage = storage();
    const { service } = loadService(localStorage, async () => ({ ok: true,
        json: async () => ({ players: [], competition: { status: 'closed', reason: 'organization', winner: { nickname: 'Ana', score: 900000000 } } }) }));
    await service.syncWithServer();
    const offline = loadService(localStorage, () => { throw Error('offline'); }, false).service;
    offline.startPeriodicSync(() => {}, () => null);
    await offline.syncWithServer();
    assert.equal(offline.competition.status, 'closed');
    assert.equal(offline.competition.winner.score, 900000000);
});

test('um giro mantém relíquia automática, pontuação bonificada e dez rodadas de bônus sem botão manual', async () => {
    const { context, elements } = loadGame('', 'https://game.test', false, storage(), true);
    vm.runInContext(`
        currentUser = { id: 'A', nickname: 'Ana', token: 'test' };
        Math.random = () => 0;
        globalThis.spinCount = 0;
        globalThis.submitted = [];
        animateSpin = async () => { globalThis.spinCount++; };
        getWinningLines = () => globalThis.spinCount === 1 ? [[0, 1, 2]] : [];
        highlightWins = () => {};
        RankingService.submitScore = (...args) => globalThis.submitted.push(args);
    `, context);
    await vm.runInContext('playNormalSpin()', context);
    assert.equal(vm.runInContext('activeMascotMultiplier', context), 2);
    assert.equal(vm.runInContext('spinCount', context), 11);
    assert.equal(vm.runInContext('submitted.length', context), 1);
    assert.ok(vm.runInContext('submitted[0][1] > 5000', context));
    assert.equal(vm.runInContext('isSpinning', context), false);
    assert.ok(elements.get('relic-img').src);
    assert.equal(fs.readFileSync('index.html', 'utf8').includes('test-card-btn'), false);
});

test('os fontes Android embarcam a mesma interface, sincronização e cache da versão web', () => {
    for (const name of ['index.html', 'style.css', 'script.js', 'auth-store.js', 'ranking-service.js', 'sw.js']) {
        assert.equal(fs.readFileSync(`android/app/src/main/assets/${name}`, 'utf8'), fs.readFileSync(name, 'utf8'), name);
    }
});
