// Catálogo modular de mascotes das Atléticas da UENP e Centros Acadêmicos
const MASCOTS_CATALOG = {
    'computacao': {
        id: 'computacao',
        sectorName: 'Ciência da Computação - UENP',
        athleticName: 'A.A.A.J.V. Ja-Vali',
        mascotName: 'Javali Ja-Vali',
        icon: '🐗',
        image: 'assets/mascots/computacao-javali.png',
        symbols: ['🐗', '💻', '⚡', '⌨️', '🚀'],
        baseBonus: 2.0,
        badgeColor: 'from-red-600 to-slate-900',
        incentiveText: 'Setor de Computação: Força bruta do Ja-Vali! (+100% bônus)'
    },
    'enfermagem': {
        id: 'enfermagem',
        sectorName: 'Enfermagem - UENP',
        athleticName: 'A.A.A. XXI de Julho',
        mascotName: 'Abelha Rainha',
        icon: '🐝',
        image: 'assets/mascots/enfermagem-abelha.png',
        symbols: ['🐝', '💉', '🩹', '🩺', '🍯'],
        baseBonus: 3.0,
        badgeColor: 'from-yellow-500 to-amber-700',
        incentiveText: 'Setor de Saúde: Ferrão da Abelha! (+200% bônus especial)'
    },
    'veterinaria': {
        id: 'veterinaria',
        sectorName: 'Medicina Veterinária - UENP',
        athleticName: 'A.A.A. Coice de Burro',
        mascotName: 'Coice de Burro',
        icon: '🫏',
        image: 'assets/mascots/veterinaria-burro.png',
        symbols: ['🫏', '🐴', '🌾', '🐾', '🩺'],
        baseBonus: 2.5,
        badgeColor: 'from-emerald-700 to-green-950',
        incentiveText: 'Setor Veterinário: O Coice da Vitória! (+150% bônus)'
    },
    'agronomia': {
        id: 'agronomia',
        sectorName: 'Agronomia - UENP',
        athleticName: 'A.A.A. Rabo de Galo',
        mascotName: 'Galo Rabo de Galo',
        icon: '🐓',
        image: 'assets/mascots/agronomia-galo.png',
        symbols: ['🐓', '🌾', '🚜', '🍺', '🌽'],
        baseBonus: 2.2,
        badgeColor: 'from-rose-800 to-red-950',
        incentiveText: 'Setor do Campo & Agro: Canto do Galo Campeão! (+120% bônus)'
    },
    'biologia': {
        id: 'biologia',
        sectorName: 'Ciências Biológicas - UENP',
        athleticName: 'A.A.A. Máfia Etílica',
        mascotName: 'Máfia Etílica (Tigre)',
        icon: '🐯',
        image: 'assets/mascots/biologia-tigre.png',
        symbols: ['🐯', '🧬', '🔬', '🌿', '🍻'],
        baseBonus: 2.4,
        badgeColor: 'from-amber-600 to-red-900',
        incentiveText: 'Setor de Biologia: A Máfia comanda a bancada! (+140% bônus)'
    }
};

// Aliases para leitura via QR Code e URLs amigáveis
const MASCOTS_ALIASES = {
    // Computação
    'computacao': 'computacao',
    'cc': 'computacao',
    'bcc': 'computacao',
    'javali': 'computacao',
    'tecnologico': 'computacao',
    'ct': 'computacao',

    // Enfermagem
    'enfermagem': 'enfermagem',
    'enf': 'enfermagem',
    'abelha': 'enfermagem',

    // Veterinária
    'veterinaria': 'veterinaria',
    'vet': 'veterinaria',
    'burro': 'veterinaria',
    'coice': 'veterinaria',

    // Agronomia
    'agronomia': 'agronomia',
    'agro': 'agronomia',
    'galo': 'agronomia',
    'rabodegalo': 'agronomia',

    // Biologia
    'biologia': 'biologia',
    'bio': 'biologia',
    'mafia': 'biologia',
    'mafiaetilica': 'biologia',
    'tigre': 'biologia',
    'urso': 'biologia'
};

function getSectorConfig(param) {
    if (!param) return MASCOTS_CATALOG['computacao'];
    const normalized = String(param).toLowerCase().trim();
    const resolvedId = MASCOTS_ALIASES[normalized] || normalized;
    return MASCOTS_CATALOG[resolvedId] || MASCOTS_CATALOG['computacao'];
}
