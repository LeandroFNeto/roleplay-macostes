# Design

## Context

Atualmente o jogo utiliza HTML5, CSS customizado e utilitários Tailwind CSS via CDN. Os componentes visuais da máquina de caça-níqueis possuem dimensões rígidas em pixels no `style.css` (como o palco do mascote `.mascot-stage` fixo em 250px e o container do mascote em 215px), além de um limitador `max-w-md` (448px) no `index.html`.

Em smartphones com alturas de tela comuns (600px a 750px), essa combinação empurra a seção de apostas e o botão `#spin-btn` para fora da tela visível, forçando o usuário a rolar a página para jogar. Já em monitores de computadores (desktop/notebook), o layout fica confinado a uma coluna estreita sem aproveitar a ergonomia e definição visual do monitor.

Ver `proposal.md` para motivação e `specs/responsive-layout/spec.md` para os requisitos contratuais.

## Goals / Non-Goals

**Goals:**
- Prover layout fluido com unidades modernas (`dvh`, `clamp()`, CSS variables e media queries) que garanta visualização completa da máquina em celulares (palco do mascote + grade 3x3 + botão GIRAR visíveis sem rolagem contínua).
- Escalar harmoniosamente em monitores desktop e notebooks (`@media (min-width: 768px)`), oferecendo presença visual refinada, dimensões expandidas proporcionais e estética equilibrada.
- Respeitar áreas seguras móveis (`safe-area-inset-*`) em dispositivos com notch e barras de navegação tátil.
- Preservar integralmente todas as animações CSS ornamentais existentes (`mascotThrowMotion`, `idleBreathe`, efeitos de relíquia e brilho).

**Non-Goals:**
- Reescrever o jogo para frameworks (React/Vue/Canvas/WebGL); o código permanece em HTML/CSS/JS nativo.
- Alterar mecânicas de jogo, regras de multiplicadores ou requisições de ranking/autenticação.
- Criar novos assets gráficos ou alterar as imagens de símbolos e mascotes.

## Decisions

### 1. Variáveis CSS para controle dimensional responsivo
- **Decisão**: Introduzir CSS Custom Properties no `:root` / `.machine-container` (`--stage-height`, `--mascot-waist-height`, `--relic-size`, `--slot-padding`) controladas por breakpoints de altura (`max-height`) e largura (`min-width`).
- **Motivo**: Permite que o palco superior, o balcão e os rolos encolham elegantemente em telas verticais curtas mantendo alinhamento pixel-perfect das animações e camadas.
- **Alternativas consideradas**: Ajustar dimensões via script JS no evento `resize` (descartado: provoca reflows constantes e delay perceptível).

### 2. Viewport Dinâmica (`100dvh`) e Contenção Ergonômica
- **Decisão**: Configurar o container principal do aplicativo com `min-height: 100dvh` e estrutura flexível compacta em telas móveis, garantindo que a barra de endereços do navegador (Safari iOS e Chrome Mobile) não oculte o botão `#spin-btn`.
- **Motivo**: Previne o bug clássico de `100vh` em navegadores mobile onde a barra de navegação sobrepõe a parte inferior da aplicação.
- **Alternativas consideradas**: Altura fixa em pixels com scroll interno forçado (descartado: sensação truncada de app mobile).

### 3. Presença Visual em Computadores / Telas Grandes
- **Decisão**: No breakpoint `@media (min-width: 768px)`, permitir que a máquina escale confortavelmente (até `max-w-[480px]` a `520px` com padding ampliado), com tipografia aprimorada e botões mais generosos.
- **Motivo**: Mantém a estética envolvente de gabinete de caça-níqueis (estilo Fortune Tiger) no centro da tela com proporções elegantes sem distorcer as imagens 3x3.
- **Alternativas consideradas**: Layout em 2 colunas no desktop (descartado: mudaria a identidade centralizada da máquina caça-níqueis e fragmentaria o visual consagrado).

## Risks / Trade-offs

- **[Risco]** Redução da altura do palco cortar a cabeça ou expressão do mascote.
  - **Mitigação**: Manter `object-fit: contain` e `object-position: bottom center`, reduzindo a altura do container sincronizadamente com a escala da imagem.
- **[Risco]** Dispositivos móveis extremamente pequenos (ex: iPhone SE com 667px de altura) ficarem apertados.
  - **Mitigação**: Regra `@media (max-height: 700px)` com redução dos espaçamentos verticais (`gap`, `padding` das fichas de aposta e placar) para acomodar a máquina inteira.
- **[Risco]** Modais (Ranking e QR Codes) estourarem a altura da tela no mobile.
  - **Mitigação**: Garantir `max-h-[85dvh]` com barra de rolagem estilizada e cabeçalho fixo nos modais.
