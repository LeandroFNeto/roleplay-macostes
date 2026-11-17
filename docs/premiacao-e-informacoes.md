# Proposta: premiação por recorde e informações compactas

## Problema e objetivo

A versão anterior premiava o primeiro envio de 1 milhão, limitava pontuações a 1 bilhão e atualizava o ranking com leitura e escrita separadas. Dois envios simultâneos podiam sobrescrever um recorde maior. Quatro blocos de orientação ocupavam espaço no jogo e havia um botão que disparava manualmente a relíquia.

O objetivo é premiar o recorde confirmado, garantir resultado único e imutável, concentrar orientações num painel consultável e manter o jogo offline e seus bônus automáticos. As mudanças são feitas diretamente no projeto, sem OpenSpec.

## Especificações de comportamento

| Situação | Resultado |
| --- | --- |
| Recorde confirmado abaixo de 1 bilhão | Competição continua aberta; mantém o maior recorde pessoal |
| Primeiro recorde confirmado igual ou superior a 1 bilhão | Encerra antecipadamente com esse jogador como vencedor |
| Organização encerra antes da meta | Vence o maior recorde elegível, mesmo se o saldo atual caiu |
| Dois recordes iguais | Vence o primeiro confirmado naquela pontuação, pela sequência do servidor |
| Duas confirmações no mesmo milissegundo | A sequência Redis desempata sem consultar horário do cliente |
| Reenvio, heartbeat ou pontuação menor | Não reduz recorde, não muda sua prioridade e não substitui vencedor |
| Envio disputa execução com encerramento | A ordem das operações atômicas Redis determina se entra no prêmio |
| Pontos offline chegam após encerramento | Atualizam somente ranking geral; recorde elegível e vencedor ficam congelados |
| Fechar aplicativo/aba | Não afeta o estado global da competição |
| Encerramento sem recordes elegíveis | Fecha sem vencedor |
| Registro legado do milhão presente | Fica preservado, sem participar da nova decisão |
| Pontuação maior que 1 bilhão em um envio | Aceita qualquer inteiro seguro não negativo, sem truncamento |

O horário de aceitação vem de `TIME` do Redis. O desempate usa `INCR`, que dá ordem total inclusive a envios simultâneos. Um empate só considera o momento em que cada jogador confirmou o recorde empatado, e não quando criou a conta ou enviou pontos pela primeira vez.

## Design do servidor e persistência

`api/_competition-model.mjs` define validação, codificação exata de pontos e campos públicos. `api/_competition-store.mjs` implementa a máquina de estados e sua persistência num único script Lua. `api/ranking.mjs` valida sessão e encaminha recordes; `api/competition.mjs` permite encerramento apenas com o segredo da organização.

| Chave Redis | Finalidade |
| --- | --- |
| `ranking:players` | Recordes gerais existentes, preservados e atualizados mesmo após o prêmio |
| `prize:first-million` | Registro histórico anterior, preservado e ignorado pela decisão v2 |
| `competition:v2:state` | Estado aberto/fechado, meta, líder, vencedor, motivo e datas |
| `competition:v2:records` | Recorde elegível de cada conta durante a competição |
| `competition:v2:sequence` | Ordem das confirmações de novos recordes e do encerramento |
| `competition:v2:migration` | Versão, data e política da migração |
| `accounts:guidance-seen:v1` | Confirmação por conta de que as orientações foram apresentadas |

Na primeira operação da API, a migração cria a competição v2 atomicamente e importa todos os recordes gerais válidos já confirmados para a apuração, sem exigir novo login. Não apaga nem reinterpreta o prêmio antigo e não altera os registros gerais durante essa importação. A pontuação utilizada em novos envios continua sendo o máximo entre o envio e o recorde geral preservado.

A API antiga não guardava o instante exato de conquista do recorde. Para os registros importados, usa-se `achievedAt`, quando existir, ou o último horário de confirmação disponível em `updatedAt`. Se ambos faltarem, vale o horário da migração. Empates desse horário são resolvidos pelo identificador privado estável da conta em ordem crescente. Essa é uma regra de compatibilidade com o histórico disponível, não uma reconstrução de eventos que nunca foram armazenados. A importação atribui as primeiras sequências nessa ordem; novos envios recebem sequências posteriores. Se registros antigos já estiverem na meta, a migração encerra com o primeiro deles por essa ordem.

A submissão calcula `max(recorde geral, pontos recebidos)` e, com a disputa aberta, atualiza o recorde elegível quando necessário. A primeira atualização em pelo menos 1 bilhão congela o resultado. O encerramento administrativo congela o líder da mesma estrutura. Não há expiração nem reabertura automática.

Guardar pontos como strings decimais no JSON evita o arredondamento de inteiros grandes pela serialização `cjson`. A API converte de volta para números seguros. Números negativos, fracionários, strings e valores maiores que `Number.MAX_SAFE_INTEGER` são rejeitados com HTTP 400.

Respostas públicas usam allowlists; telefone, PIN, hash, tokens, identificadores internos e sequência privada não são expostos. `prizeWinner` continua disponível como alias de `competition.winner` para compatibilidade. O POST inclui `confirmedScore`, `eligibleScore`, `awardEligibility` e `guidanceSeen`; um recorde geral tardio pode ser maior que seu recorde elegível.

## Design da interface e orientações

- O botão **ⓘ**, no canto direito da barra acima da máquina, abre um `dialog` com premiação, jogos bonificados e conexão/cache offline.
- O painel possui título acessível, botão de fechar, ação “Entendi, vamos jogar”, rolagem, altura máxima de `85dvh` e comportamento de foco/teclado do diálogo nativo.
- A barra permanece no fluxo do layout e os botões podem quebrar linha. O indicador compacto de conexão fica fora do painel; não exige abri-lo para consultar online, offline ou servidor indisponível.
- O resultado confirmado também possui um resumo compacto na barra. Offline, o painel identifica que os dados correspondem à última consulta, sem declarar vitória a partir de pontos locais.
- O botão e o listener de teste da relíquia são removidos. A função de animação e os gatilhos automáticos de bônus permanecem.

Contas novas recebem `guidanceVersion: 1`. O login informa `guidanceRequired` enquanto a apresentação ainda não foi confirmada no servidor. Contas anteriores não recebem abertura automática. Ao apresentar o painel, o cliente persiste imediatamente um marcador por conta em `tigrinho_account_guidance_v1`, antes de abrir o diálogo. Isso evita repetição em reload, novos logins e troca de mascote no aparelho.

O próximo POST de sincronização envia `guidanceSeen: true`. O Redis registra com `HSETNX`, sem reescrever credenciais ou expirar a confirmação. Logins posteriores em outros aparelhos recebem o estado confirmado. Se houver desconexão antes dessa confirmação, a persistência local evita repetir no mesmo aparelho e a sincronização tenta novamente. Dois aparelhos sem compartilhar ainda a confirmação podem apresentar o painel antes de reconectar; não se promete coordenação global enquanto ambos estão sem comunicação.

## Offline e compatibilidade

O saldo, o recorde e a última competição confirmada continuam persistidos. As pendências passam a ser separadas por conta, com leitura compatível da chave antiga; a sincronização nunca atribui o recorde de uma conta à sessão de outra. Se um novo recorde surgir durante um POST, a resposta anterior não o remove. Reenvios são idempotentes pelo máximo de pontuação e pela imutabilidade do estado fechado.

O cache do Service Worker muda para `atleticas-v10`, preservando a estratégia existente para todos os mascotes e mantendo APIs fora do cache. Os arquivos embarcados no Android são sincronizados com a versão web. A configuração de acesso às APIs pela WebView local permanece uma necessidade já existente do projeto.

## Tarefas e validação

- [x] Analisar APIs, persistência, mecânica dos giros e testes existentes.
- [x] Separar o prêmio v2 do histórico, com migração atômica e preservação de dados.
- [x] Validar pontos seguros, incluindo ultrapassar a meta em uma jogada.
- [x] Implementar máximo pessoal, sequência de desempate e resultado único no mesmo EVAL.
- [x] Implementar encerramento global protegido e comando operacional da organização.
- [x] Congelar elegibilidade após encerramento, preservando o ranking geral e recibos tardios.
- [x] Remover o acionamento manual da relíquia, preservando gatilhos automáticos.
- [x] Criar painel de informações e indicadores compactos, com confirmação por conta.
- [x] Preservar pendências offline entre contas e respostas em andamento.
- [x] Atualizar cache, fontes Android, documentação e comandos de teste.
- [x] Incluir testes de API, orientações, sincronização offline, cache e integridade dos recursos.
- [x] Incluir testes de integração que executam o Lua real em Redis para meta, desempates, concorrência, reenvios, encerramento e migração.
- [ ] Executar a integração real com `REDIS_TEST_URL` configurado; sem instância de teste, a suíte é explicitamente marcada como pendente.

Execute `npm test` para os testes locais. Com Redis de desenvolvimento, configure `REDIS_TEST_URL` e execute `npm run test:redis`. Os testes reais usam prefixos aleatórios e removem somente suas próprias chaves; não usam credenciais do jogo publicado.

O workflow `.github/workflows/tests.yml` prepara um Redis descartável no GitHub Actions e executa a suíte completa em pushes e pull requests, incluindo a integração real. Na execução local desta alteração, 38 verificações passaram e a integração foi marcada como pendente por falta de Redis. A revisão visual pelo navegador foi bloqueada pela política de automação disponível; as verificações de responsividade locais analisam os arquivos de layout, sem substituir um teste visual em aparelho.

## Limites e operação

A confirmação de pontos continua baseada no cliente autenticado, como no projeto original; validar cada giro no servidor seria outro escopo. O maior inteiro seguro é o limite de precisão do JavaScript, não uma segunda meta de prêmio. O encerramento deve ser executado uma vez pela organização, embora reenvios sejam seguros. O segredo administrativo fica exclusivamente no ambiente do servidor e no terminal da organização. A implantação do código e a distribuição de um APK novo são etapas distintas da implementação local.
