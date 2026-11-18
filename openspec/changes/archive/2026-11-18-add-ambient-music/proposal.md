# Proposal

## Why

O jogo só tem efeitos sonoros pontuais; entre um giro e outro fica em silêncio, o que deixa a experiência de cassino "vazia". O arquivo `assets/sounds/solta-carta-ambiente.mp3` já foi adicionado ao projeto e precisa ser ligado ao jogo como trilha instrumental de fundo, sem atrapalhar o som da roleta.

## What Changes

- Novo som de fundo `solta-carta-ambiente.mp3` em loop contínuo, gerenciado pelo `sound-manager.js` (o arquivo do projeto é `sound-manager.js`, não `soundManager.js`).
- Novas funções públicas no `SoundManager`: `iniciarMusicaAmbiente()`, `reduzirVolumeAmbiente()` e `restaurarVolumeAmbiente()`.
- A música começa na primeira interação do jogador com a página (toque/clique ou tecla — inclui os campos de telefone/PIN e o botão "Entrar e Jogar" do modal de login), respeitando a política de autoplay e sem erro no console.
- Volume normal de fundo: 40% (fora do iPhone). Durante o giro da roleta (junto com o som da roleta), a música cai para 6% ("audio ducking") e volta a 40% quando os rolos param — inclusive em cada rodada automática do bônus.
- No iPhone/iPad os volumes são os mínimos: 10% normal e 2% no giro; se o aparelho não permitir controlar o volume, a música não toca (nunca a 100%).
- A música pausa quando o app/aba vai para segundo plano e retoma do mesmo ponto ao voltar.
- O som da roleta continua sendo `momento-roleta-2.wav` (o arquivo que o jogo usa hoje); o ducking acompanha `startSpin()`/`stopSpin()`, qualquer que seja o arquivo.
- A música não entra no pré-cache offline (arquivo de ~14 MB); sem rede ela apenas não toca.

## Capabilities

### New Capabilities
- `ambient-music`: trilha instrumental de fundo — quando começa, em que volume toca (inclusive no iPhone), como abaixa durante o giro da roleta, pausa em segundo plano e como se comporta quando o áudio falha ou o app está offline.

### Modified Capabilities
<!-- Nenhuma: os requisitos de `sound-effects` (gatilhos e arquivos dos efeitos) não mudam. -->

## Impact

- `sound-manager.js`: novo elemento de áudio em loop, controle de volume (ganho) com perfil de volumes para iOS, pausa/retomada por visibilidade, integração com o desbloqueio de áudio do primeiro toque e com `startSpin`/`stopSpin`.
- `script.js`: chamada de `iniciarMusicaAmbiente()` na primeira interação (login/entrada).
- `sw.js`: deixar a requisição da música passar direto pela rede (sem `cache.put` de respostas parciais 206) e subir a versão do cache.
- `test-sound-manager.js` e `test-game-flows.js`: novos testes de início, loop, volumes e ducking; ajuste da contagem de elementos de áudio criados.
- Sem novas dependências.
