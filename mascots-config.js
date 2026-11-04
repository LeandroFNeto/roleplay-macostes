// Catálogo modular de mascotes e centros acadêmicos da universidade
const MASCOTS_CATALOG = {
    'tecnologico': {
        id: 'tecnologico',
        sectorName: 'Centro Tecnológico (CT)',
        mascotName: 'Javali do CT',
        icon: '🐗',
        symbols: ['🐗', '⚙️', '💻', '⚡', '🔋'],
        baseBonus: 2.0,
        badgeColor: 'from-amber-600 to-orange-700',
        incentiveText: 'Setor Tecnológico: +100% no multiplicador!'
    },
    'enfermagem': {
        id: 'enfermagem',
        sectorName: 'Centro de Enfermagem',
        mascotName: 'Abelha da Saúde',
        icon: '🐝',
        symbols: ['🐝', '💉', '🩹', '🩺', '🍯'],
        baseBonus: 3.0,
        badgeColor: 'from-yellow-500 to-amber-600',
        incentiveText: 'Setor de Alta Premiação: +200% no multiplicador!'
    },
    'medicina': {
        id: 'medicina',
        sectorName: 'Centro de Medicina',
        mascotName: 'Leão da Med',
        icon: '🦁',
        symbols: ['🦁', '🩺', '🧬', '❤️', '💊'],
        baseBonus: 2.5,
        badgeColor: 'from-emerald-600 to-teal-800',
        incentiveText: 'Setor Saúde: +150% no multiplicador!'
    },
    'computacao': {
        id: 'computacao',
        sectorName: 'Centro de Informática & TI',
        mascotName: 'Lobo da TI',
        icon: '🐺',
        symbols: ['🐺', '💻', '⌨️', '🌐', '🚀'],
        baseBonus: 2.0,
        badgeColor: 'from-blue-600 to-indigo-800',
        incentiveText: 'Setor TI: Bônus de 2x ativado!'
    },
    'odontologia': {
        id: 'odontologia',
        sectorName: 'Centro de Odontologia',
        mascotName: 'Urso da Odonto',
        icon: '🐻',
        symbols: ['🐻', '🦷', '🪥', '✨', '💎'],
        baseBonus: 2.2,
        badgeColor: 'from-cyan-600 to-blue-700',
        incentiveText: 'Setor Odonto: Bônus Sorriso de 2.2x!'
    },
    'direito': {
        id: 'direito',
        sectorName: 'Centro de Ciências Jurídicas',
        mascotName: 'Águia do Direito',
        icon: '🦅',
        symbols: ['🦅', '⚖️', '📜', '🏛️', '✒️'],
        baseBonus: 1.8,
        badgeColor: 'from-purple-600 to-slate-800',
        incentiveText: 'Setor Jurídico: Bônus de 1.8x!'
    }
};

// Aliases para compatibilidade de parâmetros URL (?setor=... ou ?mascote=...)
const MASCOTS_ALIASES = {
    'javali': 'tecnologico',
    'ct': 'tecnologico',
    'abelha': 'enfermagem',
    'leao': 'medicina',
    'med': 'medicina',
    'lobo': 'computacao',
    'ti': 'computacao',
    'urso': 'odontologia',
    'odonto': 'odontologia',
    'aguia': 'direito'
};

function getSectorConfig(param) {
    if (!param) return MASCOTS_CATALOG['tecnologico'];
    const normalized = String(param).toLowerCase().trim();
    const resolvedId = MASCOTS_ALIASES[normalized] || normalized;
    return MASCOTS_CATALOG[resolvedId] || MASCOTS_CATALOG['tecnologico'];
}
