# Tasks

## 1. Música ambiente no SoundManager

- [x] 1.1 Em `sound-manager.js`, criar o elemento `Audio` de `assets/sounds/solta-carta-ambiente.mp3` com `loop = true` e `preload = 'none'`, fora de `FILES` e do laço de `unlock()`, e o perfil padrão de volumes (`0.40` normal / `0.06` no giro); verificar com teste em `test-sound-manager.js` que o elemento é criado em loop, que nada toca ao carregar e que o primeiro `pointerdown` (desbloqueio) não toca nem pausa a música
- [x] 1.2 Implementar `iniciarMusicaAmbiente()` idempotente: cria `AudioContext` + `createMediaElementSource` + `GainNode` sob demanda (com `try/catch` e fallback para `audio.volume`), chama `resume()` se suspenso, aplica o volume-alvo e só chama `play()` se pausado, engolindo rejeições; verificar com testes: sem `AudioContext` o volume fica 0.40 via `audio.volume`; com `AudioContext` falso o ganho fica 0.40; duas chamadas seguidas resultam em um único `play()`; `play()` rejeitado não lança
- [x] 1.3 Implementar `reduzirVolumeAmbiente()` e `restaurarVolumeAmbiente()` (estado `ducked`, rampa `setTargetAtTime` no `GainNode`, troca direta no fallback) e chamá-las dentro de `startSpin()` e `stopSpin()`; verificar com testes: `startSpin()` → 0.06, `stopSpin()` → 0.40, e reduzir/restaurar antes de iniciar faz a música começar no alvo correto
- [x] 1.4 Adicionar o perfil de volumes do iOS (detecção por `userAgent`/iPadOS no carregamento; `0.10` normal e `0.02` no giro) e a regra de não tocar no iOS quando o `GainNode` não puder ser criado; verificar com testes: com `userAgent` de iPhone e `AudioContext` falso o ganho vai a 0.10 e a 0.02 no `startSpin()`; com `userAgent` de iPhone e sem `AudioContext` nenhum `play()` é chamado
- [x] 1.5 Pausar/retomar por `visibilitychange` (marca `pausedByVisibility`, `resume()` do contexto e volume-alvo ao voltar); verificar com testes: tocando + `hidden` → pausa; `visible` → um novo `play()` no volume correto (inclusive de giro se `startSpin()` estiver ativo); `hidden`/`visible` antes de iniciar não chama `play()`
- [x] 1.6 Ajustar os testes existentes de `test-sound-manager.js` (contagem de elementos criados, lista de elementos em loop, no-op sem API de áudio incluindo as três novas funções) e verificar que `node --test test-sound-manager.js` passa

## 2. Gatilho na interface

- [x] 2.1 Em `script.js`, registrar em `document` listeners de `pointerdown` e `keydown` (captura, permanentes) que chamam `SoundManager.iniciarMusicaAmbiente()`; verificar com teste em `test-game-flows.js` (adicionando `iniciarMusicaAmbiente` ao stub do `SoundManager`) que um `pointerdown` e um `keydown` disparam a chamada e que os demais testes de som seguem com as mesmas sequências
- [x] 2.2 Verificar que `node --test test-game-flows.js` passa

## 3. Service worker

- [x] 3.1 Em `sw.js`, fazer as requisições de `solta-carta-ambiente.mp3` irem direto à rede (sem `respondWith`/`cache.put`), não incluir o arquivo em `ASSETS_TO_CACHE` e subir `CACHE_NAME` para `atleticas-v22`; verificar que `node --test test-offline-cache.js` passa (ajustando-o se ele fixar a versão do cache)

## 4. Integração

- [x] 4.1 Rodar `npm test` e verificar que toda a suíte passa
- [x] 4.2 Abrir o jogo no navegador e verificar manualmente: nenhum aviso de autoplay no console antes de interagir; música começa ao tocar no campo de telefone (e, logado, ao tocar em qualquer ponto); volume baixo durante o giro e nas rodadas automáticas do bônus, voltando ao fim de cada giro; giro sem saldo não altera a música; ao trocar de aba/app a música pausa e retoma ao voltar; num iPhone (ou no modo de dispositivo iOS do DevTools com Web Audio) a música fica bem mais baixa que no desktop
