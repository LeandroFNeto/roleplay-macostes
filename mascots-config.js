// Catálogo modular de mascotes das Atléticas da UENP e Centros Acadêmicos com Símbolos Oficiais Segmentados
const MASCOTS_CATALOG = {
    'computacao': {
        id: 'computacao',
        sectorName: 'Ciência da Computação - UENP',
        athleticName: 'A.A.A.J.V. Ja-Vali',
        mascotName: 'Javali Ja-Vali',
        icon: '🐗',
        image: 'assets/mascots/computacao-javali.png',
        symbols: ['🐗', '💻', '⚡', '⌨️', '🚀'],
        symbolImages: [
            'assets/symbols/computacao/javali_dragao.png',
            'assets/symbols/computacao/notebook_jade.png',
            'assets/symbols/computacao/raio_celeste.png',
            'assets/symbols/computacao/teclado_mecanico.png',
            'assets/symbols/computacao/foguete_imperial.png'
        ],
        baseBonus: 2.0,
        incentiveText: 'Setor de Computação: Força bruta do Ja-Vali! (+100% bônus)',
        theme: {
            primary: '#dc2626',
            accent: '#ef4444',
            bgOverlay: 'from-red-950/40 via-slate-900 to-black',
            headerBg: 'bg-gradient-to-b from-red-950 via-slate-900 to-black',
            headerBorder: 'border-red-600/60',
            headerGlow: 'shadow-[0_0_30px_rgba(220,38,38,0.4)]',
            machineBorder: 'border-red-600/50',
            machineGlow: 'shadow-[0_20px_50px_rgba(220,38,38,0.25)]',
            badgeBg: 'bg-red-600 text-white',
            pillBg: 'bg-red-950/80 text-red-300 border-red-500/50',
            titleColor: 'text-red-400',
            spinBtnClass: 'bg-gradient-to-b from-red-600 to-red-900 hover:from-red-500 hover:to-red-800 text-white shadow-[0_5px_0_#450a0a]',
            avatarGlow: 'border-red-500 shadow-[0_0_25px_rgba(220,38,38,0.6)]'
        }
    },
    'enfermagem': {
        id: 'enfermagem',
        sectorName: 'Enfermagem - UENP',
        athleticName: 'A.A.A. XXI de Julho',
        mascotName: 'Abelha Rainha',
        icon: '🐝',
        image: 'assets/mascots/enfermagem-abelha.png',
        symbols: ['🐝', '💉', '🩹', '🩺', '🍯'],
        symbolImages: [
            'assets/symbols/enfermagem/abelha_ouro.png',
            'assets/symbols/enfermagem/seringa_dragao.png',
            'assets/symbols/enfermagem/curativo_imperial.png',
            'assets/symbols/enfermagem/estetoscopio_jade.png',
            'assets/symbols/enfermagem/pote_mel_sagrado.png'
        ],
        baseBonus: 3.0,
        incentiveText: 'Setor de Saúde: Ferrão da Abelha! (+200% bônus especial)',
        theme: {
            primary: '#eab308',
            accent: '#facc15',
            bgOverlay: 'from-amber-950/40 via-slate-900 to-black',
            headerBg: 'bg-gradient-to-b from-amber-950 via-slate-900 to-black',
            headerBorder: 'border-yellow-500/60',
            headerGlow: 'shadow-[0_0_30px_rgba(234,179,8,0.4)]',
            machineBorder: 'border-yellow-500/50',
            machineGlow: 'shadow-[0_20px_50px_rgba(234,179,8,0.25)]',
            badgeBg: 'bg-yellow-500 text-slate-950 font-black',
            pillBg: 'bg-amber-950/80 text-yellow-300 border-yellow-500/50',
            titleColor: 'text-yellow-400',
            spinBtnClass: 'bg-gradient-to-b from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-slate-950 font-black shadow-[0_5px_0_#78350f]',
            avatarGlow: 'border-yellow-400 shadow-[0_0_25px_rgba(234,179,8,0.6)]'
        }
    },
    'veterinaria': {
        id: 'veterinaria',
        sectorName: 'Medicina Veterinária - UENP',
        athleticName: 'A.A.A. Coice de Burro',
        mascotName: 'Coice de Burro',
        icon: '🫏',
        image: 'assets/mascots/veterinaria-burro.png',
        symbols: ['🫏', '🐴', '🌾', '🐾', '🩺'],
        symbolImages: [
            'assets/symbols/veterinaria/burro_realeza.png',
            'assets/symbols/veterinaria/cavalo_nobre.png',
            'assets/symbols/veterinaria/trigo_ouro.png',
            'assets/symbols/veterinaria/pata_jade.png',
            'assets/symbols/veterinaria/estetoscopio_escudo.png'
        ],
        baseBonus: 2.5,
        incentiveText: 'Setor Veterinário: O Coice da Vitória! (+150% bônus)',
        theme: {
            primary: '#16a34a',
            accent: '#22c55e',
            bgOverlay: 'from-emerald-950/40 via-slate-900 to-black',
            headerBg: 'bg-gradient-to-b from-emerald-950 via-slate-900 to-black',
            headerBorder: 'border-emerald-600/60',
            headerGlow: 'shadow-[0_0_30px_rgba(22,163,74,0.4)]',
            machineBorder: 'border-emerald-600/50',
            machineGlow: 'shadow-[0_20px_50px_rgba(22,163,74,0.25)]',
            badgeBg: 'bg-emerald-600 text-white font-bold',
            pillBg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
            titleColor: 'text-emerald-400',
            spinBtnClass: 'bg-gradient-to-b from-emerald-600 to-green-800 hover:from-emerald-500 hover:to-green-700 text-white shadow-[0_5px_0_#064e3b]',
            avatarGlow: 'border-emerald-400 shadow-[0_0_25px_rgba(34,197,94,0.6)]'
        }
    },
    'agronomia': {
        id: 'agronomia',
        sectorName: 'Agronomia - UENP',
        athleticName: 'A.A.A. Rabo de Galo',
        mascotName: 'Galo Rabo de Galo',
        icon: '🐓',
        image: 'assets/mascots/agronomia-galo.png',
        symbols: ['🐓', '🌾', '🚜', '🍺', '🌽'],
        symbolImages: [
            'assets/symbols/agronomia/galo_imperial.png',
            'assets/symbols/agronomia/trigo_laco.png',
            'assets/symbols/agronomia/trator_dourado.png',
            'assets/symbols/agronomia/chopp_campo.png',
            'assets/symbols/agronomia/milho_sagrado.png'
        ],
        baseBonus: 2.2,
        incentiveText: 'Setor do Campo & Agro: Canto do Galo Campeão! (+120% bônus)',
        theme: {
            primary: '#e11d48',
            accent: '#f43f5e',
            bgOverlay: 'from-rose-950/40 via-slate-900 to-black',
            headerBg: 'bg-gradient-to-b from-rose-950 via-slate-900 to-black',
            headerBorder: 'border-rose-600/60',
            headerGlow: 'shadow-[0_0_30px_rgba(225,29,72,0.4)]',
            machineBorder: 'border-rose-600/50',
            machineGlow: 'shadow-[0_20px_50px_rgba(225,29,72,0.25)]',
            badgeBg: 'bg-rose-700 text-white font-bold',
            pillBg: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
            titleColor: 'text-rose-400',
            spinBtnClass: 'bg-gradient-to-b from-rose-600 to-red-900 hover:from-rose-500 hover:to-red-800 text-white shadow-[0_5px_0_#4c0519]',
            avatarGlow: 'border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.6)]'
        }
    },
    'biologia': {
        id: 'biologia',
        sectorName: 'Ciências Biológicas - UENP',
        athleticName: 'A.A.A. Máfia Etílica',
        mascotName: 'Urso da Máfia',
        icon: '🐻',
        image: 'assets/mascots/biologia-urso.png',
        symbols: ['🐻', '🧬', '🔬', '🌿', '🍻'],
        symbolImages: [
            'assets/symbols/biologia/urso_imperial.png',
            'assets/symbols/biologia/dna_celeste.png',
            'assets/symbols/biologia/microscopio_dragao.png',
            'assets/symbols/biologia/folhas_cura.png',
            'assets/symbols/biologia/chopp_etifico.png'
        ],
        baseBonus: 2.4,
        incentiveText: 'Setor de Biologia: O Urso da Máfia comanda a bancada! (+140% bônus)',
        theme: {
            primary: '#ea580c',
            accent: '#f97316',
            bgOverlay: 'from-amber-950/40 via-slate-900 to-black',
            headerBg: 'bg-gradient-to-b from-amber-950 via-slate-900 to-black',
            headerBorder: 'border-orange-500/60',
            headerGlow: 'shadow-[0_0_30px_rgba(234,88,12,0.4)]',
            machineBorder: 'border-orange-500/50',
            machineGlow: 'shadow-[0_20px_50px_rgba(234,88,12,0.25)]',
            badgeBg: 'bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black',
            pillBg: 'bg-orange-950/80 text-orange-300 border-orange-500/50',
            titleColor: 'text-amber-400',
            spinBtnClass: 'bg-gradient-to-b from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black shadow-[0_5px_0_#7c2d12]',
            avatarGlow: 'border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.6)]'
        }
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
