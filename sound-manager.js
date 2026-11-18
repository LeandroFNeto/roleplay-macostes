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

    if (typeof Audio !== 'undefined') {
        for (const [key, src] of Object.entries(FILES)) {
            try {
                const audio = new Audio(src);
                audio.preload = 'auto';
                sounds[key] = audio;
            } catch { /* navegador sem suporte: segue sem som */ }
        }
        if (sounds.spin) sounds.spin.loop = true;
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

    return {
        playClick() { play('click'); },
        playBetSelect() { play('bet'); },
        startSpin() {
            const audio = sounds.spin;
            if (audio && !audio.paused && !audio.muted) return;
            play('spin');
        },
        stopSpin() {
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
