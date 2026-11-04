// Serviço de Ranking Global com atualização periódica e persistência
const RankingService = {
    STORAGE_KEY: 'tigrinho_global_ranking',
    REFRESH_INTERVAL_MS: 30000,
    timerId: null,

    defaultLeaders: [
        { nickname: 'JaVali_BCC', score: 18450, sector: 'Ciência da Computação - UENP', icon: '🐗' },
        { nickname: 'Galo_Agro', score: 17100, sector: 'Agronomia - UENP', icon: '🐓' },
        { nickname: 'Abelha_XXI', score: 16200, sector: 'Enfermagem - UENP', icon: '🐝' },
        { nickname: 'Mafia_Bio', score: 15300, sector: 'Ciências Biológicas - UENP', icon: '🐯' },
        { nickname: 'Coice_Vet', score: 14800, sector: 'Medicina Veterinária - UENP', icon: '🫏' },
        { nickname: 'Bixo_Computacao', score: 9800, sector: 'Ciência da Computação - UENP', icon: '🐗' }
    ],

    getRanking() {
        let list = [];
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            list = raw ? JSON.parse(raw) : [...this.defaultLeaders];
        } catch (e) {
            list = [...this.defaultLeaders];
        }

        // Garante ordenação decrescente por score
        list.sort((a, b) => b.score - a.score);
        return list;
    },

    submitScore(nickname, score, sectorName, mascotIcon) {
        if (!nickname || score === undefined) return;
        const list = this.getRanking();
        const existingIdx = list.findIndex(item => item.nickname.toLowerCase() === nickname.toLowerCase());

        if (existingIdx >= 0) {
            if (score > list[existingIdx].score) {
                list[existingIdx].score = score;
                list[existingIdx].sector = sectorName;
                list[existingIdx].icon = mascotIcon;
                list[existingIdx].updatedAt = Date.now();
            }
        } else {
            list.push({
                nickname,
                score,
                sector: sectorName,
                icon: mascotIcon,
                updatedAt: Date.now()
            });
        }

        list.sort((a, b) => b.score - a.score);
        const top50 = list.slice(0, 50);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(top50));
        return top50;
    },

    startPeriodicSync(onUpdateCallback) {
        if (this.timerId) clearInterval(this.timerId);

        // Dispara imediatamente e agenda intervalo de 30 segundos
        if (typeof onUpdateCallback === 'function') {
            onUpdateCallback(this.getRanking());
        }

        this.timerId = setInterval(() => {
            // Pequena variação simulada de pontuação dos líderes para dar dinamismo universitário
            this.simulateCompetitorActivity();
            if (typeof onUpdateCallback === 'function') {
                onUpdateCallback(this.getRanking());
            }
        }, this.REFRESH_INTERVAL_MS);
    },

    simulateCompetitorActivity() {
        const list = this.getRanking();
        if (!list || list.length === 0) return;
        
        // Sorteia um concorrente aleatório que não seja o primeiro
        const targetIdx = Math.floor(Math.random() * Math.min(list.length, 5));
        const bump = Math.floor(Math.random() * 250) + 50;
        list[targetIdx].score += bump;
        list.sort((a, b) => b.score - a.score);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list.slice(0, 50)));
    }
};
