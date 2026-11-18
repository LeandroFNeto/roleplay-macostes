# Proposal

## Why

O jogo é totalmente silencioso: cliques, escolha de aposta, giro dos rolos e telas de WIN não têm retorno sonoro, o que deixa a experiência de cassino pouco viva. Os cinco arquivos de áudio já estão em `assets/sounds/` e falta só um módulo que os toque nos momentos certos.

## What Changes

- Novo módulo `sound-manager.js` (script clássico, global `SoundManager`, igual a `AuthStore` e `RankingService`) baseado em `new Audio()`, com uma função por efeito e uma função específica para parar o som da roleta.
- `index.html` carrega `sound-manager.js` antes de `script.js`.
- `script.js` chama o gerenciador nos gatilhos:
  - **clique-interface**: botões gerais (entrar e jogar, entrar em teste, sair, abrir/fechar menu lateral, informações, ranking, QR codes, trocar mascote/atlética e fechar painéis).
  - **escolha-valor**: clique nos botões de aposta (`.bet-btn`).
  - **momento-roleta**: começa no clique em GIRAR e para exatamente quando a animação dos rolos termina; o mesmo em cada rodada automática do bônus.
  - **bonus-win-padrao**: acerto de 1 linha (WIN BÔNUS) e acertos dentro das rodadas automáticas.
  - **bonus-win-2**: acerto de 2 ou mais linhas (SUPER WIN, MEGA WIN, SUPER MEGA WIN).
- `sw.js` passa a guardar os cinco áudios no cache offline (nova versão do cache).
- O harness de `test-game-flows.js` ganha um `SoundManager` falso e testes dos gatilhos.

## Capabilities

### New Capabilities
- `sound-effects`: efeitos sonoros do jogo: quais sons existem, quando tocam e param, e como o jogo se comporta se o navegador bloquear ou falhar ao tocar áudio.

### Modified Capabilities
<!-- Nenhuma: responsive-layout não muda. -->

## Impact

- Novo arquivo: `sound-manager.js`.
- Alterados: `index.html` (tag `<script>`), `script.js` (chamadas nos gatilhos), `sw.js` (lista de cache e `CACHE_NAME`), `test-game-flows.js` (stub e testes).
- Sem dependências novas; usa apenas a API nativa `HTMLAudioElement`.
- Fora do escopo: botão de mudo/volume e música de fundo.
