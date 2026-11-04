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

    login(identifier) {
        if (!identifier || !identifier.trim()) return null;
        const cleanName = identifier.trim();
        const userId = 'usr_' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');

        // Carrega base local de usuários para recuperar histórico
        const allUsers = this.getAllUsers();
        let user = allUsers[userId] || {
            id: userId,
            nickname: cleanName,
            balance: 5000,
            highScore: 5000,
            roundsPlayed: 0,
            favoriteSector: 'tecnologico',
            updatedAt: Date.now()
        };

        user.nickname = cleanName; // Atualiza caso tenha mudado casing
        user.updatedAt = Date.now();
        allUsers[userId] = user;

        localStorage.setItem(this.USERS_KEY, JSON.stringify(allUsers));
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        return user;
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
