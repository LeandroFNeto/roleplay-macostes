# Design

## Context

- O front-end não usa ES modules: `index.html` carrega `app-mode.js`, `mascots-config.js`, `auth-store.js` e `ranking-service.js` como scripts clássicos que expõem globais, e por último `script.js` (com `defer`). `test-game-flows.js` executa `script.js` dentro de um `vm.createContext` que só tem os globais que o harness fornece.
- Fluxo do giro em `script.js`: `playNormalSpin()` valida login/saldo → `lockControls(true)` → `triggerMascotBuff()` (~1,9 s, em 20% dos giros) → `animateSpin()` (intervalo de 50 ms, 16 ticks) → `getWinningLines()` → se ganhou, `runBonusSession()` com 10 chamadas de `animateSpin()`.
- O título da tela de WIN vem de `linesCount`: 1 = WIN BÔNUS, 2 = SUPER WIN, 3 = MEGA WIN, 4+ = SUPER MEGA WIN.
- `sw.js` faz pré-cache de uma lista fixa de assets; tudo do mesmo origin que não é js/css/json é servido cache-first.

## Goals / Non-Goals

**Goals:**
- Um único ponto (`SoundManager`) para tocar e parar sons, sem que nenhum erro de áudio derrube o fluxo do jogo.
- Gatilhos ligados no próprio `script.js`, perto do código que já representa cada evento.

**Non-Goals:**
- Controle de mudo/volume na interface, música de fundo, Web Audio API.

## Decisions

### `sound-manager.js` como script clássico com global `SoundManager`
Segue o padrão de `AuthStore`/`RankingService` e funciona no harness `vm` sem bundler. É carregado em `index.html` antes de `script.js`; por isso não há `import` em `script.js`, as chamadas usam o global direto.
*Alternativa:* `export`/`import` com `type="module"`. Rejeitada: exigiria converter `script.js` e todos os testes que o executam via `vm`.

API pública:
```js
SoundManager.playClick()      // clique-interface.wav
SoundManager.playBetSelect()  // escolha-valor.wav
SoundManager.startSpin()      // momento-roleta.mp3 (loop)
SoundManager.stopSpin()       // pausa e volta para 0
SoundManager.playWin()        // bonus-win-padrao.wav
SoundManager.playBigWin()     // bonus-win-2.wav
```

### Um `new Audio()` por som, pré-carregado e reaproveitado
Cada arquivo vira um `HTMLAudioElement` com `preload = 'auto'`, criado quando o módulo carrega. Efeitos curtos fazem `currentTime = 0` antes de `play()`, para cliques rápidos reiniciarem o som em vez de esperar o fim. Toda chamada passa por um `play()` interno que envolve `audio.play()` em `try/catch` e faz `.catch(() => {})` na promise, e o módulo vira no-op se `typeof Audio === 'undefined'`. Isso atende o requisito "Falha de áudio não afeta o jogo".
*Alternativa:* `cloneNode()` a cada clique para sons sobrepostos. Desnecessário para efeitos curtos e cria elementos a cada toque.

### Roleta em loop, controlada por `startSpin`/`stopSpin`
`momento-roleta.mp3` usa `loop = true`, então cobre qualquer duração (com ou sem buff do mascote). `startSpin()` é idempotente: se já está tocando, não reinicia. `stopSpin()` faz `pause()` + `currentTime = 0`.
- `playNormalSpin()` chama `startSpin()` logo depois de `lockControls(true)` (giro aceito), antes do buff do mascote, então o som começa no clique.
- `animateSpin()` chama `startSpin()` no início (cobre as rodadas automáticas) e `stopSpin()` imediatamente antes do `resolve()`, no mesmo tick em que os símbolos finais são renderizados. Assim o fim do som fica amarrado ao fim real da animação, não a um timer separado.

### Cliques gerais por delegação, não um listener por botão
Um listener `click` em `document` (em `script.js`, junto do bloqueio de links durante o giro, linha ~258) toca `playClick()` quando `event.target.closest('button, .menu-item, a[data-game-link]')` existe e o elemento não é `.bet-btn` nem `#spin-btn`. Cobre "Entrar e Jogar" (submit do form), "Entrar em teste", sair, menu, informações, ranking, QR codes, mascote/atlética e botões de fechar, inclusive os criados depois.
*Alternativa:* chamar `playClick()` em cada `addEventListener` existente. Mais verboso e fácil de esquecer em botões novos.

### Aposta e ganhos no ponto do evento
- Handler de `.bet-btn`: `SoundManager.playBetSelect()` depois do `if (isSpinning) return;`.
- `playNormalSpin()`, após `highlightWins(winningLines)`: `linesCount >= 2 ? playBigWin() : playWin()`.
- `runBonusSession()`, após `highlightWins(winningLines)` de cada rodada: `playWin()`.

### Desbloqueio de áudio no primeiro toque (iOS/Safari)
Os sons de ganho tocam depois de vários `await`, fora do gesto do usuário, e o iOS pode recusar `play()` nesses casos. No primeiro `pointerdown` em `document` (listener `once`), o módulo toca e pausa cada elemento com `muted = true` e depois restaura `muted = false`, o que libera os elementos para tocar depois.

### Cache offline
Adicionar os cinco caminhos `./assets/sounds/...` e `./sound-manager.js` a `ASSETS_TO_CACHE` e trocar `CACHE_NAME` para `atleticas-v19`, para clientes já instalados baixarem os sons. `test-offline-cache.js` já verifica que cada asset listado existe no disco.

### Testes
O harness `loadGame` em `test-game-flows.js` passa um `SoundManager` falso que registra as chamadas num array. Novos testes cobrem: aposta toca `playBetSelect`; aposta durante giro não toca; giro chama `startSpin` e termina com `stopSpin`; 1 linha → `playWin`; 2+ linhas → `playBigWin`; clique geral → `playClick`.

## Risks / Trade-offs

- [Safari pode pedir `Range` para mídia e a resposta cache-first não é parcial] → arquivos pequenos e falha silenciosa pelo `catch`; se aparecer problema no iOS offline, tratar `Range` no `sw.js` em ajuste separado.
- [Som da roleta mais curto ou mais longo que a animação] → o loop + `stopSpin()` no fim da animação resolvem os dois casos.
- [Clique em link de mascote navega e corta o som] → aceitável; a navegação é o efeito esperado.
- [Sem botão de mudo] → fora do escopo; o `SoundManager` centraliza tudo, então um `setMuted()` futuro é simples.

## Migration Plan

Deploy normal. A troca de `CACHE_NAME` faz o service worker instalar a nova lista com os sons. Rollback: reverter o commit; o cache antigo é limpo na ativação da versão anterior.
