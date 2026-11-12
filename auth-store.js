// Gerenciamento simples de identificação e persistência do jogador
const AuthStore = {
    STORAGE_KEY: 'tigrinho_active_user',
    USERS_KEY: 'tigrinho_all_users',

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

        const userId = 'usr_' + String(phone).replace(/\D/g, '');
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
        user.updatedAt = Date.now();
        allUsers[userId] = user;

        localStorage.setItem(this.USERS_KEY, JSON.stringify(allUsers));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
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

