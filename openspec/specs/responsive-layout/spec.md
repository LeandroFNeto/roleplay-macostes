# Responsive Layout Specification

## Purpose

Define os requisitos de adaptação responsiva da interface do jogo entre dispositivos móveis e computadores desktop, garantindo usabilidade, visibilidade dos controles e ergonomia sem quebras visuais.

## Requirements

### Requirement: O jogo deve caber na área visível em dispositivos móveis
A interface do jogo SHALL se ajustar dinamicamente à altura e largura de telas móveis em modo retrato, garantindo que o cabeçalho do mascote, os rolos 3x3 e o botão de girar fiquem visíveis simultaneamente sem exigir rolagem vertical contínua para executar rodadas.

#### Scenario: Visualização em smartphone com tela compacta
- **WHEN** o jogador abre o jogo em um smartphone em orientação retrato
- **THEN** o gabinete da máquina de slot redimensiona proporcionalmente seu palco de mascote e rolos para exibir todo o jogo e o botão de giro na viewport

#### Scenario: Abertura em dispositivo móvel com altura reduzida
- **WHEN** a viewport possui altura restrita (inferior a 720px)
- **THEN** o palco do mascote e os espaçamentos internos compactam de forma proporcional para preservar a visibilidade do botão de girar

### Requirement: O jogo deve apresentar escala harmoniosa em telas de computador
Em telas com largura igual ou superior a 768px (tablets e computadores desktop), o jogo SHALL manter proporção centralizada e escala ampliada confortável, evitando distorções dos sprites do mascote ou desalinhamento do balcão e dos símbolos.

#### Scenario: Visualização em desktop ou notebook
- **WHEN** o usuário acessa o jogo em um monitor de computador ou notebook
- **THEN** o gabinete é exibido centralizado com largura proporcional confortável, bordas ornamentais nítidas e todos os controles legíveis

### Requirement: Suporte a áreas seguras e alvos de toque acessíveis
A interface SHALL respeitar as margens de segurança de dispositivos móveis com entalhes (notches) e barras de gestos (`safe-area-inset`), mantendo alvos táteis mínimos de 44x44 pixels para botões de aposta, modais e acionamento de giro.

#### Scenario: Interação por toque em aparelho móvel com barra de gestos
- **WHEN** o usuário toca nos botões de aposta ou no botão de girar em um aparelho móvel
- **THEN** os botões oferecem área de toque confortável sem sobreposição com a barra de navegação do sistema operacional

### Requirement: Estabilidade de layout durante redimensionamento e alternância de orientação
A interface SHALL recalcular imediatamente suas dimensões ao detectar rotação de tela ou redimensionamento de janela sem sobreposição de camadas, travamento visual ou perda de estado do jogo.

#### Scenario: Usuário redimensiona a janela do navegador no computador
- **WHEN** o usuário altera a largura ou altura da janela do navegador
- **THEN** os elementos da máquina se adaptam em tempo real mantendo a grade 3x3 centralizada e os elementos flutuantes alinhados
