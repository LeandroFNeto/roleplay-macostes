# Spec Delta

## Purpose

Exibe o ranking global competitivo dos participantes e atualiza as pontuações periodicamente de forma automática.

## ADDED Requirements

### Requirement: Tabela de classificação global
The system SHALL exibir uma lista com os melhores jogadores classificados por maior pontuação acumulada ou maior saldo alcançado na competição.

#### Scenario: Visualização do ranking
- **WHEN** o usuário abre a visualização de ranking
- **THEN** o sistema exibe os melhores colocados com apelido, pontuação e centro acadêmico de destaque

### Requirement: Atualização periódica do ranking
The system SHALL atualizar os dados da tabela de classificação em intervalos regulares configuráveis sem exigir o recarregamento total da página.

#### Scenario: Atualização temporal do placar
- **WHEN** o temporizador periódico de atualização dispara
- **THEN** a lista de líderes é atualizada mantendo a posição em destaque do usuário logado

### Requirement: Registro de nova pontuação máxima
The system SHALL registrar e submeter a pontuação do participante para o ranking sempre que uma rodada resultar em ganho expressivo ou novo recorde.

#### Scenario: Atualização de pontuação recorde
- **WHEN** o participante finaliza uma rodada com ganho que supera seu recorde atual
- **THEN** a pontuação é atualizada no ranking e a nova colocação é refletida
