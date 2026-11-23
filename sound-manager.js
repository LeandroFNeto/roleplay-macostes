// Efeitos sonoros do jogo (API nativa new Audio). Falhas de áudio nunca interrompem o jogo.
const SoundManager = (() => {
    const FILES = {
        click: 'assets/sounds/clique-interface.wav',
        bet: 'assets/sounds/escolha-valor.wav',
        spin: 'assets/sounds/momento-roleta-2.wav',
        win: 'assets/sounds/bonus-win-padrao.wav',
        bigWin: 'assets/sounds/bonus-win-2.wav',
        allInWin: 'assets/sounds/vaiganhar-vaiperder.mp3',
        allInLose: 'assets/sounds/xiiii.mp3'
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
        loadAsBlob('allInWin');
        try {
            ambient = new Audio(AMBIENT_SRC);
            ambient.loop = true;
            ambient.preload = 'none'; // ~14 MB: só baixa quando a música começa
        } catch { ambient = null; }
    }

    // Servidores sem Range (python http.server) e o cache do service worker entregam o arquivo
    // inteiro de uma vez: o navegador o marca como não pulável e ignora currentTime = 5.
    // Carregado como blob, o áudio fica todo na memória e o seek funciona em qualquer origem.
    function loadAsBlob(key) {
        const audio = sounds[key];
        if (!audio || typeof fetch !== 'function' || typeof URL === 'undefined'
            || typeof URL.createObjectURL !== 'function') return;
        fetch(FILES[key])
            .then(response => (response.ok ? response.blob() : null))
            .then(blob => {
                if (!blob || !audio.paused) return; // não troca a fonte no meio de uma reprodução
                audio.src = URL.createObjectURL(blob);
                audio.load();
            })
            .catch(() => { /* segue com o arquivo original */ });
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

    function stopSound(key) {
        const audio = sounds[key];
        if (!audio) return;
        requested.delete(audio);
        if (audio.paused) return;
        try { audio.pause(); } catch { /* ignora */ }
    }

    // Resultado do "Hoje estou com sorte! (Aposta Tudo)".
    // Vitória: trecho de 5s a 10s de vaiganhar-vaiperder.mp3. Derrota: xiiii.mp3 inteiro.
    // onTerminar (e a Promise devolvida) é chamado uma única vez, quando o trecho acaba —
    // ou pelo timer de segurança, se o áudio for bloqueado, não carregar ou não disparar 'ended'.
    const ALL_IN_WIN_START = 5;
    const ALL_IN_WIN_END = 10;
    const ALL_IN_LOSE_FALLBACK_MS = 6000; // usado enquanto a duração do arquivo é desconhecida
    const RESULT_ERROR_MS = 1500;          // tempo mínimo de janela quando o arquivo falha
    const RESULT_MARGIN_MS = 1500;         // folga do timer de segurança sobre a duração esperada
    let finishCurrentResult = null;

    function tocarResultadoApostaTudo(venceu, onTerminar) {
        if (finishCurrentResult) finishCurrentResult(); // encerra um resultado anterior ainda tocando
        stopSound('spin');
        for (const key of ['win', 'bigWin', 'allInWin', 'allInLose']) stopSound(key);

        return new Promise(resolve => {
            const audio = sounds[venceu ? 'allInWin' : 'allInLose'];
            const start = venceu ? ALL_IN_WIN_START : 0;
            const end = venceu ? ALL_IN_WIN_END : Infinity;
            const listeners = [];
            let timer = null;
            let finished = false;

            const knownDuration = () => (audio && Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : null);
            // Quanto ainda falta tocar, em ms, a partir da posição atual do áudio.
            const remainingMs = () => {
                if (venceu) {
                    const stop = Math.min(end, knownDuration() || end);
                    const pos = audio && audio.currentTime >= start ? audio.currentTime : start;
                    return Math.max(0, (stop - pos) * 1000);
                }
                const duration = knownDuration();
                if (!duration) return ALL_IN_LOSE_FALLBACK_MS;
                return Math.max(0, (duration - ((audio && audio.currentTime) || 0)) * 1000);
            };
            const arm = ms => {
                clearTimeout(timer);
                timer = setTimeout(finish, ms);
            };
            const on = (type, fn) => {
                if (!audio || typeof audio.addEventListener !== 'function') return;
                audio.addEventListener(type, fn);
                listeners.push([type, fn]);
            };
            const seekToStart = () => {
                try { audio.currentTime = start; } catch { /* metadados ainda não carregados */ }
            };

            function finish() {
                if (finished) return;
                finished = true;
                clearTimeout(timer);
                if (audio) {
                    for (const [type, fn] of listeners) {
                        try { audio.removeEventListener(type, fn); } catch { /* ignora */ }
                    }
                    requested.delete(audio);
                    try { audio.pause(); } catch { /* ignora */ }
                }
                if (finishCurrentResult === finish) finishCurrentResult = null;
                try { if (typeof onTerminar === 'function') onTerminar(); } catch { /* ignora */ }
                resolve();
            }
            finishCurrentResult = finish;

            if (audio) seekToStart();
            // Timer de segurança: a janela nunca fica presa, mesmo sem nenhum evento do áudio.
            arm(remainingMs() + RESULT_MARGIN_MS);
            if (!audio) return;

            on('loadedmetadata', () => {
                if (audio.currentTime < start - 0.25) seekToStart(); // o seek inicial pode ter sido ignorado
            });
            on('playing', () => {
                if (audio.currentTime < start - 0.25) seekToStart();
                arm(remainingMs() + (venceu ? 0 : RESULT_MARGIN_MS)); // vitória: o timer é o corte exato em 10s
            });
            on('timeupdate', () => {
                if (audio.currentTime >= end) finish();
            });
            on('ended', finish);
            on('error', () => arm(RESULT_ERROR_MS));

            requested.add(audio);
            try {
                audio.muted = false;
                const result = audio.play();
                if (result && typeof result.catch === 'function') {
                    // Autoplay bloqueado: mantém a janela pelo tempo nominal do trecho, sem som.
                    result.catch(() => { if (!finished) arm(remainingMs()); });
                }
            } catch {
                arm(remainingMs());
            }
        });
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
        playBigWin() { play('bigWin'); },
        tocarResultadoApostaTudo
    };
})();
