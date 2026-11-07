# Tasks

## 1. CSS Architecture e Dimensões Fluídas

- [x] 1.1 Declarar variáveis CSS customizadas (`--stage-height`, `--mascot-height`, `--slot-gap`) no `style.css` e vincular aos elementos estruturais da máquina
- [x] 1.2 Atualizar `.mascot-stage`, `.mascot-character-container` e `.mascot-waist-cut` para usarem altura fluida com `clamp()` e manter proporções do mascote
- [x] 1.3 Criar media queries para alturas reduzidas (`@media (max-height: 720px)` e `@media (max-height: 640px)`) compactando paddings, balcão e gaps verticais

## 2. Ergonomia Mobile e Áreas Seguras

- [x] 2.1 Configurar `#app-body` e container principal com `min-height: 100dvh` e preenchimentos para `env(safe-area-inset-bottom)` e `env(safe-area-inset-top)`
- [x] 2.2 Ajustar botões de aposta (`.bet-btn`), botão de giro (`#spin-btn`) e botões de cabeçalho para garantirem altura e toque mínimos de 44px em telas sensíveis ao toque
- [x] 2.3 Otimizar os modais (`#login-modal`, `#ranking-modal`, `#qrcodes-modal`) com `max-h-[85dvh]` e rolagem interna suave para não vazarem da viewport móvel

## 3. Otimização para Desktop e Telas Médias/Grandes

- [x] 3.1 Implementar breakpoint `@media (min-width: 768px)` permitindo expansão proporcional do gabinete (`max-w-[480px]`) e melhor espaçamento no desktop
- [x] 3.2 Calibrar o alinhamento das animações e camadas flutuantes (`#mascot-relic-wrap`, `#grid-impact-burst` e `#bonus-overlay`) para resoluções widescreen

## 4. Verificação Multiplataforma

- [x] 4.1 Validar layout em resoluções mobile (ex: 360x640, 390x844, 412x915) verificando que o botão GIRAR e os rolos 3x3 permanecem visíveis sem rolagem
- [x] 4.2 Validar layout em resoluções de desktop/notebook (1366x768, 1920x1080) confirmando estabilidade visual, centralização e nitidez
