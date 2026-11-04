# Design

## Context

O jogo de slot foi modularizado em `index.html`, `style.css` e `script.js`. A arquitetura atual roda integralmente no cliente sem dependência de frameworks pesados ou bundlers. Para apoiar o evento acadêmico com mascotes dos centros, o design deve manter a simplicidade técnica, permitindo carregamento contextual via URL (para leitura via QR Code) e persistência de dados.

## Goals / Non-Goals

**Goals:**
- Configuração modular e desacoplada dos centros acadêmicos e seus mascotes com multiplicadores de bônus exclusivos.
- Suporte a leitura de parâmetros de URL (`?setor=...`) para integração direta com QR Codes distribuídos nos prédios físicos.
- Sistema de login leve (apenas apelido/identificador) com persistência de saldo no `localStorage`.
- Painel de ranking global dos participantes com atualização automática em loop temporizado (polling/revalidação a cada 30 segundos).
- Modal utilitário com os links e QR Codes prontos de cada setor para impressão e uso pelos organizadores.

**Non-Goals:**
- Implementação de autenticação pesada com OAuth ou senhas criptografadas (o foco é acesso rápido e divertido pelos alunos).
- Sistema de microtransações financeiras ou dinheiro real.

## Decisions

### 1. Módulo de Setores e Mascotes (`mascots-config.js`)
- **Decisão**: Extrair a base de dados de mascotes para um catálogo declarativo, definindo: `id`, `name`, `faculty`, `icon`, `bonusMultiplier`, `themeColor` e `cardBuffs`.
- **Alternativa descartada**: Deixar hardcoded no `script.js` — limitaria a adição de novos centros pelos organizadores.

### 2. Autenticação Simples Baseada em Sessão Local (`auth-store.js`)
- **Decisão**: Utilizar `localStorage` com chave de partição por identificador do usuário para salvar saldo e recorde. Na inicialização, se não houver usuário logado, exibir modal de boas-vindas com campo único de identificação.
- **Alternativa descartada**: Exigir cadastro com e-mail/senha — geraria fricção e abandono no evento físico.

### 3. Ranking Global com Sincronização Periódica
- **Decisão**: Estruturar um serviço de ranking com interface unificada que salva pontuações recordes e simula/sincroniza uma lista global de competidores acadêmicos com temporizador periódica a cada 30 segundos (`setInterval`).
- **Alternativa descartada**: WebSockets com infraestrutura dedicada — complexidade desnecessária para a fase inicial do evento universitário.

### 4. Integração com QR Code dos Prédios
- **Decisão**: Leitura automática de `window.location.search` (`?setor=tecnologico` ou `?setor=enfermagem`) com fallback para o setor padrão. Incluir tela/modal com os links e pré-visualização de QR Code dos setores para os organizadores imprimirem.

## Risks / Trade-offs

- **[Risco]** Limpeza de cache ou navegação anônima perde dados locais do jogador.  
  → **Mitigação**: O identificador simples permite recarregar o saldo salvo caso o jogador utilize o mesmo navegador/dispositivo com `localStorage`.
- **[Risco]** Jogadores podem tentar alterar pontos diretamente pelo DevTools do navegador.  
  → **Mitigação**: Validação simples de pontuação por rodada contra limites máximos do multiplicador de cada setor.
