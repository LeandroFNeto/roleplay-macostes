// Catálogo modular de mascotes das Atléticas da UENP e Centros Acadêmicos com Símbolos Oficiais Segmentados
const MASCOTS_CATALOG = {
    'computacao': {
        id: 'computacao',
        sectorName: 'Ciência da Computação - UENP',
        athleticName: 'A.A.A.J.V. Ja-Vali',
        mascotName: 'Javali Ja-Vali',
        icon: '🐗',
        image: 'assets/animations/javali_buff.png',
        throwImage: 'assets/animations/javali_throw.png',
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
        relicImage: 'assets/animations/xicara_relic.png',
        relicName: 'Xícara Sagrada de Java',
        relicActionText: 'O Javali lançou a Xícara de Java fumegante!',
        bgImage: 'assets/backgrounds/bg_computacao_cct.svg',
        bgSize: 'cover',
        bgPosition: 'center bottom',
        theme: {
            pageBg: 'radial-gradient(circle at 50% 12%, rgba(250, 204, 21, 0.15) 0%, #121212 45%, #000000 95%)',
            stageBg: 'radial-gradient(circle at 50% 25%, #2a2a2a 0%, #141414 60%, #050505 95%)',
            primary: '#e5e5e5',
            accent: '#facc15',
            bgOverlay: 'from-neutral-950 via-slate-900 to-black',
            headerBg: 'bg-black',
            headerBorder: 'border-yellow-500/60',
            headerGlow: 'shadow-[0_0_30px_rgba(250,204,21,0.3)]',
            machineBorder: 'border-yellow-500/50',
            machineGlow: 'shadow-[0_20px_50px_rgba(0,0,0,0.95)]',
            badgeBg: 'bg-black text-yellow-300 border border-yellow-500/60',
            pillBg: 'bg-neutral-900/90 text-yellow-300 border-yellow-500/40',
            titleColor: 'text-yellow-400',
            spinBtnClass: 'bg-gradient-to-b from-yellow-500 to-amber-600 text-slate-950 font-black',
            avatarGlow: 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.6)]'
        }
    },
    'enfermagem': {
        id: 'enfermagem',
        sectorName: 'Enfermagem - UENP',
        athleticName: 'A.A.A. XXI de Julho',
        mascotName: 'Abelha Rainha',
        icon: '🐝',
        image: 'assets/animations/abelha_buff.png',
        throwImage: 'assets/animations/abelha_throw.png',
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
        relicImage: 'assets/relics/seringa_jade.png',
        relicName: 'Seringa Imperial de Jade',
        relicActionText: 'A Abelha disparou a Seringa de Jade!',
        bgImage: 'assets/backgrounds/bg_enfermagem_clinica.jpg',
        bgSize: 'cover',
        bgPosition: 'center bottom',
        theme: {
            pageBg: 'radial-gradient(circle at 50% 12%, rgba(234, 179, 8, 0.5) 0%, #3d2602 45%, #140d00 95%)',
            stageBg: 'radial-gradient(circle at 50% 25%, #633e03 0%, #331f01 60%, #110a00 95%)',
            primary: '#eab308',
            accent: '#facc15',
            bgOverlay: 'from-amber-950/40 via-slate-900 to-black',
            headerBg: 'bg-gradient-to-b from-amber-950 via-slate-900 to-black',
            headerBorder: 'border-yellow-500/60',
            headerGlow: 'shadow-[0_0_30px_rgba(234,179,8,0.5)]',
            machineBorder: 'border-yellow-500/50',
            machineGlow: 'shadow-[0_20px_50px_rgba(234,179,8,0.35)]',
            badgeBg: 'bg-yellow-500 text-slate-950 font-black',
            pillBg: 'bg-amber-950/90 text-yellow-300 border-yellow-400/60',
            titleColor: 'text-yellow-300',
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
        image: 'assets/animations/burro_buff.png',
        throwImage: 'assets/animations/burro_throw.png',
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
        relicImage: 'assets/animations/ferradura_relic.png',
        relicName: 'Ferradura Dourada da Vitória',
        relicActionText: 'O Burro arremessou a Ferradura Dourada!',
        bgImage: 'assets/backgrounds/bg_veterinaria_vet.jpg',
        bgSize: 'cover',
        bgPosition: 'center bottom',
        theme: {
            pageBg: 'radial-gradient(circle at 50% 12%, rgba(22, 163, 74, 0.45) 0%, #032b13 45%, #011207 95%)',
            stageBg: 'radial-gradient(circle at 50% 25%, #054a22 0%, #032e15 60%, #011308 95%)',
            primary: '#16a34a',
            accent: '#22c55e',
            bgOverlay: 'from-emerald-950/40 via-slate-900 to-black',
            headerBg: 'bg-gradient-to-b from-emerald-950 via-slate-900 to-black',
            headerBorder: 'border-emerald-500/60',
            headerGlow: 'shadow-[0_0_30px_rgba(22,163,74,0.5)]',
            machineBorder: 'border-emerald-500/50',
            machineGlow: 'shadow-[0_20px_50px_rgba(22,163,74,0.35)]',
            badgeBg: 'bg-emerald-600 text-white font-bold',
            pillBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-400/60',
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
        image: 'assets/animations/galo_buff.png',
        throwImage: 'assets/animations/galo_throw.png',
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
        relicImage: 'assets/relics/milho_sagrado.png',
        relicName: 'Milho Dourado Sagrado',
        relicActionText: 'O Galo lançou o Milho Dourado Sagrado!',
        bgImage: 'assets/backgrounds/bg_agronomia_agro.jpg',
        bgSize: 'cover',
        bgPosition: 'center bottom',
        theme: {
            pageBg: 'radial-gradient(circle at 50% 12%, rgba(225, 29, 72, 0.45) 0%, #38070e 45%, #130104 95%)',
            stageBg: 'radial-gradient(circle at 50% 25%, #590915 0%, #30040b 60%, #110103 95%)',
            primary: '#e11d48',
            accent: '#f43f5e',
            bgOverlay: 'from-rose-950/40 via-slate-900 to-black',
            headerBg: 'bg-gradient-to-b from-rose-950 via-slate-900 to-black',
            headerBorder: 'border-rose-500/60',
            headerGlow: 'shadow-[0_0_30px_rgba(225,29,72,0.5)]',
            machineBorder: 'border-rose-500/50',
            machineGlow: 'shadow-[0_20px_50px_rgba(225,29,72,0.35)]',
            badgeBg: 'bg-red-700 text-white font-bold',
            pillBg: 'bg-rose-950/90 text-rose-300 border-rose-400/60',
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
        image: 'assets/animations/urso_buff.png',
        throwImage: 'assets/animations/urso_throw.png',
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
        relicImage: 'assets/relics/peixe_carpa.png',
        relicName: 'Carpa Dourada Celestial',
        relicActionText: 'O Urso lançou a Carpa Dourada das Águas!',
        bgImage: 'assets/backgrounds/bg_biologia_bio.jpg',
        bgSize: 'cover',
        bgPosition: 'center bottom',
        theme: {
            pageBg: 'radial-gradient(circle at 50% 12%, rgba(37, 99, 235, 0.45) 0%, #081d3d 45%, #020b17 95%)',
            stageBg: 'radial-gradient(circle at 50% 25%, #0f346b 0%, #071f42 60%, #020b17 95%)',
            primary: '#2563eb',
            accent: '#38bdf8',
            bgOverlay: 'from-blue-950/40 via-slate-900 to-black',
            headerBg: 'bg-gradient-to-b from-blue-950 via-slate-900 to-black',
            headerBorder: 'border-blue-500/60',
            headerGlow: 'shadow-[0_0_30px_rgba(37,99,235,0.5)]',
            machineBorder: 'border-blue-500/50',
            machineGlow: 'shadow-[0_20px_50px_rgba(37,99,235,0.35)]',
            badgeBg: 'bg-blue-600 text-white font-black',
            pillBg: 'bg-blue-950/90 text-blue-300 border-blue-400/60',
            titleColor: 'text-blue-400',
            spinBtnClass: 'bg-gradient-to-b from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-black shadow-[0_5px_0_#1e1b4b]',
            avatarGlow: 'border-blue-500 shadow-[0_0_25px_rgba(37,99,235,0.6)]'
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
