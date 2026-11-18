const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadSoundManager(withAudio = true, playResult = () => Promise.resolve()) {
    const created = [];
    const listeners = {};
    class FakeAudio {
        constructor(src) {
            Object.assign(this, { src, paused: true, muted: false, loop: false, currentTime: 0, calls: [] });
            created.push(this);
        }
        play() { this.calls.push('play'); this.paused = false; return playResult(); }
        pause() { this.calls.push('pause'); this.paused = true; }
    }
    const context = vm.createContext({
        document: { addEventListener(type, callback, options) { listeners[type] = { callback, options }; } },
        ...(withAudio ? { Audio: FakeAudio } : {})
    });
    vm.runInContext(fs.readFileSync('sound-manager.js', 'utf8') + '\nthis.SoundManager = SoundManager;', context);
    const bySrc = name => created.find(audio => audio.src.endsWith(name));
    return { manager: context.SoundManager, created, listeners, bySrc };
}

test('sem a API de áudio o gerenciador vira no-op sem lançar erro', () => {
    const { manager, listeners } = loadSoundManager(false);
    for (const fn of ['playClick', 'playBetSelect', 'startSpin', 'stopSpin', 'playWin', 'playBigWin']) manager[fn]();
    assert.equal(listeners.pointerdown, undefined);
});

test('cada função toca o arquivo certo e só a roleta fica em loop', () => {
    const { manager, created, bySrc } = loadSoundManager();
    assert.equal(created.length, 5);
    for (const [fn, file] of [['playClick', 'clique-interface.wav'], ['playBetSelect', 'escolha-valor.wav'],
        ['playWin', 'bonus-win-padrao.wav'], ['playBigWin', 'bonus-win-2.wav']]) {
        bySrc(file).currentTime = 3;
        manager[fn]();
        assert.deepEqual(bySrc(file).calls, ['play']);
        assert.equal(bySrc(file).currentTime, 0);
    }
    assert.deepEqual(created.filter(audio => audio.loop).map(audio => audio.src), ['assets/sounds/momento-roleta-2.wav']);
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
    const { listeners, created } = loadSoundManager();
    assert.equal(listeners.pointerdown.options.once, true);
    listeners.pointerdown.callback();
    await new Promise(resolve => setImmediate(resolve));
    for (const audio of created) {
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
