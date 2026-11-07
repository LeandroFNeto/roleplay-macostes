# Proposal

## Why

O jogo possui elementos com dimensões e alturas estáticas (como o palco de mascote fixo em 250px e largura limitada a 448px), o que provoca rolagem vertical indesejada e botões cortados em celulares menores, além de subaproveitamento de espaço e proporções reduzidas em telas de computador/desktop. Esta mudança torna a interface responsiva e ergonomicamente adaptável para computadores, tablets e smartphones, garantindo visibilidade total do tabuleiro e controles de giro sem rolagem excessiva.

## What Changes

- Adaptação fluida da máquina de jogo para telas móveis usando unidades de viewport dinâmicas (`100dvh` / `clamp()`), mantendo tabuleiro 3x3 e botão de girar visíveis sem necessidade de rolagem vertical na maioria dos celulares.
- Redimensionamento proporcional e responsivo do palco do mascote (`.mascot-stage`), relíquia e balcão em alturas de tela reduzidas (`max-height`).
- Layout aprimorado para computadores e notebooks (breakpoints `md` e `lg`): centralização elegante com escala ergonômica do gabinete e melhor aproveitamento visual sem distorcer sprites ou animações.
- Tratamento de áreas seguras (`safe-area-inset-*`) para celulares modernos com entalhe (notch) e barra de gestos inferior.
- Otimização para orientação móvel (suporte aprimorado ao modo retrato com compactação inteligente em telas compactas e melhor encaixe em paisagem).
- Garantia de alvos de toque mínimos (44px) nos seletores de aposta e botões de ação para navegação ágil no mobile.

## Capabilities

### New Capabilities
- `responsive-layout`: Requisitos e comportamento da interface do jogo adaptada dinamicamente entre celulares (retrato/paisagem compacto) e computadores/telas amplas.

### Modified Capabilities
<!-- Nenhuma capacidade existente no diretório principal openspec/specs -->

## Impact

- Afeta `index.html` (ajustes em classes Tailwind e estrutura de containers para flexibilidade).
- Afeta `style.css` (regras responsivas com media queries, alturas dinâmicas via `clamp()` e `dvh`, ajustes do palco do mascote e grade 3x3).
- Não quebra contratos do backend nem a lógica do motor de jogo (`script.js`, `ranking-service.js`, `auth-store.js`, `mascots-config.js`).
