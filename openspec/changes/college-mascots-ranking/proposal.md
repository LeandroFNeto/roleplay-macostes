# Proposal

## Why

O jogo atual possui uma lista fixa de mascotes genéricos em código único e não incentiva a exploração física dos diferentes centros acadêmicos da universidade. Esta mudança transforma o jogo em uma plataforma modular gamificada com mascotes representativos de cada curso/centro (ex.: Javali no Centro Tecnológico, Abelha na Enfermagem), recompensas e multiplicadores dinâmicos por setor acessados via QR Code, autenticação simples de participantes e um ranking global atualizado periodicamente para fomentar o engajamento estudantil e a disputa saudável por prêmios.

## What Changes

- **Arquitetura Modular de Mascotes e Setores**: Separação dos dados de mascotes em catálogo configurável, associando cada mascote a seu curso/centro acadêmico, tema visual, ícone e taxas de premiação/multiplicador distintas para incentivar a visitação de todos os centros.
- **Suporte a QR Code e Rotas de Setor**: Detecção de setor/curso via parâmetros de URL (`?setor=...` ou `?mascote=...`) para integração direta com QR Codes físicos espalhados pela faculdade.
- **Sessão e Identificação Simples de Usuário**: Sistema de login simplificado (apelido/nome ou ID do aluno) com persistência de saldo e progresso entre sessões (login/logout) sem atrito de formulários pesados.
- **Ranking Global em Tempo Real**: Tabela de classificação competitiva exibindo os maiores pontuadores do jogo ("tigrinhos"), com atualização automática periódica em intervalos regulares.

## Capabilities

### New Capabilities
- `mascot-sectors`: Gerenciamento modular de centros universitários, mascotes associados, payouts calibrados por setor e detecção via QR Code/URL.
- `simple-auth`: Identificação e autenticação ágil de usuários com persistência de estado e saldo da sessão.
- `global-ranking`: Sistema de ranking global competitivo com atualização periódica e exibição dos melhores desempenhos.

### Modified Capabilities
<!-- Nenhuma especificação anterior existia no repositório -->

## Impact

- **Código Frontend**: Refatoração do script e layout de `index.html` e `script.js` para suportar modal de login, painel/drawer do ranking global e renderização modular de temas dos setores.
- **Estrutura de Dados**: Introdução de módulo de configuração de mascotes/setores e persistência (LocalStorage / API simples de sincronização).
- **Compatibilidade**: Totalmente retrocompatível com a mecânica original do slot 3x3 e rodadas bônus.
