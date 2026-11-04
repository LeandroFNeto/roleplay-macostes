# Tasks

## 1. Módulo de Catálogo e Setores Acadêmicos

- [x] 1.1 Criar `mascots-config.js` com o catálogo de cursos e centros acadêmicos (Javali/Tecnológico, Abelha/Enfermagem, Leão/Medicina, Lobo/Computação, Urso/Odontologia, etc.), incluindo multiplicadores especiais de incentivo por setor, e verificar se os dados são exportados corretamente.
- [x] 1.2 Implementar leitor de parâmetros de URL (`?setor=...` e `?mascote=...`) para selecionar dinamicamente o setor ao carregar a página e verificar se o mascote e multiplicador corretos são refletidos no jogo.
- [x] 1.3 Adicionar componente/modal de visualização de QR Codes e links diretos para cada setor acadêmico para impressão e teste pela organização.

## 2. Autenticação Simples e Persistência de Sessão

- [x] 2.1 Criar modal de identificação inicial solicitando apelido/nome ou RA para jogadores sem sessão ativa e verificar se o nome do jogador é exibido no cabeçalho.
- [x] 2.2 Implementar persistência de saldo, recorde e histórico do participante via `localStorage` e verificar a recuperação correta dos dados após recarregamento da página.
- [x] 2.3 Adicionar botão de troca de conta/logout simples na interface e verificar se a sessão atual é deslogada e o formulário de login reaparece.

## 3. Sistema de Ranking Global e Atualização Periódica

- [x] 3.1 Implementar estrutura de dados e serviço do Ranking Global armazenando os melhores pontuadores com nome, pontuação máxima e setor preferido.
- [x] 3.2 Criar painel visual/drawer de Ranking na interface com ordenação decrescente e destaque visual para o usuário atual.
- [x] 3.3 Configurar temporizador periódico (intervalo de 30 segundos) para atualizar os dados do ranking e exibir indicador visual de revalidação/sincronização.
- [x] 3.4 Conectar a apuração de rodadas do slot ao ranking, submetendo a nova pontuação quando um recorde for alcançado.

## 4. Integração e Validação Final

- [x] 4.1 Testar fluxo completo: login simples -> seleção de setor via QR Code/URL -> rodada de apostas com multiplicador do setor -> atualização automática no ranking global.
