const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadSoundManager(withAudio = true, playResult = () => Promise.resolve(), options = {}) {
    const created = [];
    const listeners = {};
    const contexts = [];
    const timers = [];
    let nextTimer = 1;
    class FakeAudio {
        constructor(src) {
            Object.assign(this, { src, paused: true, muted: false, loop: false, currentTime: 0, duration: NaN, calls: [], handlers: {} });
            created.push(this);
        }
        addEventListener(type, fn) { (this.handlers[type] ||= []).push(fn); }
        removeEventListener(type, fn) { this.handlers[type] = (this.handlers[type] || []).filter(h => h !== fn); }
        emit(type) { for (const fn of [...(this.handlers[type] || [])]) fn(); }
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
        setTimeout(fn, ms) { const id = nextTimer++; timers.push({ id, fn, ms }); return id; },
        clearTimeout(id) { const i = timers.findIndex(t => t.id === id); if (i >= 0) timers.splice(i, 1); },
        navigator: { userAgent: options.userAgent || 'Mozilla/5.0 (Windows NT 10.0) Chrome/130', platform: 'Win32', maxTouchPoints: 0 },
        ...(withAudio ? { Audio: FakeAudio } : {}),
        ...(options.audioContext ? { AudioContext: FakeAudioContext } : {}),
        ...(options.fetch ? { fetch: options.fetch, URL: { createObjectURL: blob => 'blob:' + blob.name } } : {})
    });
    vm.runInContext(fs.readFileSync('sound-manager.js', 'utf8') + '\nthis.SoundManager = SoundManager;', context);
    const bySrc = name => created.find(audio => audio.src.endsWith(name));
    const ambient = () => bySrc('solta-carta-ambiente.mp3');
    return { manager: context.SoundManager, created, listeners, bySrc, ambient, contexts, document, timers };
}

test('sem a API de áudio o gerenciador vira no-op sem lançar erro', async () => {
    const { manager, listeners } = loadSoundManager(false);
    for (const fn of ['playClick', 'playBetSelect', 'startSpin', 'stopSpin', 'playWin', 'playBigWin',
        'iniciarMusicaAmbiente', 'reduzirVolumeAmbiente', 'restaurarVolumeAmbiente']) manager[fn]();
    assert.equal(listeners.pointerdown, undefined);
    const { manager: semAudio, timers } = loadSoundManager(false);
    let terminou = 0;
    const fim = semAudio.tocarResultadoApostaTudo(true, () => terminou++);
    assert.equal(timers.length, 1);
    timers[0].fn();
    await fim;
    assert.equal(terminou, 1);
});

test('cada função toca o arquivo certo e só a roleta e a música ficam em loop', () => {
    const { manager, created, bySrc } = loadSoundManager();
    assert.equal(created.length, 8);
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

test('vitória no aposta tudo toca do segundo 5 ao 10 e só então encerra a janela', async () => {
    const { manager, bySrc, timers } = loadSoundManager();
    const audio = bySrc('vaiganhar-vaiperder.mp3');
    bySrc('bonus-win-padrao.wav').paused = false;
    let terminou = 0;
    const fim = manager.tocarResultadoApostaTudo(true, () => terminou++);
    assert.equal(audio.currentTime, 5);
    assert.deepEqual(audio.calls, ['play']);
    assert.equal(bySrc('bonus-win-padrao.wav').paused, true, 'sons anteriores são interrompidos');
    assert.equal(timers.length, 1);
    assert.equal(timers[0].ms, 5000 + 1500, 'timer de segurança: trecho + folga');
    audio.emit('playing');
    assert.equal(timers.length, 1);
    assert.equal(timers[0].ms, 5000, 'tocando: corta exatamente no segundo 10');
    audio.currentTime = 9.8;
    audio.emit('timeupdate');
    assert.equal(terminou, 0);
    audio.currentTime = 10.05;
    audio.emit('timeupdate');
    await fim;
    assert.equal(terminou, 1);
    assert.equal(audio.paused, true);
    assert.equal(timers.length, 0);
    audio.emit('ended');
    assert.equal(terminou, 1, 'encerra uma única vez');
});

test('derrota no aposta tudo toca xiiii do início e encerra no fim do arquivo', async () => {
    const { manager, bySrc, timers } = loadSoundManager();
    const audio = bySrc('xiiii.mp3');
    audio.currentTime = 2;
    audio.duration = 3.2;
    let terminou = 0;
    const fim = manager.tocarResultadoApostaTudo(false, () => terminou++);
    assert.equal(audio.currentTime, 0);
    assert.deepEqual(audio.calls, ['play']);
    assert.equal(timers[0].ms, 3200 + 1500);
    audio.emit('ended');
    await fim;
    assert.equal(terminou, 1);
    assert.equal(timers.length, 0);
});

test('autoplay bloqueado mantém a janela pelo tempo do trecho e depois fecha', async () => {
    const { manager, timers } = loadSoundManager(true, () => Promise.reject(new Error('NotAllowedError')));
    let terminou = 0;
    const fim = manager.tocarResultadoApostaTudo(true, () => terminou++);
    await Promise.resolve(); await Promise.resolve();
    assert.equal(timers.length, 1);
    assert.equal(timers[0].ms, 5000);
    timers[0].fn();
    await fim;
    assert.equal(terminou, 1);
});

test('derrota sem duração conhecida e sem evento ended fecha pelo timer de segurança', async () => {
    const { manager, timers } = loadSoundManager();
    let terminou = 0;
    const fim = manager.tocarResultadoApostaTudo(false, () => terminou++);
    assert.equal(timers[0].ms, 6000 + 1500);
    timers[0].fn();
    await fim;
    assert.equal(terminou, 1);
});

test('um novo resultado encerra o anterior sem sobrepor os áudios', async () => {
    const { manager, bySrc } = loadSoundManager();
    let primeiro = 0;
    const fim = manager.tocarResultadoApostaTudo(true, () => primeiro++);
    manager.tocarResultadoApostaTudo(false);
    await fim;
    assert.equal(primeiro, 1);
    assert.equal(bySrc('vaiganhar-vaiperder.mp3').paused, true);
    assert.equal(bySrc('xiiii.mp3').paused, false);
});

test('o som de vitória do aposta tudo é carregado como blob para o seek ao segundo 5 funcionar', async () => {
    const pedidos = [];
    const fetch = async url => { pedidos.push(url); return { ok: true, blob: async () => ({ name: url }) }; };
    const { bySrc, created } = loadSoundManager(true, undefined, { fetch });
    const audio = bySrc('vaiganhar-vaiperder.mp3');
    audio.load = () => audio.calls.push('load');
    for (let i = 0; i < 5; i++) await Promise.resolve();
    assert.deepEqual(pedidos, ['assets/sounds/vaiganhar-vaiperder.mp3']);
    assert.equal(audio.src, 'blob:assets/sounds/vaiganhar-vaiperder.mp3');
    assert.deepEqual(audio.calls, ['load']);
    assert.equal(created.filter(a => a.src.startsWith('blob:')).length, 1);
});
