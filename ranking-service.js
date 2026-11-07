// Serviço de Ranking Global com suporte Offline-First para Sistemas Distribuídos
const RankingService = {
    STORAGE_KEY: 'tigrinho_global_ranking',
    OFFLINE_PENDING_KEY: 'tigrinho_offline_pending_score',
    LAST_SYNC_KEY: 'tigrinho_ranking_last_sync',
    DEFAULT_API_URL: 'http://localhost:3000/api/ranking',
    REFRESH_INTERVAL_MS: 30000,
    timerId: null,
    onUpdateCallback: null,

    // Sem dados fictícios de exemplo (apenas jogadores reais)
    defaultLeaders: [],

    getApiUrl() {
        if (typeof window !== 'undefined' && window.RANKING_SERVER_URL) {
            return window.RANKING_SERVER_URL;
        }
        return this.DEFAULT_API_URL;
    },

    // Retorna a lista de ranking limpa de fakes; garante que o usuário atual esteja visível
    getRanking(currentUser = null, currentSector = null) {
        let list = [];
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                list = JSON.parse(raw);
                // Purga dados fictícios legados que possam ter ficado no storage local
                const fakeNames = ['javali_bcc', 'galo_agro', 'abelha_xxi', 'urso_mafia_bio', 'coice_vet', 'bixo_computacao'];
                list = list.filter(item => !fakeNames.includes((item.nickname || '').toLowerCase()));
            }
        } catch (e) {
            list = [];
        }

        // Se houver usuário ativo logado e ele ainda não estiver na lista, adiciona ele
        if (currentUser && currentUser.nickname) {
            const exists = list.some(item => item.nickname.toLowerCase() === currentUser.nickname.toLowerCase());
            if (!exists) {
                list.push({
                    nickname: currentUser.nickname,
                    score: currentUser.balance !== undefined ? currentUser.balance : 5000,
                    sector: (currentSector && currentSector.sectorName) || 'Ciência da Computação - UENP',
                    icon: (currentSector && currentSector.icon) || '🐗',
                    updatedAt: Date.now()
                });
            }
        }

        // Garante ordenação decrescente por score
        list.sort((a, b) => b.score - a.score);
        return list;
    },

    // Salva a pontuação localmente e agenda envio ao servidor distribuído
    submitScore(nickname, score, sectorName, mascotIcon) {
        if (!nickname || score === undefined) return;
        const list = this.getRanking();
        const existingIdx = list.findIndex(item => item.nickname.toLowerCase() === nickname.toLowerCase());

        const userScore = {
            nickname,
            score,
            sector: sectorName,
            icon: mascotIcon,
            updatedAt: Date.now()
        };

        if (existingIdx >= 0) {
            if (score > list[existingIdx].score) {
                list[existingIdx] = userScore;
            }
        } else {
            list.push(userScore);
        }

        list.sort((a, b) => b.score - a.score);
        const top50 = list.slice(0, 50);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(top50));

        // Guarda pontuação como pendente para reconciliação com o servidor
        localStorage.setItem(this.OFFLINE_PENDING_KEY, JSON.stringify(userScore));

        // Se houver conexão agora, tenta enviar imediatamente
        this.syncWithServer();

        return top50;
    },

    // Sincronização com o servidor distribuído (salva a última lista do momento, atualiza quando online)
    async syncWithServer() {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return this.getRanking();
        }

        const apiUrl = this.getApiUrl();

        try {
            // 1. Envia pontuação offline acumulada caso exista
            const pendingRaw = localStorage.getItem(this.OFFLINE_PENDING_KEY);
            if (pendingRaw) {
                const pendingScore = JSON.parse(pendingRaw);
                const postRes = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(pendingScore)
                });
                if (postRes && postRes.ok) {
                    localStorage.removeItem(this.OFFLINE_PENDING_KEY);
                }
            }

            // 2. Busca a lista mais recente do momento no servidor distribuído
            const res = await fetch(apiUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (res && res.ok) {
                const serverList = await res.json();
                if (Array.isArray(serverList)) {
                    const fakeNames = ['javali_bcc', 'galo_agro', 'abelha_xxi', 'urso_mafia_bio', 'coice_vet', 'bixo_computacao'];
                    const cleanList = serverList.filter(item => !fakeNames.includes((item.nickname || '').toLowerCase()));
                    cleanList.sort((a, b) => b.score - a.score);

                    // Salva a última lista do momento localmente para uso offline
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanList.slice(0, 50)));
                    localStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());

                    if (typeof this.onUpdateCallback === 'function') {
                        this.onUpdateCallback(cleanList);
                    }
                    return cleanList;
                }
            }
        } catch (err) {
            // Servidor indisponível ou em modo offline: mantém a última lista salva do storage
        }

        return this.getRanking();
    },

    // Inicia ouvintes de reconexão automática e sincronização periódica
    startPeriodicSync(onUpdateCallback) {
        this.onUpdateCallback = onUpdateCallback;
        if (this.timerId) clearInterval(this.timerId);

        // Dispara imediatamente com a lista local salva
        if (typeof onUpdateCallback === 'function') {
            onUpdateCallback(this.getRanking());
        }

        // Tenta sincronizar com o servidor no início
        this.syncWithServer();

        // RECONEXÃO: quando a conexão volta, envia pendências e atualiza os dados do servidor
        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.syncWithServer().then(updated => {
                    if (typeof this.onUpdateCallback === 'function') {
                        this.onUpdateCallback(updated);
                    }
                });
            });
        }

        // Checagem periódica a cada 30s
        this.timerId = setInterval(() => {
            if (typeof navigator === 'undefined' || navigator.onLine) {
                this.syncWithServer();
            }
        }, this.REFRESH_INTERVAL_MS);
    }
};
