# Design

## Context

- `sound-manager.js` é um IIFE que cria um `new Audio()` por efeito (`FILES`), toca com `play()` engolindo rejeições e, no primeiro `pointerdown`, faz o "desbloqueio" para iOS: toca cada efeito mudo e o pausa em seguida, a menos que o jogo o tenha pedido (`requested`).
- O som da roleta é `momento-roleta-2.wav` (chave `spin`), controlado por `SoundManager.startSpin()`/`stopSpin()`. Em `script.js`, `playNormalSpin()` chama `startSpin()` logo após aceitar o giro (antes da animação do mascote) e `animateSpin()` chama `startSpin()` (idempotente) e `stopSpin()` quando os rolos param — também em cada rodada automática do bônus.
- O modal de login (`#login-phone`, `#login-pin`, botão "Entrar e Jogar") só aparece para quem não tem sessão salva; quem volta logado cai direto no jogo.
- `solta-carta-ambiente.mp3` tem ~14 MB. O `sw.js` pré-cacheia os efeitos e trata outros arquivos do mesmo origin com "cache primeiro + `cache.put`".
- No iOS/Safari, `HTMLMediaElement.volume` é somente leitura (fica sempre em 1).

## Goals / Non-Goals

**Goals:**
- Volumes controláveis também no iPhone (onde usam o perfil mínimo de 10% / 2%).
- Ducking amarrado ao ciclo de vida do som da roleta, num único ponto, para não depender de cada chamador lembrar de restaurar.
- Nenhum aviso de autoplay no console antes da primeira interação.

**Non-Goals:**
- Botão de mudo/controle de volume pelo jogador.
- Música disponível offline.
- Trocar o arquivo do som da roleta para `momento-roleta.mp3`.

## Decisions

### 1. Elemento de áudio próprio, fora do `FILES` e do desbloqueio
A música é um `Audio` separado (`loop = true`, `preload = 'none'`), criado junto com os efeitos, mas não incluído no laço de `unlock()`.
- *Por quê:* `unlock()` toca e pausa cada elemento; a música seria pausada/reiniciada por ele. `preload = 'none'` evita baixar 14 MB antes de o jogador interagir.
- *Alternativa:* adicionar a `FILES` e marcar em `requested` — acopla a música à lógica de desbloqueio e força o download antecipado.

### 2. Volume por Web Audio `GainNode`, com fallback para `audio.volume`
Na primeira chamada de `iniciarMusicaAmbiente()` (sempre dentro de um gesto) cria-se um `AudioContext`, liga-se o elemento por `createMediaElementSource()` a um `GainNode` e daí ao destino. O volume passa a ser `gain.value`. Sem `AudioContext` (ou se a criação lançar), usa-se `audio.volume`.
- *Por quê:* é a forma confiável de controlar volume no iOS; o arquivo é do mesmo origin, então não há problema de CORS.
- *Por que criar só no gesto:* criar o `AudioContext` no carregamento gera o aviso "AudioContext was not allowed to start" no Chrome.
- *Alternativa:* só `audio.volume` — simples, mas no iPhone a música tocaria a 100% e o ducking não teria efeito.

### 3. API do `SoundManager`
- `iniciarMusicaAmbiente()`: idempotente. Cria o grafo de áudio se preciso, chama `resume()` se o contexto estiver suspenso, aplica o volume-alvo atual e chama `play()` só se o elemento estiver pausado. Rejeições/exceções são engolidas, como nos efeitos.
- `reduzirVolumeAmbiente()` / `restaurarVolumeAmbiente()`: gravam um estado `ducked` e aplicam o alvo do perfil ativo (volume de giro / normal). Funcionam mesmo antes de a música começar — só atualizam o alvo, que `iniciar` aplica depois.
- Volumes num perfil escolhido no carregamento: padrão `{ normal: 0.40, ducked: 0.06 }` e iOS `{ normal: 0.10, ducked: 0.02 }`, constantes no topo do módulo.
- Transição: com `GainNode`, `setTargetAtTime(alvo, agora, 0.08)` para evitar estalo; no fallback, troca imediata.

### 3a. iPhone/iPad: volumes mínimos e "sem controle de volume, sem música"
Detecção de iOS no carregamento: `/iphone|ipad|ipod/i` no `userAgent` ou iPadOS (`navigator.platform === 'MacIntel'` com `maxTouchPoints > 1`) — o mesmo critério do botão de instalação em `index.html`. No iOS usa-se o perfil `0.10 / 0.02`. Se no iOS o `GainNode` não puder ser criado (o fallback `audio.volume` não funciona lá), `iniciarMusicaAmbiente()` não toca a música.
- *Por quê:* alto-falante do iPhone perto do rosto soa mais alto; e tocar 14 MB de música a 100% sem poder abaixar é pior que não tocar.
- *Alternativa:* detectar empiricamente se `audio.volume` "pega" (escrever e ler de volta) — o Safari pode aceitar a escrita sem efeito, então a detecção por plataforma é mais previsível.

### 4. Ducking dentro de `startSpin()`/`stopSpin()`
`startSpin()` chama `reduzirVolumeAmbiente()` e `stopSpin()` chama `restaurarVolumeAmbiente()`. As funções também ficam públicas.
- *Por quê:* todo giro (normal, com buff do mascote, rodadas automáticas) já passa por esse par; o ducking fica sincronizado ao som da roleta sem mexer nos fluxos de `script.js` e sem risco de esquecer um `restaurar`. Giro recusado não chama `startSpin()`, então não abaixa a música.
- *Alternativa:* chamar `reduzir`/`restaurar` em `playNormalSpin`/`animateSpin` — mais pontos de chamada e duplicação do que já é o ciclo do som da roleta.

### 5. Gatilho de início em `script.js`
`script.js` registra em `document` listeners de `pointerdown` e `keydown` (fase de captura, permanentes) que chamam `SoundManager.iniciarMusicaAmbiente()`.
- *Por quê:* cobre os campos de telefone/PIN e o botão "Entrar e Jogar" (um toque neles é um `pointerdown`), cobre também quem já está logado e não vê o modal, e — por ser permanente e idempotente — retoma a música se o primeiro `play()` foi recusado ou se o iOS suspendeu o `AudioContext`. `pointerdown`/`keydown` são ativações de usuário válidas para autoplay; `focus` não é.
- *Alternativa:* listeners só nos inputs do login — não toca para quem já tem sessão.

### 5a. Pausa em segundo plano dentro do `SoundManager`
O `SoundManager` escuta `visibilitychange` em `document`. Ao ficar `hidden`, se a música está tocando, pausa e marca `pausedByVisibility`. Ao voltar a `visible`, se a marca está ligada, chama `resume()` do `AudioContext`, reaplica o volume-alvo (normal ou de giro) e `play()`. Sem a marca (música nunca iniciada ou já parada), não faz nada.
- *Por quê:* evita música tocando com o app minimizado (Android) e retoma sem exigir novo toque. A marca garante que voltar ao app não dispara autoplay antes da primeira interação.
- *Se o `play()` ao voltar for recusado:* o listener permanente de `pointerdown`/`keydown` (decisão 5) retoma no próximo toque.
- *Alternativa:* `pagehide`/`blur` — `visibilitychange` é o evento recomendado e cobre troca de aba, de app e bloqueio de tela.

### 6. Service worker: música passa direto pela rede
No `fetch`, requisições para `solta-carta-ambiente.mp3` retornam sem `respondWith` (rede direta); o arquivo não entra em `ASSETS_TO_CACHE`. Sobe `CACHE_NAME` para `atleticas-v22`.
- *Por quê:* pré-cachear 14 MB atrasaria a instalação e o indicador de "pronto offline"; e o ramo "cache primeiro" tentaria `cache.put` de respostas parciais (206) de mídia, que falham.

## Risks / Trade-offs

- [`createMediaElementSource` em navegadores antigos ou com quirks] → criação em `try/catch`; se falhar, cai no fallback `audio.volume` e a música toca mesmo assim — exceto no iOS, onde a música não toca.
- [Detecção de iOS por user agent pode errar (ex.: navegador que se identifica como desktop)] → no pior caso o aparelho usa o perfil padrão 40%/6%; nada quebra.
- [iOS suspende o `AudioContext` ao voltar do segundo plano] → listener permanente chama `resume()` no próximo toque.
- [Ducking sobe e desce 10 vezes nas rodadas automáticas] → aceito pelo requisito; a rampa curta do `GainNode` suaviza.
- [Sem música offline] → aceito; jogo e efeitos seguem normais (ver spec).
- [Tamanho do arquivo em dados móveis] → `preload = 'none'` e streaming; re-encodar o MP3 em taxa menor reduziria o custo (fora do escopo).

## Migration Plan

Deploy normal do PWA: a mudança em `sw.js` e o novo `CACHE_NAME` fazem os clientes atualizarem. Rollback: reverter o commit; não há dados persistidos envolvidos.
