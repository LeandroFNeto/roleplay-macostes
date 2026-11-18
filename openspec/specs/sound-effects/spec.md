# Sound Effects Specification

## Purpose

Dá retorno sonoro às ações do jogador e aos resultados das rodadas, tocando o efeito certo em cada momento do jogo sem nunca travar a jogabilidade.

## Requirements

### Requirement: Som de clique em botões gerais da interface
The system SHALL tocar o som `clique-interface` quando o jogador tocar em um botão geral da interface: entrar e jogar, entrar no modo de teste, sair, abrir ou fechar o menu lateral, abrir informações, ranking, QR codes ou troca de mascote/atlética, e fechar esses painéis. Botões de aposta e o botão de girar MUST NOT tocar este som.

#### Scenario: Entrar e jogar
- **WHEN** o jogador toca em "Entrar e Jogar" no modal de login
- **THEN** o som `clique-interface` toca

#### Scenario: Abrir o menu lateral
- **WHEN** o jogador toca no botão do menu lateral
- **THEN** o som `clique-interface` toca

#### Scenario: Selecionar atlética
- **WHEN** o jogador abre a lista de troca de mascote ou escolhe outra atlética nela
- **THEN** o som `clique-interface` toca

### Requirement: Som ao escolher o valor da aposta
The system SHALL tocar o som `escolha-valor` quando o jogador selecionar ou alterar o valor da aposta, e MUST NOT tocá-lo enquanto um giro estiver em andamento (quando a escolha é ignorada).

#### Scenario: Troca de aposta
- **WHEN** o jogador toca em um botão de valor de aposta sem giro em andamento
- **THEN** o som `escolha-valor` toca e a aposta é definida

#### Scenario: Aposta bloqueada durante o giro
- **WHEN** o jogador toca em um botão de aposta durante um giro
- **THEN** nenhum som toca e a aposta não muda

### Requirement: Som da roleta durante o giro
The system SHALL começar a tocar `momento-roleta` assim que o giro for aceito e SHALL pará-lo, voltando ao início do áudio, no exato momento em que a animação dos rolos termina. O mesmo vale para cada rodada automática do bônus.

#### Scenario: Giro normal
- **WHEN** o jogador toca em GIRAR com saldo suficiente
- **THEN** `momento-roleta` começa a tocar e para quando os rolos mostram o resultado final

#### Scenario: Giro recusado
- **WHEN** o jogador toca em GIRAR sem sessão ativa ou sem saldo suficiente
- **THEN** `momento-roleta` não toca

#### Scenario: Rodada automática do bônus
- **WHEN** uma rodada automática da sessão de bônus gira os rolos
- **THEN** `momento-roleta` toca durante a animação e para quando ela termina

### Requirement: Som de ganho padrão
The system SHALL tocar `bonus-win-padrao` quando um giro normal acertar exatamente 1 linha (WIN BÔNUS) e a cada acerto dentro das rodadas automáticas do bônus.

#### Scenario: Acerto de uma linha
- **WHEN** um giro normal termina com 1 linha vencedora
- **THEN** `bonus-win-padrao` toca

#### Scenario: Acerto em rodada automática
- **WHEN** uma rodada automática do bônus termina com pelo menos 1 linha vencedora
- **THEN** `bonus-win-padrao` toca

### Requirement: Som de ganho maior
The system SHALL tocar `bonus-win-2` quando um giro normal acertar 2 ou mais linhas (SUPER WIN, MEGA WIN ou SUPER MEGA WIN), no lugar de `bonus-win-padrao`.

#### Scenario: Combo de linhas
- **WHEN** um giro normal termina com 2 ou mais linhas vencedoras
- **THEN** `bonus-win-2` toca e `bonus-win-padrao` não toca

#### Scenario: Giro sem acerto
- **WHEN** um giro termina sem linha vencedora
- **THEN** nenhum som de ganho toca

### Requirement: Falha de áudio não afeta o jogo
Se o navegador bloquear a reprodução, o arquivo não carregar ou a API de áudio não existir, the system SHALL seguir o jogo normalmente, sem erro visível e sem atrasar giros, prêmios ou telas.

#### Scenario: Reprodução bloqueada pelo navegador
- **WHEN** o navegador recusa tocar um som
- **THEN** a ação correspondente (clique, giro, prêmio) acontece normalmente

### Requirement: Sons disponíveis offline
Os cinco arquivos de som SHALL fazer parte do cache offline do app, para tocarem também sem conexão depois da primeira visita.

#### Scenario: Jogo offline
- **WHEN** o app instalado é aberto sem internet depois de o cache estar pronto
- **THEN** os sons tocam nos mesmos gatilhos que online
