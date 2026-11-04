# Spec Delta

## Purpose

Permite identificação simples de participantes sem senhas complexas, persistindo o saldo e pontuação entre sessões.

## ADDED Requirements

### Requirement: Autenticação simples sem atrito
The system SHALL permitir que o participante entre informando apenas seu identificador simples (como apelido ou matrícula/RA), sem exigência de senhas complexas ou validação burocrática.

#### Scenario: Login bem-sucedido com apelido
- **WHEN** o participante digita seu apelido no modal de identificação e confirma
- **THEN** a sessão do usuário é ativada e o saldo previamente salvo é restaurado

### Requirement: Persistência de saldo e progresso
The system SHALL salvar localmente e sincronizar o saldo e a maior pontuação acumulada associada ao identificador do usuário ativo.

#### Scenario: Manutenção de progresso após logout ou recarregamento
- **WHEN** o jogador encerra a sessão ou recarrega o navegador
- **THEN** ao logar novamente com o mesmo identificador, o saldo e histórico de pontos continuam preservados

### Requirement: Modo convidado ou alternância de conta
The system SHALL disponibilizar uma opção para trocar de participante ou deslogar facilmente para que outro aluno possa jogar no mesmo dispositivo.

#### Scenario: Desconexão do usuário
- **WHEN** o usuário clica na opção de sair da conta
- **THEN** a sessão é finalizada e o jogo solicita novo identificador antes de permitir apostas
