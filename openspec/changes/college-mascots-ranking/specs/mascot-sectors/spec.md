# Spec Delta

## Purpose

Gerencia o catálogo de centros acadêmicos e mascotes com parâmetros de bônus diferenciados e detecção por URL/QR Code.

## ADDED Requirements

### Requirement: Catálogo modular de centros e mascotes
The system SHALL disponibilizar uma lista extensível de centros acadêmicos e seus mascotes correspondentes (ex: Javali no Centro Tecnológico, Abelha na Enfermagem), cada um com nome, ícone e multiplicador base de incentivo.

#### Scenario: Carregamento do catálogo padrão
- **WHEN** a aplicação inicializa
- **THEN** o sistema carrega os setores acadêmicos disponíveis com seus respectivos mascotes e bônus configurados

### Requirement: Resolução de setor via URL ou QR Code
The system SHALL identificar parâmetros de setor na URL (como `?setor=tecnologico` ou `?mascote=javali`) para carregar dinamicamente o tema visual e a taxa de pagamento daquele local.

#### Scenario: Acesso via QR Code do setor
- **WHEN** o usuário escaneia um QR Code que abre a URL com o parâmetro `?setor=tecnologico`
- **THEN** o jogo seleciona automaticamente o mascote Javali e aplica o multiplicador especial do Centro Tecnológico

#### Scenario: Acesso sem parâmetro específico
- **WHEN** o usuário acessa a raiz sem parâmetros de setor
- **THEN** o sistema seleciona o primeiro setor padrão e permite navegação entre os centros

### Requirement: Multiplicadores calibrados por setor
The system SHALL aplicar uma taxa de recompensa ou bônus calibrada individualmente para cada centro acadêmico para incentivar a circulação dos participantes por todos os centros da faculdade.

#### Scenario: Pagamento diferenciado do setor
- **WHEN** o jogador obtém uma combinação vencedora no setor de maior incentivo
- **THEN** o prêmio calculado reflete o multiplicador exclusivo configurado para aquele mascote
