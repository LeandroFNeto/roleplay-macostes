// Serviço de Ranking Global com suporte Offline-First para Sistemas Distribuídos
const RankingService = {
    STORAGE_KEY: AppMode.localDemo ? 'tigrinho_demo_ranking' : 'tigrinho_global_ranking',
    OFFLINE_PENDING_KEY: AppMode.localDemo ? 'tigrinho_demo_pending_score' : 'tigrinho_offline_pending_score',
    LAST_SYNC_KEY: AppMode.localDemo ? 'tigrinho_demo_last_sync' : 'tigrinho_ranking_last_sync',
    COMPETITION_KEY: 'tigrinho_competition_v2',
    PENDING_BY_USER_KEY: 'tigrinho_pending_by_account',
    DEFAULT_API_URL: '/api/ranking',
    onlineCount: 0,
    prizeWinner: null,
    competition: null,
    onScoreConfirmed: null,
    getMe: null,
    onUnauthorized: null,
    REFRESH_INTERVAL_MS: 30000,
    timerId: null,
    onUpdateCallback: null,
    connectionState: 'checking',
    onConnectionChange: null,
    REQUEST_TIMEOUT_MS: 8000,
    syncPromise: null,
    requestController: null,

    pendingByUser() {
        try { return JSON.parse(localStorage.getItem(this.PENDING_BY_USER_KEY) || '{}'); }
        catch { return {}; }
    },

    pendingFor(userId) {
        const current = this.pendingByUser()[userId];
        let legacy;
        try { legacy = JSON.parse(localStorage.getItem(this.OFFLINE_PENDING_KEY)); } catch {}
        if (legacy?.userId !== userId) return current || null;
        return !current || legacy.score > current.score ? legacy : current;
    },

    rememberCompetition(data) {
        if (!data?.competition || !['open', 'closed'].includes(data.competition.status)) return;
        this.competition = data.competition;
        this.prizeWinner = this.competition.winner || null;
        localStorage.setItem(this.COMPETITION_KEY, JSON.stringify(this.competition));
    },

    setConnectionState(state) {
        this.connectionState = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : state;
        if (typeof this.onConnectionChange === 'function') this.onConnectionChange(this.connectionState);
    },

    // Um servidor que não responde não pode deixar a sincronização presa para sempre.
    async requestJson(url, options) {
        const controller = new AbortController();
        this.requestController = controller;
        const timer = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT_MS);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal, cache: 'no-store' });
            const data = await response.json();
            return { response, data };
        } finally {
            clearTimeout(timer);
            if (this.requestController === controller) this.requestController = null;
        }
    },

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
            userId: (this.getMe && this.getMe()?.id) || null,
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

        if (AppMode.localDemo) {
            if (typeof this.onUpdateCallback === 'function') this.onUpdateCallback(top50);
            return top50;
        }

        // Guarda pontuação como pendente para reconciliação com o servidor
        const pending = this.pendingByUser();
        const previous = this.pendingFor(userScore.userId);
        if (previous && previous.score > userScore.score) userScore.score = previous.score;
        pending[userScore.userId] = userScore;
        localStorage.setItem(this.PENDING_BY_USER_KEY, JSON.stringify(pending));
        localStorage.setItem(this.OFFLINE_PENDING_KEY, JSON.stringify(userScore));

        // Se houver conexão agora, tenta enviar imediatamente
        this.syncWithServer();

        return top50;
    },

    // Sincronização com o servidor distribuído (salva a última lista do momento, atualiza quando online)
    async syncWithServer() {
        if (this.syncPromise) return this.syncPromise;
        this.syncPromise = this.performSync();
        try {
            return await this.syncPromise;
        } finally {
            this.syncPromise = null;
        }
    },

    async performSync() {
        if (AppMode.localDemo) {
            this.setConnectionState('local-demo');
            this.prizeWinner = null;
            const list = this.getRanking();
            if (typeof this.onUpdateCallback === 'function') this.onUpdateCallback(list);
            return list;
        }
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            this.setConnectionState('offline');
            return this.getRanking();
        }

        const apiUrl = this.getApiUrl();
        this.setConnectionState('syncing');

        try {
            // 1. Envia pontuação atual (também serve de heartbeat de online) ou a pendente offline
            const pendingRaw = localStorage.getItem(this.OFFLINE_PENDING_KEY);
            const me = this.getMe && this.getMe();
            if (me && me.token) {
                const pending = this.pendingFor(me.id);
                const pendingScore = {
                    ...me,
                    score: Math.max(me.score, pending?.userId === me.id ? pending.score : 0)
                };
                const { response: postRes, data: receipt } = await this.requestJson(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + me.token },
                    body: JSON.stringify(pendingScore)
                });
                if (postRes.status === 401) {
                    this.setConnectionState('auth-required');
                    if (this.onUnauthorized) this.onUnauthorized();
                    return this.getRanking();
                }
                if (!postRes.ok) throw new Error('Falha ao enviar a pontuação');
                this.rememberCompetition(receipt);
                if (typeof this.onScoreConfirmed === 'function') this.onScoreConfirmed(me.id, receipt);
                if (postRes.ok) {
                    // Uma rodada pode ter salvo mais pontos enquanto o POST estava em andamento.
                    if (pendingRaw && JSON.parse(pendingRaw).userId === me.id
                        && localStorage.getItem(this.OFFLINE_PENDING_KEY) === pendingRaw) {
                        localStorage.removeItem(this.OFFLINE_PENDING_KEY);
                    }
                    const outstanding = this.pendingByUser();
                    if (JSON.stringify(outstanding[me.id]) === JSON.stringify(pending)) {
                        delete outstanding[me.id];
                        localStorage.setItem(this.PENDING_BY_USER_KEY, JSON.stringify(outstanding));
                    }
                }
            }

            // 2. Busca a lista mais recente do momento no servidor distribuído
            const { response: res, data } = await this.requestJson(apiUrl, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (res && res.ok) {
                const serverList = Array.isArray(data) ? data : data.players;
                this.onlineCount = data.online || 0;
                this.rememberCompetition(data);
                if (Array.isArray(serverList)) {
                    const fakeNames = ['javali_bcc', 'galo_agro', 'abelha_xxi', 'urso_mafia_bio', 'coice_vet', 'bixo_computacao'];
                    const cleanList = serverList.filter(item => !fakeNames.includes((item.nickname || '').toLowerCase()));
                    cleanList.sort((a, b) => b.score - a.score);

                    // Salva a última lista do momento localmente para uso offline
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cleanList.slice(0, 50)));
                    localStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());
                    this.setConnectionState('online');

                    if (typeof this.onUpdateCallback === 'function') {
                        this.onUpdateCallback(cleanList);
                    }
                    return cleanList;
                }
            }
            throw new Error('Resposta do ranking indisponível ou inválida');
        } catch (err) {
            // Servidor indisponível ou em modo offline: mantém a última lista salva do storage
            this.setConnectionState('server-unavailable');
        }

        return this.getRanking();
    },

    // Inicia ouvintes de reconexão automática e sincronização periódica
    startPeriodicSync(onUpdateCallback, getMe) {
        this.getMe = getMe;
        this.onUpdateCallback = onUpdateCallback;
        if (!AppMode.localDemo) {
            try { this.rememberCompetition({ competition: JSON.parse(localStorage.getItem(this.COMPETITION_KEY)) }); }
            catch {}
        }
        if (this.timerId) clearInterval(this.timerId);

        // Dispara imediatamente com a lista local salva
        if (typeof onUpdateCallback === 'function') {
            onUpdateCallback(this.getRanking());
        }

        if (typeof window !== 'undefined') {
            window.addEventListener('offline', () => {
                this.setConnectionState('offline');
                if (this.requestController) this.requestController.abort();
            });
        }

        if (AppMode.localDemo) {
            this.setConnectionState('local-demo');
            if (typeof window !== 'undefined') window.addEventListener('online', () => this.syncWithServer());
            return;
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
