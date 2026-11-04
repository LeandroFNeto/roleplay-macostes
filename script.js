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
    mascotCard: document.getElementById('mascot-card'),
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

// APLICA O TEMA VISUAL EXCLUSIVO DA ATLÉTICA
function applySectorTheme(sector) {
    const t = sector.theme;
    if (!t) return;

    // Fundo da página sutil com gradiente temático
    dom.appBody.style.background = `radial-gradient(circle at 50% 10%, ${t.primary}18 0%, #030712 70%)`;

    // Moldura da Máquina de Slot
    dom.machineWrapper.className = `w-full max-w-lg machine-container rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col gap-4 relative border-2 ${t.machineBorder} ${t.machineGlow}`;

    // Cabeçalho do Mascote
    dom.mascotHeaderArea.className = `mascot-area rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center relative shadow-xl overflow-hidden border-2 ${t.headerBorder} ${t.headerBg} ${t.headerGlow}`;

    // Badges superiores
    dom.sectorBadge.className = `text-[10px] sm:text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-md ${t.badgeBg}`;
    dom.sectorPill.className = `text-[10px] sm:text-xs font-extrabold px-2.5 py-1 rounded-lg shadow-md border ${t.pillBg}`;
    dom.mascotName.className = `text-xl sm:text-2xl font-black uppercase tracking-tight text-center relative z-10 mt-1 drop-shadow-md ${t.titleColor}`;

    // Botão de Girar Principal
    dom.spinBtn.className = `w-full font-black text-2xl sm:text-3xl py-4 rounded-2xl active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2 mt-1 shadow-lg ${t.spinBtnClass}`;

    // Imagem Hero Grande em Destaque no Topo
    if (sector.image) {
        dom.mascotImg.innerHTML = `
            <div class="relative group cursor-pointer">
                <img src="${sector.image}" alt="${sector.mascotName}" 
                    class="mascot-hero-img h-28 w-28 sm:h-32 sm:w-32 object-contain rounded-full border-4 bg-slate-950/80 p-1.5 ${t.avatarGlow}">
                <div class="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-700 text-xs px-1.5 py-0.5 rounded-full shadow">
                    ${sector.icon}
                </div>
            </div>
        `;
    } else {
        dom.mascotImg.innerHTML = `<span class="text-7xl sm:text-8xl drop-shadow-2xl">${sector.icon}</span>`;
    }
}

// BARRA SELETORA RÁPIDA NO TOPO
function renderMascotQuickBar() {
    dom.mascotQuickBar.innerHTML = '';
    Object.values(MASCOTS_CATALOG).forEach(sec => {
        const isActive = sec.id === currentSector.id;
        const btn = document.createElement('button');
        btn.className = `flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
            isActive 
                ? 'bg-slate-800 text-white border-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.5)] scale-105' 
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
        }`;
        
        const thumb = sec.image 
            ? `<img src="${sec.image}" class="w-5 h-5 rounded-full object-cover">` 
            : `<span>${sec.icon}</span>`;

        btn.innerHTML = `${thumb} <span>${sec.mascotName.split(' ')[0]}</span>`;
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
    dom.sectorPill.innerText = `+${Math.round((currentSector.baseBonus - 1) * 100)}% Bônus`;
    dom.sectorDesc.innerText = currentSector.incentiveText;
    dom.mascotName.innerText = currentSector.mascotName;
    
    // Aplica tema
    applySectorTheme(currentSector);
    renderMascotQuickBar();

    // Multiplicador base inicial do setor
    multiplier = currentSector.baseBonus;
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
    dom.sectorPill.innerText = `+${Math.round((currentSector.baseBonus - 1) * 100)}% Bônus`;
    dom.sectorDesc.innerText = currentSector.incentiveText;
    dom.mascotName.innerText = currentSector.mascotName;
    
    applySectorTheme(currentSector);
    renderMascotQuickBar();

    multiplier = currentSector.baseBonus;
    updateUI();
}

// INICIALIZA A GRADE COM SÍMBOLOS DO SETOR
function initGrid() {
    dom.grid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell h-16 sm:h-20 rounded-lg flex items-center justify-center text-4xl sm:text-5xl text-black relative z-0';
        cell.id = `cell-${i}`;
        cell.innerText = currentSector.icon;
        dom.grid.appendChild(cell);
    }
}

// ATUALIZA UI DE APOSTA
function updateBetUI() {
    dom.betBtns.forEach(btn => {
        const betVal = parseInt(btn.dataset.bet);
        if (betVal === currentBet) {
            btn.classList.add('bg-yellow-400', 'text-slate-950', 'border-yellow-600', 'shadow-inner');
            btn.classList.remove('bg-slate-800', 'text-white', 'border-slate-950');
        } else {
            btn.classList.remove('bg-yellow-400', 'text-slate-950', 'border-yellow-600', 'shadow-inner');
            btn.classList.add('bg-slate-800', 'text-white', 'border-slate-950');
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
        dom.multiBox.classList.add('border-yellow-500', 'bg-yellow-950/40');
        dom.multiLabel.classList.replace('text-slate-400', 'text-yellow-400');
        dom.multiplier.classList.replace('text-slate-300', 'text-yellow-400');
    } else {
        dom.multiBox.classList.remove('border-yellow-500', 'bg-yellow-950/40');
        dom.multiLabel.classList.replace('text-yellow-400', 'text-slate-400');
        dom.multiplier.classList.replace('text-yellow-400', 'text-slate-300');
    }
}

function showMessage(text, bgClass = 'bg-slate-800', textClass = 'text-white') {
    dom.msgBox.innerText = text;
    dom.msgBox.className = `h-12 sm:h-14 flex items-center justify-center text-center text-sm font-bold rounded-xl transition-colors duration-300 border border-slate-700 px-2 ${bgClass} ${textClass}`;
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

// ANIMAÇÃO DO MASCOTE JOGANDO A CARTA
async function triggerMascotBuff() {
    const buffOptions = [2, 3, 5];
    activeMascotMultiplier = buffOptions[Math.floor(Math.random() * buffOptions.length)];
    
    dom.mascotCard.innerText = `🃏 ${activeMascotMultiplier}x`;
    dom.mascotImg.classList.add('mascot-jump');
    dom.mascotCard.classList.add('card-dropping');
    
    showMessage(`O ${currentSector.mascotName} jogou a Carta! Bônus de ${activeMascotMultiplier}x!`, "bg-yellow-600", "text-white");
    
    await delay(1200);
    
    dom.mascotImg.classList.remove('mascot-jump');
    dom.mascotCard.classList.remove('card-dropping');
}

// ANIMAÇÃO DOS ROLOS COM SÍMBOLOS DO SETOR ATIVO
async function animateSpin(hasBuff = false) {
    const cells = document.querySelectorAll('.grid-cell');
    const symbols = currentSector.symbols;

    cells.forEach(c => {
        c.classList.remove('win-cell');
        c.classList.add('spin-anim');
    });

    return new Promise(resolve => {
        let spinCount = 0;
        const spinInterval = setInterval(() => {
            for (let i = 0; i < 9; i++) {
                cells[i].innerText = symbols[Math.floor(Math.random() * symbols.length)];
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
                    cells[i].innerText = gridState[i];
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
        
        const sectorMult = currentSector.baseBonus || 1;
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
    multiplier = currentSector.baseBonus;
    updateUI();
    
    applySectorTheme(currentSector);
    showMessage("Bônus encerrado! Pontos salvos no ranking.", "bg-blue-900", "text-blue-300");
    await delay(1500);
}

// RENDERIZAÇÃO E ATUALIZAÇÃO DO RANKING
function renderRanking(list) {
    dom.rankingList.innerHTML = '';
    let myPosition = null;

    list.forEach((item, index) => {
        const isMe = currentUser && currentUser.nickname.toLowerCase() === item.nickname.toLowerCase();
        if (isMe) myPosition = index + 1;

        const row = document.createElement('div');
        row.className = `flex items-center justify-between p-2.5 rounded-xl border transition-all ${
            isMe 
                ? 'bg-yellow-950/60 border-yellow-500 text-yellow-300 font-bold' 
                : 'bg-slate-800/80 border-slate-700 text-slate-200'
        }`;

        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        
        row.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="w-6 text-center font-black">${medal}</span>
                <span class="text-xl">${item.icon || '🎓'}</span>
                <div>
                    <div class="font-bold flex items-center gap-1">
                        ${item.nickname} ${isMe ? '<span class="text-[9px] bg-yellow-500 text-slate-950 px-1 rounded font-black">VOCÊ</span>' : ''}
                    </div>
                    <div class="text-[10px] text-slate-400">${item.sector || 'Geral'}</div>
                </div>
            </div>
            <div class="font-black text-right text-green-400">
                ${item.score.toLocaleString()} <span class="text-[10px] text-slate-400">pts</span>
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
        card.className = 'p-3 bg-slate-800 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-center gap-3';
        card.innerHTML = `
            <img src="${qrImgUrl}" alt="QR Code ${sector.sectorName}" class="w-24 h-24 rounded-lg bg-white p-1 shadow-md">
            <div class="flex-1 text-center sm:text-left">
                <div class="flex items-center justify-center sm:justify-start gap-2">
                    ${mascotBadge}
                    <div>
                        <h4 class="font-black text-white text-sm">${sector.athleticName || sector.sectorName}</h4>
                        <p class="text-[10px] text-slate-400">${sector.sectorName}</p>
                    </div>
                </div>
                <p class="text-[11px] font-semibold my-1 ${sector.theme.titleColor}">${sector.mascotName} (${sector.baseBonus}x de incentivo)</p>
                <div class="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                    <button onclick="switchSector('${sector.id}'); dom.qrcodesModal.classList.add('hidden');" class="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg text-[11px]">
                        Jogar nesta Atlética
                    </button>
                    <button onclick="navigator.clipboard.writeText('${targetUrl}'); alert('Link copiado!');" class="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1 rounded-lg text-[11px]">
                        Copiar Link
                    </button>
                </div>
            </div>
        `;
        dom.qrcodesList.appendChild(card);
    });
}

// CONTROLES DE MODAIS
dom.openRankingBtn.addEventListener('click', () => {
    renderRanking(RankingService.getRanking());
    dom.rankingModal.classList.remove('hidden');
});
dom.closeRankingBtn.addEventListener('click', () => dom.rankingModal.classList.add('hidden'));

dom.openQrcodesBtn.addEventListener('click', () => {
    renderQrCodesModal();
    dom.qrcodesModal.classList.remove('hidden');
});
dom.closeQrcodesBtn.addEventListener('click', () => dom.qrcodesModal.classList.add('hidden'));

// INICIALIZAÇÃO
initAuth();
initSector();
initGrid();
updateBetUI();
dom.spinBtn.addEventListener('click', playNormalSpin);

// Sincronização periódica do Ranking (a cada 30 segundos)
RankingService.startPeriodicSync((updatedList) => {
    if (!dom.rankingModal.classList.contains('hidden')) {
        renderRanking(updatedList);
    }
});
