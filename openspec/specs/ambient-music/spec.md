# ambient-music Specification

## Purpose
Toca uma trilha instrumental de fundo que acompanha o jogador do login ao fim das rodadas, em volume baixo, abaixando durante o giro da roleta para não competir com os efeitos sonoros e sem nunca travar a jogabilidade.

## Requirements

### Requirement: Música ambiente em loop contínuo
The system SHALL tocar a trilha instrumental `solta-carta-ambiente` como música de fundo, repetindo do início ao chegar ao fim, sem parar entre telas, apostas, giros e sessões de bônus. Uma vez iniciada, novas tentativas de início MUST NOT reiniciar a música nem criar uma segunda reprodução sobreposta.

#### Scenario: Fim da faixa
- **WHEN** a música ambiente chega ao fim do arquivo
- **THEN** ela recomeça do início sem intervenção do jogador

#### Scenario: Início repetido
- **WHEN** a música já está tocando e o jogador interage de novo com a página
- **THEN** a música continua do ponto em que estava, tocando uma única vez

### Requirement: Início na primeira interação do jogador
The system SHALL iniciar a música ambiente na primeira interação do jogador com a página — tocar ou clicar em qualquer ponto (incluindo os campos de telefone e PIN e o botão "Entrar e Jogar" do modal de login) ou pressionar uma tecla. The system MUST NOT tentar tocar a música antes de uma interação, para não violar a política de autoplay do navegador nem gerar erro de reprodução bloqueada no console.

#### Scenario: Toque no campo de telefone
- **WHEN** o jogador, com o modal de login aberto, toca no campo de telefone
- **THEN** a música ambiente começa a tocar em volume normal

#### Scenario: Jogador com sessão já salva
- **WHEN** o jogador abre o jogo já logado (sem modal de login) e toca em qualquer ponto da tela
- **THEN** a música ambiente começa a tocar em volume normal

#### Scenario: Página aberta sem interação
- **WHEN** a página carrega e o jogador ainda não interagiu
- **THEN** a música não toca e nenhum erro de autoplay aparece no console

### Requirement: Volume normal de fundo
Fora do giro da roleta — no login, nos menus, na escolha de aposta, nas telas de prêmio e nas esperas entre rodadas — the system SHALL tocar a música ambiente no volume normal: 40% do volume máximo, ou 10% em iPhone/iPad (ver "Volumes mínimos no iPhone").

#### Scenario: Navegação e escolha de aposta
- **WHEN** o jogador navega pelo menu ou escolhe o valor da aposta sem giro em andamento, fora do iPhone/iPad
- **THEN** a música ambiente toca a 40% do volume

### Requirement: Volume reduzido durante o giro da roleta
The system SHALL reduzir a música ambiente para o volume de giro — 6%, ou 2% em iPhone/iPad — no mesmo momento em que o som da roleta começa e SHALL restaurá-la para o volume normal no momento em que o som da roleta para, quando os rolos mostram o resultado. O mesmo vale para cada rodada automática do bônus. Um giro recusado (sem sessão ou sem saldo) MUST NOT alterar o volume da música.

#### Scenario: Giro normal fora do iPhone
- **WHEN** o jogador toca em GIRAR com saldo suficiente
- **THEN** a música cai para 6% enquanto a roleta gira e volta para 40% quando os rolos param

#### Scenario: Rodadas automáticas do bônus fora do iPhone
- **WHEN** uma rodada automática do bônus gira os rolos
- **THEN** a música fica em 6% durante essa rodada e volta para 40% ao fim dela, antes da próxima

#### Scenario: Giro recusado
- **WHEN** o jogador toca em GIRAR sem saldo suficiente
- **THEN** a música continua no volume normal

#### Scenario: Giro antes de a música começar
- **WHEN** a roleta gira e para antes de a música ambiente ter começado
- **THEN** quando a música começar ela toca no volume normal, não no volume de giro

### Requirement: Volumes mínimos no iPhone
Em iPhone e iPad (iOS/iPadOS), the system SHALL tocar a música ambiente a 10% do volume máximo como volume normal e a 2% durante o giro da roleta. Se o aparelho não permitir controlar o volume da música, the system MUST NOT tocá-la, em vez de tocá-la em volume máximo; os efeitos sonoros continuam normais.

#### Scenario: Giro no iPhone
- **WHEN** o jogador gira a roleta num iPhone com a música tocando
- **THEN** a música toca a 10% antes do giro, cai para 2% durante o giro e volta para 10% quando os rolos param

#### Scenario: iPhone sem controle de volume
- **WHEN** num iPhone não é possível controlar o volume da música
- **THEN** a música ambiente não toca e o jogo e os efeitos sonoros seguem normalmente

### Requirement: Pausa em segundo plano
Quando a aba ou o app instalado deixa de ficar visível (troca de aba, de aplicativo, tela bloqueada), the system SHALL pausar a música ambiente. Quando volta a ficar visível, the system SHALL retomá-la do ponto onde parou, no volume correspondente ao estado atual (normal ou de giro). Se a música ainda não tinha começado, voltar ao primeiro plano MUST NOT iniciá-la — ela continua dependendo da primeira interação.

#### Scenario: Jogador troca de aplicativo
- **WHEN** a música está tocando e o jogador sai para outro aplicativo ou bloqueia a tela
- **THEN** a música pausa

#### Scenario: Jogador volta ao jogo
- **WHEN** o jogador volta ao jogo depois de a música ter sido pausada por ir ao segundo plano
- **THEN** a música retoma do ponto onde parou, no volume normal

#### Scenario: Volta sem música iniciada
- **WHEN** o jogador abre o jogo, vai para outro aplicativo sem ter interagido e volta
- **THEN** a música continua sem tocar até a primeira interação

### Requirement: Falha da música não afeta o jogo
Se o navegador bloquear a reprodução, o arquivo da música não carregar, o app estiver sem conexão ou a API de áudio não existir, the system SHALL seguir o jogo normalmente — login, apostas, giros, prêmios e demais efeitos sonoros — sem erro visível e sem atraso.

#### Scenario: Arquivo indisponível offline
- **WHEN** o app instalado é aberto sem internet e a música não está disponível
- **THEN** o jogo e os efeitos sonoros funcionam normalmente, apenas sem música de fundo

#### Scenario: Reprodução recusada
- **WHEN** o navegador recusa tocar a música
- **THEN** nenhuma exceção interrompe a ação do jogador e os efeitos sonoros continuam tocando
