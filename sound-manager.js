// Efeitos sonoros do jogo (API nativa new Audio). Falhas de áudio nunca interrompem o jogo.
const SoundManager = (() => {
    const FILES = {
        click: 'assets/sounds/clique-interface.wav',
        bet: 'assets/sounds/escolha-valor.wav',
        spin: 'assets/sounds/momento-roleta-2.wav',
        win: 'assets/sounds/bonus-win-padrao.wav',
        bigWin: 'assets/sounds/bonus-win-2.wav'
    };
    // Ponto de início de cada som, em segundos (padrão: 0).
    const START_AT = {};
    const sounds = {};
    const requested = new Set(); // sons pedidos pelo jogo: o desbloqueio não os pausa

    // Música ambiente: volume normal e reduzido durante o giro (iPhone/iPad usam o perfil mínimo).
    const AMBIENT_SRC = 'assets/sounds/solta-carta-ambiente.mp3';
    const AMBIENT_VOLUMES = { normal: 0.40, ducked: 0.06 };
    const AMBIENT_VOLUMES_IOS = { normal: 0.10, ducked: 0.02 };
    const nav = typeof navigator !== 'undefined' ? navigator : {};
    const isIOS = /iphone|ipad|ipod/i.test(nav.userAgent || '')
        || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
    const ambientVolumes = isIOS ? AMBIENT_VOLUMES_IOS : AMBIENT_VOLUMES;
    let ambient = null;
    let ambientGain = null;    // GainNode, quando a Web Audio API está disponível
    let ambientCtx = null;
    let ambientGraphTried = false;
    let ambientStarted = false;
    let ambientDucked = false;
    let pausedByVisibility = false;

    if (typeof Audio !== 'undefined') {
        for (const [key, src] of Object.entries(FILES)) {
            try {
                const audio = new Audio(src);
                audio.preload = 'auto';
                sounds[key] = audio;
            } catch { /* navegador sem suporte: segue sem som */ }
        }
        if (sounds.spin) sounds.spin.loop = true;
        try {
            ambient = new Audio(AMBIENT_SRC);
            ambient.loop = true;
            ambient.preload = 'none'; // ~14 MB: só baixa quando a música começa
        } catch { ambient = null; }
    }

    function play(key, restart = true) {
        const audio = sounds[key];
        if (!audio) return;
        requested.add(audio);
        try {
            audio.muted = false;
            if (restart) audio.currentTime = START_AT[key] || 0;
            const result = audio.play();
            if (result && typeof result.catch === 'function') result.catch(() => {});
        } catch { /* reprodução bloqueada ou arquivo indisponível */ }
    }

    // iOS/Safari só deixa tocar fora de um gesto elementos já tocados durante um gesto.
    function unlock() {
        for (const audio of Object.values(sounds)) {
            try {
                audio.muted = true;
                const result = audio.play();
                const restore = () => {
                    if (requested.has(audio)) return;
                    audio.pause();
                    audio.currentTime = 0;
                    audio.muted = false;
                };
                if (result && typeof result.then === 'function') result.then(restore, restore);
                else restore();
            } catch { audio.muted = false; }
        }
    }
    if (typeof document !== 'undefined' && Object.keys(sounds).length) {
        document.addEventListener('pointerdown', unlock, { once: true });
    }

    // No iOS, audio.volume é somente leitura: sem GainNode não há como abaixar a música.
    function ensureAmbientGraph() {
        if (ambientGraphTried) return;
        ambientGraphTried = true;
        const Ctx = typeof AudioContext !== 'undefined' ? AudioContext
            : (typeof webkitAudioContext !== 'undefined' ? webkitAudioContext : null);
        if (!Ctx) return;
        try {
            const ctx = new Ctx();
            const source = ctx.createMediaElementSource(ambient);
            const gain = ctx.createGain();
            source.connect(gain);
            gain.connect(ctx.destination);
            ambientCtx = ctx;
            ambientGain = gain;
        } catch { ambientCtx = null; ambientGain = null; }
    }

    function canControlAmbientVolume() {
        return Boolean(ambientGain) || !isIOS;
    }

    function applyAmbientVolume() {
        if (!ambient) return;
        const target = ambientDucked ? ambientVolumes.ducked : ambientVolumes.normal;
        try {
            if (ambientGain) {
                const { gain } = ambientGain;
                if (ambientStarted && typeof gain.setTargetAtTime === 'function') {
                    if (typeof gain.cancelScheduledValues === 'function') gain.cancelScheduledValues(ambientCtx.currentTime);
                    gain.setTargetAtTime(target, ambientCtx.currentTime, 0.08);
                } else {
                    gain.value = target;
                }
            } else {
                ambient.volume = target;
            }
        } catch { /* ignora */ }
    }

    function resumeAmbientContext() {
        if (!ambientCtx || ambientCtx.state !== 'suspended') return;
        try {
            const result = ambientCtx.resume();
            if (result && typeof result.catch === 'function') result.catch(() => {});
        } catch { /* ignora */ }
    }

    function playAmbient() {
        if (!ambient.paused) return;
        try {
            const result = ambient.play();
            if (result && typeof result.catch === 'function') result.catch(() => {});
        } catch { /* reprodução bloqueada ou arquivo indisponível */ }
    }

    function iniciarMusicaAmbiente() {
        if (!ambient) return;
        ensureAmbientGraph();
        if (!canControlAmbientVolume()) return; // iOS sem GainNode: melhor sem música do que a 100%
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        resumeAmbientContext();
        if (!ambientStarted) {
            applyAmbientVolume();
            ambientStarted = true;
        }
        pausedByVisibility = false;
        playAmbient();
    }

    function reduzirVolumeAmbiente() {
        ambientDucked = true;
        applyAmbientVolume();
    }

    function restaurarVolumeAmbiente() {
        ambientDucked = false;
        applyAmbientVolume();
    }

    // Pausa em segundo plano e retoma ao voltar (só se a música já tinha começado).
    if (typeof document !== 'undefined' && ambient) {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                if (ambientStarted && !ambient.paused) {
                    pausedByVisibility = true;
                    try { ambient.pause(); } catch { /* ignora */ }
                }
            } else if (pausedByVisibility) {
                pausedByVisibility = false;
                resumeAmbientContext();
                applyAmbientVolume();
                playAmbient();
            }
        });
    }

    return {
        iniciarMusicaAmbiente,
        reduzirVolumeAmbiente,
        restaurarVolumeAmbiente,
        playClick() { play('click'); },
        playBetSelect() { play('bet'); },
        startSpin() {
            const audio = sounds.spin;
            reduzirVolumeAmbiente();
            if (audio && !audio.paused && !audio.muted) return;
            play('spin');
        },
        stopSpin() {
            restaurarVolumeAmbiente();
            const audio = sounds.spin;
            if (!audio) return;
            requested.delete(audio);
            try {
                audio.pause();
                audio.currentTime = 0;
            } catch { /* ignora */ }
        },
        playWin() { play('win'); },
        playBigWin() { play('bigWin'); }
    };
})();
