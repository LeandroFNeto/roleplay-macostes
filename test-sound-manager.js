const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadSoundManager(withAudio = true, playResult = () => Promise.resolve(), options = {}) {
    const created = [];
    const listeners = {};
    const contexts = [];
    class FakeAudio {
        constructor(src) {
            Object.assign(this, { src, paused: true, muted: false, loop: false, currentTime: 0, calls: [] });
            created.push(this);
        }
        play() { this.calls.push('play'); this.paused = false; return playResult(); }
        pause() { this.calls.push('pause'); this.paused = true; }
    }
    class FakeAudioContext {
        constructor() {
            Object.assign(this, { state: 'suspended', currentTime: 0, resumed: 0 });
            this.gainNode = { gain: { value: 1, setTargetAtTime(value) { this.value = value; }, cancelScheduledValues() {} }, connect() {} };
            contexts.push(this);
        }
        createMediaElementSource(element) { this.element = element; return { connect() {} }; }
        createGain() { return this.gainNode; }
        resume() { this.resumed++; this.state = 'running'; return Promise.resolve(); }
    }
    const document = {
        visibilityState: 'visible',
        addEventListener(type, callback, options) { listeners[type] = { callback, options }; }
    };
    const context = vm.createContext({
        document,
        navigator: { userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0) Chrome/130', platform: 'Win32', maxTouchPoints: 0 },
        ...(withAudio ? { Audio: FakeAudio } : {}),
        ...(options.audioContext ? { AudioContext: FakeAudioContext } : {})
    });
    vm.runInContext(fs.readFileSync('sound-manager.js', 'utf8') + '\nthis.SoundManager = SoundManager;', context);
    const bySrc = name => created.find(audio => audio.src.endsWith(name));
    const ambient = () => bySrc('solta-carta-ambiente.mp3');
    return { manager: context.SoundManager, created, listeners, bySrc, ambient, contexts, document };
}

test('sem a API de áudio o gerenciador vira no-op sem lançar erro', () => {
    const { manager, listeners } = loadSoundManager(false);
    for (const fn of ['playClick', 'playBetSelect', 'startSpin', 'stopSpin', 'playWin', 'playBigWin',
        'iniciarMusicaAmbiente', 'reduzirVolumeAmbiente', 'restaurarVolumeAmbiente']) manager[fn]();
    assert.equal(listeners.pointerdown, undefined);
});

test('cada função toca o arquivo certo e só a roleta e a música ficam em loop', () => {
    const { manager, created, bySrc } = loadSoundManager();
    assert.equal(created.length, 6);
    for (const [fn, file] of [['playClick', 'clique-interface.wav'], ['playBetSelect', 'escolha-valor.wav'],
        ['playWin', 'bonus-win-padrao.wav'], ['playBigWin', 'bonus-win-2.wav']]) {
        bySrc(file).currentTime = 3;
        manager[fn]();
        assert.deepEqual(bySrc(file).calls, ['play']);
        assert.equal(bySrc(file).currentTime, 0);
    }
    assert.deepEqual(created.filter(audio => audio.loop).map(audio => audio.src),
        ['assets/sounds/momento-roleta-2.wav', 'assets/sounds/solta-carta-ambiente.mp3']);
});

test('a roleta não reinicia se já toca e para voltando ao início', () => {
    const { manager, bySrc } = loadSoundManager();
    const spin = bySrc('momento-roleta-2.wav');
    manager.startSpin();
    spin.currentTime = 1.5;
    manager.startSpin();
    assert.deepEqual(spin.calls, ['play']);
    manager.stopSpin();
    assert.deepEqual(spin.calls, ['play', 'pause']);
    assert.equal(spin.paused, true);
    assert.equal(spin.currentTime, 0);
});

test('reprodução recusada pelo navegador não lança erro', async () => {
    const { manager } = loadSoundManager(true, () => Promise.reject(new Error('NotAllowedError')));
    manager.playWin();
    const thrower = loadSoundManager(true, () => { throw new Error('sem suporte'); }).manager;
    thrower.playClick();
    thrower.startSpin();
    await new Promise(resolve => setImmediate(resolve));
});

test('o primeiro toque desbloqueia os sons sem deixar nada tocando', async () => {
    const { listeners, created, ambient } = loadSoundManager();
    assert.equal(listeners.pointerdown.options.once, true);
    listeners.pointerdown.callback();
    await new Promise(resolve => setImmediate(resolve));
    assert.deepEqual(ambient().calls, []);
    for (const audio of created.filter(audio => audio !== ambient())) {
        assert.deepEqual(audio.calls, ['play', 'pause']);
        assert.equal(audio.paused, true);
        assert.equal(audio.muted, false);
    }
});

test('um giro pedido durante o desbloqueio continua tocando com som', async () => {
    const { manager, listeners, bySrc } = loadSoundManager();
    listeners.pointerdown.callback();
    manager.startSpin();
    await new Promise(resolve => setImmediate(resolve));
    const spin = bySrc('momento-roleta-2.wav');
    assert.equal(spin.paused, false);
    assert.equal(spin.muted, false);
});

test('a música ambiente é criada em loop, sem pré-carregar e sem tocar ao carregar', () => {
    const { ambient } = loadSoundManager();
    assert.equal(ambient().loop, true);
    assert.equal(ambient().preload, 'none');
    assert.deepEqual(ambient().calls, []);
});

test('sem Web Audio a música começa a 40% via audio.volume e só toca uma vez', () => {
    const { manager, ambient } = loadSoundManager();
    manager.iniciarMusicaAmbiente();
    manager.iniciarMusicaAmbiente();
    assert.deepEqual(ambient().calls, ['play']);
    assert.equal(ambient().volume, 0.40);
});

test('com Web Audio o ganho fica em 40% e o contexto é retomado', () => {
    const { manager, ambient, contexts } = loadSoundManager(true, undefined, { audioContext: true });
    assert.equal(contexts.length, 0); // o contexto só nasce no gesto
    manager.iniciarMusicaAmbiente();
    assert.equal(contexts.length, 1);
    assert.equal(contexts[0].element, ambient());
    assert.equal(contexts[0].gainNode.gain.value, 0.40);
    assert.equal(contexts[0].resumed, 1);
    assert.deepEqual(ambient().calls, ['play']);
});

test('o giro abaixa a música para 6% e o fim do giro volta para 40%', () => {
    const { manager, contexts } = loadSoundManager(true, undefined, { audioContext: true });
    manager.iniciarMusicaAmbiente();
    const gain = contexts[0].gainNode.gain;
    manager.startSpin();
    assert.equal(gain.value, 0.06);
    manager.stopSpin();
    assert.equal(gain.value, 0.40);
});

test('reduzir e restaurar antes de iniciar fazem a música começar no volume certo', () => {
    const ducked = loadSoundManager();
    ducked.manager.reduzirVolumeAmbiente();
    ducked.manager.iniciarMusicaAmbiente();
    assert.equal(ducked.ambient().volume, 0.06);
    const restored = loadSoundManager();
    restored.manager.startSpin();
    restored.manager.stopSpin();
    restored.manager.iniciarMusicaAmbiente();
    assert.equal(restored.ambient().volume, 0.40);
});

test('música recusada pelo navegador não lança erro', async () => {
    const { manager, ambient } = loadSoundManager(true, () => Promise.reject(new Error('NotAllowedError')));
    manager.iniciarMusicaAmbiente();
    assert.deepEqual(ambient().calls, ['play']);
    await new Promise(resolve => setImmediate(resolve));
});

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';

test('no iPhone a música usa 10% e cai para 2% no giro', () => {
    const { manager, contexts } = loadSoundManager(true, undefined, { audioContext: true, userAgent: IPHONE_UA });
    manager.iniciarMusicaAmbiente();
    const gain = contexts[0].gainNode.gain;
    assert.equal(gain.value, 0.10);
    manager.startSpin();
    assert.equal(gain.value, 0.02);
    manager.stopSpin();
    assert.equal(gain.value, 0.10);
});

test('no iPhone sem controle de volume a música não toca, mas os efeitos sim', () => {
    const { manager, ambient, bySrc } = loadSoundManager(true, undefined, { userAgent: IPHONE_UA });
    manager.iniciarMusicaAmbiente();
    assert.deepEqual(ambient().calls, []);
    manager.playClick();
    assert.deepEqual(bySrc('clique-interface.wav').calls, ['play']);
});

test('a música pausa em segundo plano e retoma ao voltar, no volume do giro em andamento', () => {
    const { manager, ambient, listeners, document, contexts } = loadSoundManager(true, undefined, { audioContext: true });
    manager.iniciarMusicaAmbiente();
    document.visibilityState = 'hidden';
    listeners.visibilitychange.callback();
    assert.deepEqual(ambient().calls, ['play', 'pause']);
    manager.startSpin();
    document.visibilityState = 'visible';
    listeners.visibilitychange.callback();
    assert.deepEqual(ambient().calls, ['play', 'pause', 'play']);
    assert.equal(contexts[0].gainNode.gain.value, 0.06);
});

test('voltar ao primeiro plano sem a música ter começado não a inicia', () => {
    const { ambient, listeners, document } = loadSoundManager();
    document.visibilityState = 'hidden';
    listeners.visibilitychange.callback();
    document.visibilityState = 'visible';
    listeners.visibilitychange.callback();
    assert.deepEqual(ambient().calls, []);
});
