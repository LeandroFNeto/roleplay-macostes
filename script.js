// ESTADO DO JOGO
let currentUser = null;
let currentSector = null;
let balance = 5000;
let multiplier = 1;
let maxMultiplier = 10;
let currentBet = 50; 
let isSpinning = false;
let activeMascotMultiplier = 1;
let gridState = new Array(9).fill('❓'); 

// ELEMENTOS DOM
const dom = {
    appBody: document.getElementById('app-body'),
    machineWrapper: document.getElementById('machine-wrapper'),
    mascotHeaderArea: document.getElementById('mascot-header-area'),
    grid: document.getElementById('slot-grid'),
    balance: document.getElementById('ui-saldo'),
    multiplier: document.getElementById('ui-multiplier'),
    multiLabel: document.getElementById('ui-multi-label'),
    multiBox: document.getElementById('multiplier-box'),
    bonusAlert: document.getElementById('bonus-alert'),
    bonusCount: document.getElementById('ui-bonus-count'),
    msgBox: document.getElementById('message-box'),
    spinBtn: document.getElementById('spin-btn'),
    betBtns: document.querySelectorAll('.bet-btn'),
    overlay: document.getElementById('bonus-overlay'),
    overlayTitle: document.getElementById('overlay-title'),
    overlayMultiText: document.getElementById('overlay-multi-text'),
    mascotImg: document.getElementById('sector-mascot-img'),
    mascotName: document.getElementById('sector-mascot-name'),
    sectorBadge: document.getElementById('sector-badge'),
    sectorPill: document.getElementById('sector-incentive-pill'),
    sectorDesc: document.getElementById('sector-incentive-desc'),
    mascotRelicWrap: document.getElementById('mascot-relic-wrap'),
    relicImg: document.getElementById('relic-img'),
    gridImpactBurst: document.getElementById('grid-impact-burst'),
    mascotQuickBar: document.getElementById('mascot-quick-bar'),
    username: document.getElementById('ui-username'),
    logoutBtn: document.getElementById('logout-btn'),
    loginModal: document.getElementById('login-modal'),
    loginForm: document.getElementById('login-form'),
    loginInput: document.getElementById('login-input'),
    rankingModal: document.getElementById('ranking-modal'),
    openRankingBtn: document.getElementById('open-ranking-btn'),
    closeRankingBtn: document.getElementById('close-ranking-btn'),
    rankingList: document.getElementById('ranking-list'),
    myRankIndicator: document.getElementById('ranking-my-rank'),
    qrcodesModal: document.getElementById('qrcodes-modal'),
    openQrcodesBtn: document.getElementById('open-qrcodes-btn'),
    closeQrcodesBtn: document.getElementById('close-qrcodes-btn'),
    qrcodesList: document.getElementById('qrcodes-list')
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// INICIALIZAÇÃO DE SESSÃO / LOGIN
function initAuth() {
    currentUser = AuthStore.getCurrentUser();
    if (!currentUser) {
        dom.loginModal.classList.remove('hidden');
    } else {
        dom.username.innerText = currentUser.nickname;
        balance = currentUser.balance || 5000;
        updateUI();
    }
}

dom.loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nickname = dom.loginInput.value;
    const user = AuthStore.login(nickname);
    if (user) {
        currentUser = user;
        dom.username.innerText = user.nickname;
        balance = user.balance || 5000;
        dom.loginModal.classList.add('hidden');
        updateUI();
        showMessage(`Bem-vindo, ${user.nickname}! Escolha sua aposta.`, 'bg-emerald-900', 'text-emerald-200');
    }
});

dom.logoutBtn.addEventListener('click', () => {
    AuthStore.logout();
    currentUser = null;
    dom.username.innerText = 'Convidado';
    dom.loginInput.value = '';
    dom.loginModal.classList.remove('hidden');
});

// APLICA O TEMA VISUAL EXCLUSIVO DA ATLÉTICA ESTILO FORTUNE TIGER ORIENTAL
function applySectorTheme(sector) {
    const t = sector.theme;
    if (!t) return;

    // Fundo da página exclusivo e diferenciado para cada curso (Javali preto, Abelha amarelo, Burro verde, Galo vermelho, Urso azul)
    dom.appBody.style.background = t.pageBg || `radial-gradient(circle at 50% 12%, ${t.primary}35 0%, #200407 45%, #080102 90%)`;

    // Moldura da Máquina de Slot estilo templo/Fortune Tiger
    dom.machineWrapper.className = `w-full max-w-md md:max-w-lg machine-container rounded-3xl overflow-hidden flex flex-col relative shadow-2xl ${t.machineGlow || ''}`;

    // Palco do Mascote com imagem do campus/setor de fundo ancorada de baixo para cima
    if (sector.bgImage) {
        dom.mascotHeaderArea.style.backgroundImage = `linear-gradient(180deg, rgba(12,2,4,0.1) 0%, rgba(20,4,7,0.15) 55%, rgba(12,2,4,0.65) 100%), url('${sector.bgImage}')`;
        dom.mascotHeaderArea.style.backgroundSize = sector.bgSize || 'cover';
        dom.mascotHeaderArea.style.backgroundPosition = sector.bgPosition || 'center bottom';
        dom.mascotHeaderArea.style.backgroundRepeat = 'no-repeat';
    } else {
        dom.mascotHeaderArea.style.backgroundImage = 'none';
        dom.mascotHeaderArea.style.background = t.stageBg || `radial-gradient(circle at 50% 25%, ${t.primary}35 0%, #2b0509 60%, #100102 95%)`;
    }

    // Identificação no balcão dourado e pílula de bônus
    dom.sectorBadge.className = 'stage-balcony-text font-black text-[10px] sm:text-[11px] uppercase truncate';
    updateBonusPillUI();

    // Botão de Girar Principal com acabamento jade/ouro oriental
    dom.spinBtn.className = `w-full spin-btn-ornamental font-black text-lg sm:text-2xl py-2 sm:py-3.5 rounded-xl sm:rounded-2xl active:translate-y-[3px] active:shadow-none transition-all flex items-center justify-center gap-2 shadow-lg`;

    // Imagem do Mascote Cortada na Cintura (Fortune Tiger Style)
    if (sector.image) {
        dom.mascotImg.innerHTML = `
            <img src="${sector.image}" alt="${sector.mascotName}" 
                class="mascot-waist-cut">
        `;
    } else {
        dom.mascotImg.innerHTML = `<span class="text-7xl sm:text-8xl pb-2 drop-shadow-2xl">${sector.icon}</span>`;
    }

    // Atualiza a relíquia e pré-carrega o frame de arremesso para transição instantânea
    if (dom.relicImg && sector.relicImage) {
        dom.relicImg.src = sector.relicImage;
        dom.relicImg.alt = sector.relicName || 'Relíquia Sagrada';
    }
    if (sector.throwImage) {
        const preloader = new Image();
        preloader.src = sector.throwImage;
    }
}

// SISTEMA DE ROTAÇÃO DE SUPER BÔNUS: EXATAMENTE 2 CURSOS COM MAIOR BÔNUS A CADA 30 MINUTOS
const BONUS_ROTATION_INTERVAL_MS = 30 * 60 * 1000;
const BOOSTED_BONUS_VALUE = 3.5;  // +250% Super Bônus para os 2 cursos em destaque
const STANDARD_BONUS_VALUE = 1.8; // +80% Bônus Padrão para os outros 3 cursos
let lastKnownCycleIndex = -1;

function getBoostedSectorsState() {
    const now = Date.now();
    const cycleIndex = Math.floor(now / BONUS_ROTATION_INTERVAL_MS);
    const msRemaining = (cycleIndex + 1) * BONUS_ROTATION_INTERVAL_MS - now;
    
    const sectorIds = Object.keys(MASCOTS_CATALOG);
    // Seleção determinística sincronizada pelo relógio para todos os jogadores
    const firstIdx = Math.abs((cycleIndex * 9301 + 49297) % 233280) % sectorIds.length;
    let secondIdx = Math.abs(((cycleIndex + 1) * 9301 + 49297) % 233280) % sectorIds.length;
    if (secondIdx === firstIdx) {
        secondIdx = (firstIdx + 1) % sectorIds.length;
    }
    
    const boostedIds = [sectorIds[firstIdx], sectorIds[secondIdx]];
    const min = Math.floor(msRemaining / 60000);
    const sec = Math.floor((msRemaining % 60000) / 1000);
    const timeFormatted = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    
    return {
        cycleIndex,
        boostedIds,
        msRemaining,
        timeFormatted
    };
}

function getSectorCurrentBonus(sector) {
    if (!sector) return STANDARD_BONUS_VALUE;
    const { boostedIds } = getBoostedSectorsState();
    return boostedIds.includes(sector.id) ? BOOSTED_BONUS_VALUE : STANDARD_BONUS_VALUE;
}

function updateBonusPillUI() {
    if (!currentSector || !dom.sectorPill) return;
    const { boostedIds, timeFormatted } = getBoostedSectorsState();
    const isBoosted = boostedIds.includes(currentSector.id);
    const bonus = getSectorCurrentBonus(currentSector);
    const bonusPercent = Math.round((bonus - 1) * 100);

    if (isBoosted) {
        dom.sectorPill.innerHTML = `🔥 +${bonusPercent}% <span class="opacity-90 text-[9px] ml-0.5 font-mono">⏱️${timeFormatted}</span>`;
        dom.sectorPill.className = `text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full shadow-md border border-amber-900/60 bg-gradient-to-r from-red-600 via-amber-600 to-yellow-500 text-white animate-pulse flex items-center justify-center whitespace-nowrap`;
    } else {
        dom.sectorPill.innerHTML = `+${bonusPercent}% <span class="opacity-80 text-[9px] ml-0.5 font-mono">⏱️${timeFormatted}</span>`;
        dom.sectorPill.className = `text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm border border-amber-900/40 bg-[#3a060a]/90 text-yellow-300 flex items-center justify-center whitespace-nowrap`;
    }
}

// BARRA SELETORA RÁPIDA NO TOPO (COM DESTAQUE VISUAL DOS 2 CURSOS COM MAIOR BÔNUS)
function renderMascotQuickBar() {
    dom.mascotQuickBar.innerHTML = '';
    const { boostedIds } = getBoostedSectorsState();

    Object.values(MASCOTS_CATALOG).forEach(sec => {
        const isActive = sec.id === currentSector.id;
        const isBoosted = boostedIds.includes(sec.id);
        const btn = document.createElement('button');
        
        let bgClass = 'bg-[#280508]/90 text-yellow-200/80 border-amber-900/60 hover:text-white hover:border-yellow-400/60';
        if (isActive) {
            bgClass = 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 text-slate-950 border-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.7)] scale-105 font-black';
        } else if (isBoosted) {
            bgClass = 'bg-red-950/90 text-yellow-300 border-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.35)]';
        }

        btn.className = `flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${bgClass}`;
        
        const thumb = sec.image 
            ? `<img src="${sec.image}" class="w-5 h-5 rounded-full object-cover border ${isBoosted ? 'border-yellow-400 ring-1 ring-red-500' : 'border-yellow-400/80'}">` 
            : `<span>${sec.icon}</span>`;

        const boostBadge = isBoosted 
            ? `<span class="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-md shadow animate-pulse">🔥 3.5x</span>` 
            : `<span class="opacity-60 text-[10px]">1.8x</span>`;

        btn.innerHTML = `${thumb} <span>${sec.mascotName.split(' ')[0]}</span> ${boostBadge}`;
        btn.addEventListener('click', () => switchSector(sec.id));
        dom.mascotQuickBar.appendChild(btn);
    });
}

// ALTERNA SETOR DINAMICAMENTE
function switchSector(sectorId) {
    if (isSpinning) return;
    currentSector = MASCOTS_CATALOG[sectorId] || currentSector;
    
    // Atualiza URL sem recarregar a página
    const newUrl = `${window.location.pathname}?setor=${currentSector.id}`;
    window.history.pushState({ path: newUrl }, '', newUrl);

    // Atualiza textos
    dom.sectorBadge.innerText = currentSector.athleticName || currentSector.sectorName;
    updateBonusPillUI();
    dom.sectorDesc.innerText = currentSector.incentiveText;
    dom.mascotName.innerText = currentSector.mascotName;
    
    // Aplica tema
    applySectorTheme(currentSector);
    renderMascotQuickBar();

    // Multiplicador do setor com rotação dos 2 maiores a cada 30min
    multiplier = getSectorCurrentBonus(currentSector);
    updateUI();
    initGrid();
    showMessage(`Atlética ativa: ${currentSector.athleticName}!`, 'bg-slate-800', currentSector.theme.titleColor);
}

// RESOLUÇÃO DE SETOR / MASCOTE VIA URL
function initSector() {
    const urlParams = new URLSearchParams(window.location.search);
    const param = urlParams.get('setor') || urlParams.get('mascote');
    currentSector = getSectorConfig(param);

    dom.sectorBadge.innerText = currentSector.athleticName || currentSector.sectorName;
    updateBonusPillUI();
    dom.sectorDesc.innerText = currentSector.incentiveText;
    dom.mascotName.innerText = currentSector.mascotName;
    
    applySectorTheme(currentSector);
    renderMascotQuickBar();

    multiplier = getSectorCurrentBonus(currentSector);
    updateUI();
}

// RENDERIZAÇÃO DE CADA CÉLULA (QUADRADO PERFEITO COM IMAGEM INTEIRA)
function renderCell(cell, symbol) {
    if (typeof symbol === 'string' && (symbol.endsWith('.png') || symbol.endsWith('.jpg') || symbol.includes('/'))) {
        cell.innerHTML = `<img src="${symbol}" alt="Símbolo" class="w-full h-full object-contain rounded-xl select-none pointer-events-none drop-shadow-md">`;
        cell.className = 'grid-cell aspect-square w-full rounded-xl flex items-center justify-center p-0 relative z-0 overflow-hidden';
    } else {
        cell.innerText = symbol;
        cell.className = 'grid-cell aspect-square w-full rounded-xl flex items-center justify-center text-4xl sm:text-5xl text-black relative z-0 bg-slate-100';
    }
}

// INICIALIZA A GRADE COM SÍMBOLOS DO SETOR (IMAGENS OU EMOJIS)
function initGrid() {
    dom.grid.innerHTML = '';
    const activeSymbols = (currentSector && currentSector.symbolImages && currentSector.symbolImages.length > 0)
        ? currentSector.symbolImages
        : (currentSector ? currentSector.symbols : ['🐗']);

    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.id = `cell-${i}`;
        gridState[i] = activeSymbols[i % activeSymbols.length];
        renderCell(cell, gridState[i]);
        dom.grid.appendChild(cell);
    }
}

// ATUALIZA UI DE APOSTA
function updateBetUI() {
    dom.betBtns.forEach(btn => {
        const betVal = parseInt(btn.dataset.bet);
        if (betVal === currentBet) {
            btn.classList.add('active-bet');
        } else {
            btn.classList.remove('active-bet');
        }
    });
}

dom.betBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (isSpinning) return;
        currentBet = parseInt(btn.dataset.bet);
        updateBetUI();
        showMessage(`Aposta definida: ${currentBet} pts.`);
    });
});

// ATUALIZA UI GERAL E PERSISTÊNCIA
function updateUI() {
    dom.balance.innerText = balance.toLocaleString();
    dom.multiplier.innerText = `${multiplier.toFixed(1)}x`;

    if (currentUser) {
        currentUser.balance = balance;
        if (balance > (currentUser.highScore || 0)) {
            currentUser.highScore = balance;
        }
        AuthStore.saveUser(currentUser);
    }
    
    if (multiplier > 1) {
        dom.multiBox.classList.add('border-yellow-400', 'shadow-[0_0_15px_rgba(250,204,21,0.4)]');
        dom.multiLabel.className = 'text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-yellow-300';
        dom.multiplier.className = 'text-sm sm:text-xl font-black text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]';
    } else {
        dom.multiBox.classList.remove('border-yellow-400', 'shadow-[0_0_15px_rgba(250,204,21,0.4)]');
        dom.multiLabel.className = 'text-[9px] sm:text-[10px] uppercase font-black tracking-wider text-yellow-300/80';
        dom.multiplier.className = 'text-sm sm:text-xl font-black text-yellow-400';
    }
}

function showMessage(text, bgClass = '', textClass = '') {
    dom.msgBox.innerText = text;
    dom.msgBox.className = `ornamental-message-box h-7 sm:h-9 flex items-center justify-center text-center text-[11px] sm:text-xs font-black rounded-lg transition-colors duration-300 px-2 leading-tight ${bgClass} ${textClass}`;
}

function lockControls(lock) {
    isSpinning = lock;
    if (lock) {
        dom.spinBtn.classList.add('opacity-50', 'pointer-events-none');
        dom.betBtns.forEach(b => b.classList.add('opacity-50', 'pointer-events-none'));
    } else {
        dom.spinBtn.classList.remove('opacity-50', 'pointer-events-none');
        dom.betBtns.forEach(b => b.classList.remove('opacity-50', 'pointer-events-none'));
        dom.spinBtn.innerText = "🎰 GIRAR";
    }
}

// ANIMAÇÃO DO MASCOTE LANÇANDO A RELÍQUIA SAGRADA COM IMPACTO DE LUZ NO CENTRO DO PAINEL 3X3
async function triggerMascotBuff() {
    const buffOptions = [2, 3, 5];
    activeMascotMultiplier = buffOptions[Math.floor(Math.random() * buffOptions.length)];
    
    // Atualiza a imagem da relíquia do mascote ativo
    if (dom.relicImg && currentSector.relicImage) {
        dom.relicImg.src = currentSector.relicImage;
        dom.relicImg.alt = currentSector.relicName || 'Relíquia Sagrada';
    }

    // Troca para sprite de arremesso durante o lançamento
    const mascotImgElem = dom.mascotImg.querySelector('img');
    if (mascotImgElem && currentSector.throwImage) {
        mascotImgElem.src = currentSector.throwImage;
    }

    // Movimento do mascote lançando o objeto
    dom.mascotImg.classList.add('mascot-throw');
    dom.mascotRelicWrap.classList.add('relic-launching');
    
    const actionText = currentSector.relicActionText || `O ${currentSector.mascotName} lançou o objeto sagrado!`;
    showMessage(`✨ ${actionText} Bônus ${activeMascotMultiplier}x!`, "bg-amber-900/90", "text-yellow-300");
    
    // Tempo exato até a relíquia atingir o meio do painel 3x3 na frente de tudo
    await delay(1250);
    
    // Efeito de explosão de luz divina e ondas de choque no centro da grade 3x3
    if (dom.gridImpactBurst) {
        dom.gridImpactBurst.classList.remove('active-burst');
        void dom.gridImpactBurst.offsetWidth; // Trigger reflow
        dom.gridImpactBurst.classList.add('active-burst');
    }
    dom.grid.classList.add('grid-impact-flash');

    // Destaca temporariamente a célula central (meio da grade) com brilho divino
    const centerCell = document.getElementById('cell-4');
    if (centerCell) {
        centerCell.classList.add('win-cell');
        setTimeout(() => centerCell.classList.remove('win-cell'), 1200);
    }
    
    await delay(650);
    dom.grid.classList.remove('grid-impact-flash');

    if (mascotImgElem && currentSector.image) {
        mascotImgElem.src = currentSector.image;
    }
    dom.mascotImg.classList.remove('mascot-throw');
    dom.mascotRelicWrap.classList.remove('relic-launching');
}

// ANIMAÇÃO DOS ROLOS COM SÍMBOLOS DO SETOR ATIVO (IMAGENS SEGMENTADAS OU EMOJIS)
async function animateSpin(hasBuff = false) {
    const cells = document.querySelectorAll('.grid-cell');
    const symbols = (currentSector && currentSector.symbolImages && currentSector.symbolImages.length > 0)
        ? currentSector.symbolImages
        : currentSector.symbols;

    cells.forEach(c => {
        c.classList.remove('win-cell');
        c.classList.add('spin-anim');
    });

    return new Promise(resolve => {
        let spinCount = 0;
        const spinInterval = setInterval(() => {
            for (let i = 0; i < 9; i++) {
                const randSym = symbols[Math.floor(Math.random() * symbols.length)];
                renderCell(cells[i], randSym);
            }
            spinCount++;
            
            if (spinCount > 15) {
                clearInterval(spinInterval);
                cells.forEach(c => c.classList.remove('spin-anim'));
                
                for (let i = 0; i < 9; i++) {
                    gridState[i] = symbols[Math.floor(Math.random() * symbols.length)];
                }

                if (hasBuff) {
                    const randomLine = Math.floor(Math.random() * 3);
                    const winningSymbol = symbols[0];
                    const startIdx = randomLine * 3;
                    gridState[startIdx] = winningSymbol;
                    gridState[startIdx + 1] = winningSymbol;
                    gridState[startIdx + 2] = winningSymbol;
                }

                for (let i = 0; i < 9; i++) {
                    renderCell(cells[i], gridState[i]);
                }
                
                resolve();
            }
        }, 50);
    });
}

function getWinningLines() {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8]
    ];
    
    const wins = [];
    lines.forEach(line => {
        const [a, b, c] = line;
        if (gridState[a] === gridState[b] && gridState[b] === gridState[c]) {
            wins.push(line);
        }
    });
    return wins;
}

function highlightWins(winningLines) {
    const cells = document.querySelectorAll('.grid-cell');
    winningLines.forEach(line => {
        line.forEach(index => cells[index].classList.add('win-cell'));
    });
}

// LÓGICA DO GIRO NORMAL
async function playNormalSpin() {
    if (isSpinning) return;
    if (!currentUser) {
        dom.loginModal.classList.remove('hidden');
        return;
    }
    if (balance < currentBet) {
        showMessage("Saldo insuficiente! Tente outra conta ou recarregue.", "bg-red-900", "text-red-200");
        return;
    }

    lockControls(true);
    balance -= currentBet;
    activeMascotMultiplier = 1;
    updateUI();
    
    const isMascotBuff = Math.random() < 0.20;
    
    if (isMascotBuff) {
        await triggerMascotBuff();
    } else {
        showMessage("Girando...", "bg-slate-700", "text-green-400");
    }

    await animateSpin(isMascotBuff);
    const winningLines = getWinningLines();

    if (winningLines.length > 0) {
        highlightWins(winningLines);
        const linesCount = winningLines.length;
        
        const sectorMult = getSectorCurrentBonus(currentSector);
        const cardMult = activeMascotMultiplier > 1 ? activeMascotMultiplier : 1;
        const finalSpinMultiplier = sectorMult * cardMult;

        const prize = Math.round(currentBet * linesCount * finalSpinMultiplier); 
        balance += prize;
        updateUI();

        RankingService.submitScore(currentUser.nickname, balance, currentSector.sectorName, currentSector.icon);
        
        let initialMulti = Math.round(finalSpinMultiplier);
        maxMultiplier = 15;
        let titleText = "BÔNUS WIN!";
        let multiText = `Multiplicador ${initialMulti}x!`;
        let titleColor = "from-green-400 via-yellow-400 to-green-500";
        
        if (linesCount >= 2) {
            initialMulti = Math.round(finalSpinMultiplier * 2);
            maxMultiplier = 25;
            titleText = "SUPER BÔNUS!";
            multiText = `Multiplicador ${initialMulti}x!`;
            titleColor = "from-yellow-400 via-orange-400 to-red-500";
        }

        showMessage(`+${prize} PTS! Bônus de ${currentSector.sectorName} ativado!`, "bg-green-900", "text-green-300");
        await delay(1500); 
        
        await runBonusSession(initialMulti, titleText, multiText, titleColor);
    } else {
        showMessage("Quase! O mascote está torcendo por você.", "bg-slate-800", "text-slate-300");
    }
    
    lockControls(false);
}

// SESSÃO DE BÔNUS
async function runBonusSession(initialMulti, titleText, multiText, titleColor) {
    dom.overlayTitle.innerText = titleText;
    dom.overlayTitle.className = `text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br ${titleColor} drop-shadow-[0_5px_10px_rgba(0,0,0,0.8)] mb-4`;
    dom.overlayMultiText.innerText = multiText;
    
    dom.overlay.classList.remove('hidden');
    await delay(2500);
    dom.overlay.classList.add('hidden');

    multiplier = initialMulti;
    updateUI();
    
    dom.bonusAlert.classList.remove('hidden');
    dom.spinBtn.innerText = "RODANDO AUTO...";
    dom.spinBtn.className = "w-full font-black text-2xl sm:text-3xl py-4 rounded-2xl transition-all flex items-center justify-center gap-2 mt-1 shadow-lg bg-gradient-to-r from-purple-600 to-indigo-700 text-white animate-pulse";

    for (let i = 10; i >= 1; i--) {
        dom.bonusCount.innerText = i;
        showMessage(`Rodada Bônus ${11 - i} de 10`, "bg-purple-900/50", "text-purple-300");
        
        await animateSpin();
        const winningLines = getWinningLines();
        
        if (winningLines.length > 0) {
            highlightWins(winningLines);
            if (multiplier < maxMultiplier) multiplier++;
            
            const prize = currentBet * multiplier * winningLines.length;
            balance += prize;
            updateUI();

            RankingService.submitScore(currentUser.nickname, balance, currentSector.sectorName, currentSector.icon);
            showMessage(`+${prize} PTS! Multiplicador subiu para ${multiplier}x!`, "bg-green-900/80", "text-green-300");
            await delay(1600);
        } else {
            await delay(600);
        }
    }

    dom.bonusAlert.classList.add('hidden');
    multiplier = getSectorCurrentBonus(currentSector);
    updateUI();
    
    applySectorTheme(currentSector);
    showMessage("Bônus encerrado! Pontos salvos no ranking.", "bg-blue-900", "text-blue-300");
    await delay(1500);
}

// RENDERIZAÇÃO E ATUALIZAÇÃO DO RANKING
function renderRanking(list) {
    dom.rankingList.innerHTML = '';
    const items = (list && list.length > 0) ? list : RankingService.getRanking(currentUser, currentSector);
    let myPosition = null;

    items.forEach((item, index) => {
        const isMe = currentUser && currentUser.nickname.toLowerCase() === item.nickname.toLowerCase();
        if (isMe) myPosition = index + 1;

        const row = document.createElement('div');
        row.className = `flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            isMe 
                ? 'bg-gradient-to-r from-amber-900/60 to-yellow-900/40 border-yellow-400 text-yellow-300 font-black shadow-[0_0_12px_rgba(250,204,21,0.35)]' 
                : 'bg-[#240407]/90 border-amber-900/50 text-yellow-100/90'
        }`;

        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        
        row.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="w-6 text-center font-black">${medal}</span>
                <span class="text-xl">${item.icon || '🎓'}</span>
                <div>
                    <div class="font-bold flex items-center gap-1 text-yellow-200">
                        ${item.nickname} ${isMe ? '<span class="text-[9px] bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 px-1 rounded font-black">VOCÊ</span>' : ''}
                    </div>
                    <div class="text-[10px] text-yellow-300/60">${item.sector || 'Geral'}</div>
                </div>
            </div>
            <div class="font-black text-right text-amber-300">
                ${item.score.toLocaleString()} <span class="text-[10px] text-yellow-300/60">pts</span>
            </div>
        `;
        dom.rankingList.appendChild(row);
    });

    dom.myRankIndicator.innerText = myPosition ? `Sua posição: #${myPosition}` : 'Sua posição: Fora do top';
}

// RENDERIZAÇÃO DO MODAL DE QR CODES
function renderQrCodesModal() {
    dom.qrcodesList.innerHTML = '';
    const currentBaseUrl = window.location.origin + window.location.pathname;

    Object.values(MASCOTS_CATALOG).forEach(sector => {
        const targetUrl = `${currentBaseUrl}?setor=${sector.id}`;
        const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(targetUrl)}`;
        const mascotBadge = sector.image 
            ? `<img src="${sector.image}" class="w-8 h-8 rounded-full object-cover border border-yellow-400">`
            : `<span class="text-xl">${sector.icon}</span>`;

        const card = document.createElement('div');
        card.className = 'p-3 bg-[#240407]/90 rounded-2xl border border-amber-900/60 flex flex-col sm:flex-row items-center gap-3 shadow-md';
        card.innerHTML = `
            <img src="${qrImgUrl}" alt="QR Code ${sector.sectorName}" class="w-24 h-24 rounded-lg bg-white p-1 shadow-md border-2 border-yellow-500/50">
            <div class="flex-1 text-center sm:text-left">
                <div class="flex items-center justify-center sm:justify-start gap-2">
                    ${mascotBadge}
                    <div>
                        <h4 class="font-black text-yellow-300 text-sm">${sector.athleticName || sector.sectorName}</h4>
                        <p class="text-[10px] text-yellow-200/60">${sector.sectorName}</p>
                    </div>
                </div>
                <p class="text-[11px] font-semibold my-1 ${sector.theme.titleColor}">${sector.mascotName} (${sector.baseBonus}x de incentivo)</p>
                <div class="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                    <button onclick="switchSector('${sector.id}'); dom.qrcodesModal.classList.add('hidden');" class="bg-gradient-to-r from-emerald-600 to-green-700 hover:brightness-110 text-white font-bold px-3 py-1 rounded-lg text-[11px] shadow">
                        Jogar nesta Atlética
                    </button>
                    <button onclick="navigator.clipboard.writeText('${targetUrl}'); alert('Link copiado!');" class="bg-[#3b080d] hover:bg-[#4d0c12] text-yellow-200 px-3 py-1 rounded-lg text-[11px] border border-amber-800">
                        Copiar Link
                    </button>
                </div>
            </div>
        `;
        dom.qrcodesList.appendChild(card);
    });
}

// CONTROLES DE MODAIS E TESTES
const testCardBtn = document.getElementById('test-card-btn');
if (testCardBtn) {
    testCardBtn.addEventListener('click', async () => {
        if (isSpinning) return;
        await triggerMascotBuff();
    });
}

dom.openRankingBtn.addEventListener('click', () => {
    renderRanking(RankingService.getRanking(currentUser, currentSector));
    RankingService.syncWithServer();
    dom.rankingModal.classList.remove('hidden');
});
dom.closeRankingBtn.addEventListener('click', () => dom.rankingModal.classList.add('hidden'));

dom.openQrcodesBtn.addEventListener('click', () => {
    renderQrCodesModal();
    dom.qrcodesModal.classList.remove('hidden');
});
dom.closeQrcodesBtn.addEventListener('click', () => dom.qrcodesModal.classList.add('hidden'));

// INICIALIZAÇÃO DA ROTAÇÃO AUTOMÁTICA DE 30 MINUTOS
function initBonusRotation() {
    const { cycleIndex } = getBoostedSectorsState();
    lastKnownCycleIndex = cycleIndex;

    setInterval(() => {
        const state = getBoostedSectorsState();
        updateBonusPillUI();

        // Quando virar a janela de 30 minutos
        if (state.cycleIndex !== lastKnownCycleIndex) {
            lastKnownCycleIndex = state.cycleIndex;
            const sec1 = MASCOTS_CATALOG[state.boostedIds[0]];
            const sec2 = MASCOTS_CATALOG[state.boostedIds[1]];
            
            renderMascotQuickBar();
            multiplier = getSectorCurrentBonus(currentSector);
            updateUI();

            const n1 = sec1 ? (sec1.athleticName || sec1.mascotName) : state.boostedIds[0];
            const n2 = sec2 ? (sec2.athleticName || sec2.mascotName) : state.boostedIds[1];
            showMessage(`⚡ ROTAÇÃO DE 30 MIN: ${n1} e ${n2} receberam o MAIOR BÔNUS (+250%)!`, "bg-amber-900/95", "text-yellow-300");
        }
    }, 1000);
}

// INICIALIZAÇÃO
initAuth();
initSector();
initGrid();
updateBetUI();
initBonusRotation();
dom.spinBtn.addEventListener('click', playNormalSpin);

// Sincronização periódica do Ranking (a cada 30 segundos)
RankingService.startPeriodicSync((updatedList) => {
    if (!dom.rankingModal.classList.contains('hidden')) {
        renderRanking(updatedList);
    }
});
