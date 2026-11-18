# Tasks

## 1. Módulo de som

- [x] 1.1 Criar `sound-manager.js` com o global `SoundManager` (`playClick`, `playBetSelect`, `startSpin`, `stopSpin`, `playWin`, `playBigWin`): um `new Audio()` pré-carregado por arquivo de `assets/sounds/`, `momento-roleta` com `loop = true`, `startSpin` idempotente, `stopSpin` com `pause()` + `currentTime = 0`, todo `play()` protegido por `try/catch` e `.catch()`, e no-op quando `Audio` não existe; verificar com `node -e` carregando o arquivo num `vm` sem `Audio` (não lança) e com um `Audio` falso (cada função chama `play`/`pause` no arquivo certo)
- [x] 1.2 Adicionar o desbloqueio no primeiro `pointerdown` (`once`): tocar e pausar cada elemento com `muted = true` e restaurar `muted = false`; verificar no mesmo teste com `Audio` falso que, após o evento, os elementos estão pausados e com `muted === false`
- [x] 1.3 Carregar `<script src="sound-manager.js"></script>` em `index.html` antes de `script.js` e incluir `./sound-manager.js` e os cinco `./assets/sounds/*` em `ASSETS_TO_CACHE` do `sw.js`, trocando `CACHE_NAME` para `atleticas-v19`; verificar com `npm test` (`test-offline-cache.js` confirma que os arquivos existem)

## 2. Gatilhos no jogo

- [x] 2.1 Em `test-game-flows.js`, passar no contexto de `loadGame` um `SoundManager` falso que registra chamadas num array exposto no retorno; verificar que os testes atuais continuam passando com `npm test`
- [x] 2.2 No handler de `.bet-btn` em `script.js`, chamar `SoundManager.playBetSelect()` depois do `if (isSpinning) return;`; adicionar teste de que a aposta registra `playBetSelect` e que, com giro em andamento, não registra nada
- [x] 2.3 Em `playNormalSpin()`, chamar `SoundManager.startSpin()` logo após `lockControls(true)`; em `animateSpin()`, chamar `startSpin()` no início e `stopSpin()` imediatamente antes do `resolve()`; adicionar teste de que um giro aceito registra `startSpin` e termina com `stopSpin` antes de qualquer som de ganho, e que giro sem login/saldo não registra `startSpin`
- [x] 2.4 Em `playNormalSpin()`, após `highlightWins`, chamar `linesCount >= 2 ? SoundManager.playBigWin() : SoundManager.playWin()`; em `runBonusSession()`, chamar `SoundManager.playWin()` após `highlightWins` de cada rodada; adicionar testes com `gridState` forçado: 1 linha → `playWin`, 2+ linhas → `playBigWin` (sem `playWin` no giro normal), sem linha → nenhum som de ganho
- [x] 2.5 No listener `click` de `document` em `script.js`, chamar `SoundManager.playClick()` quando o alvo estiver em `button, .menu-item, a[data-game-link]` e não for `.bet-btn` nem `#spin-btn`; adicionar teste disparando o listener com um botão geral (registra `playClick`) e com `.bet-btn`/`#spin-btn` (não registra)

## 3. Verificação integrada

- [x] 3.1 Rodar `npm test` e confirmar que toda a suíte passa
- [x] 3.2 Abrir o jogo no navegador (servidor local) e conferir de ouvido: clique em "Entrar e Jogar", menu, atlética e modais; troca de aposta; roleta tocando do clique em GIRAR até os rolos pararem (com e sem buff do mascote); WIN BÔNUS com `bonus-win-padrao`; SUPER/MEGA WIN com `bonus-win-2`; rodadas automáticas com roleta e ganho padrão; console sem erros de áudio
