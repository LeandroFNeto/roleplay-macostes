// Gerenciamento simples de identificação e persistência do jogador
const AuthStore = {
    STORAGE_KEY: AppMode.localDemo ? 'tigrinho_demo_active_user' : 'tigrinho_active_user',
    USERS_KEY: AppMode.localDemo ? 'tigrinho_demo_all_users' : 'tigrinho_all_users',
    GUIDANCE_KEY: AppMode.localDemo ? 'tigrinho_demo_guidance' : 'tigrinho_account_guidance_v1',

    guidanceFor(userId) {
        try { return JSON.parse(localStorage.getItem(this.GUIDANCE_KEY) || '{}')[userId] || {}; }
        catch { return {}; }
    },

    shouldShowGuidance(user) {
        return !!user?.guidanceRequired && !this.guidanceFor(user.id).seen;
    },

    markGuidanceSeen(userId, synced = false) {
        if (!userId) return;
        let preferences;
        try { preferences = JSON.parse(localStorage.getItem(this.GUIDANCE_KEY) || '{}'); }
        catch { preferences = {}; }
        const previous = preferences[userId] || {};
        preferences[userId] = { seen: true, pending: synced ? false : previous.pending !== false };
        localStorage.setItem(this.GUIDANCE_KEY, JSON.stringify(preferences));
    },

    getCurrentUser() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    },

    // Login/cadastro no servidor: 1 conta por telefone. Retorna { user } ou { error }
    async login(phone, pin, nickname) {
        if (AppMode.localDemo) return this.loginDemo();
        let res, data;
        try {
            res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, pin, nickname })
            });
            data = await res.json();
        } catch (e) {
            return { error: 'Sem conexão com o servidor. Conecte-se para entrar.' };
        }
        if (!res.ok) return { error: data.error || 'Falha no login' };

        let normalizedPhone = String(phone).replace(/\D/g, '');
        if (normalizedPhone.length >= 12 && normalizedPhone.startsWith('55')) normalizedPhone = normalizedPhone.slice(2);
        const userId = 'usr_' + normalizedPhone;
        const allUsers = this.getAllUsers();
        const user = allUsers[userId] || {
            id: userId,
            balance: 5000,
            highScore: 5000,
            roundsPlayed: 0,
            favoriteSector: 'tecnologico'
        };
        user.nickname = data.nickname;
        user.token = data.token;
        user.guidanceRequired = data.guidanceRequired === true;
        if (!user.guidanceRequired) this.markGuidanceSeen(userId, true);
        user.updatedAt = Date.now();
        allUsers[userId] = user;

        localStorage.setItem(this.USERS_KEY, JSON.stringify(allUsers));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        return { user };
    },

    loginDemo() {
        if (!AppMode.localDemo) return { error: 'O teste está disponível somente em localhost com demo=1.' };
        const user = this.getAllUsers().demo_local || {
            id: 'demo_local',
            nickname: 'Jogador de teste',
            balance: 5000,
            highScore: 5000,
            roundsPlayed: 0,
            isDemo: true
        };
        this.saveUser(user);
        return { user };
    },
    logout() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    saveUser(user) {
        if (!user || !user.id) return;
        user.updatedAt = Date.now();
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));

        const allUsers = this.getAllUsers();
        allUsers[user.id] = user;
        localStorage.setItem(this.USERS_KEY, JSON.stringify(allUsers));
    },

    getAllUsers() {
        try {
            return JSON.parse(localStorage.getItem(this.USERS_KEY)) || {};
        } catch (e) {
            return {};
        }
    }
};
