# Desafio das Atléticas UENP - Caça-Níquel Distribuído

Projeto acadêmico desenvolvido para a disciplina de **Sistemas Distribuídos** da **Universidade Estadual do Norte do Paraná (UENP)**.

O objetivo principal deste projeto é explorar e testar a integração e sincronização de dados entre múltiplos dispositivos conectados, utilizando pontos físicos com **QR Codes espalhados pelos campi e centros da UENP**, contemplando arquiteturas **Online** e **Offline-First**.

---

## Proposta do Trabalho & Conceitos de Sistemas Distribuídos

O sistema foi concebido como um laboratório prático para desafios de computação distribuída:

1. **Múltiplos Dispositivos & Nós Heterogêneos:** Vários aparelhos celulares de alunos e visitantes interagem concorrentemente com o ecossistema.
2. **Descoberta por QR Codes nos Campi:** Cartazes e totens com QR Codes posicionados estrategicamente em cada centro acadêmico (Ciência da Computação, Agronomia, Enfermagem, Medicina Veterinária, Ciências Biológicas) identificam a localização física do nó e concedem bônus específicos, mascotes dinâmicos e relíquias de cada curso.
3. **Resiliência e Tolerância a Falhas (Offline-First):**
   - Os estudantes nem sempre possuem conexão de internet estável ao transitar entre salas, laboratórios e blocos da universidade.
   - O jogo opera tanto em modo **Online** com sincronização distribuída periódica quanto em modo **Offline**, armazenando estados e pontuações em cache local (*LocalStorage / Service Worker / Android WebView Assets*).
   - Ao restabelecer a conectividade de rede (`window.online`), o serviço reconcilia a pontuação pendente com o servidor distribuído de ranking de forma eventual e transparente.

---

## O Jogo: Caça-Níquel Universitário (Mascotes & Memes)

> **AVISO: SEM DINHEIRO REAL**  
> Este jogo **NÃO envolve apostas com dinheiro de verdade**. Todas as moedas, apostas e prêmios são puramente fictícios (pontuação de gamificação para entretenimento e pesquisa acadêmica).

Para tornar o teste de carga e a adesão dos alunos engajadora e divertida, a aplicação adota a estética lúdica dos jogos de caça-níquel (inspirado no meme do "Tigrinho", adaptado para o universo universitário):

- **Mascotes das Atléticas:**
  - **Javali** — Ciência da Computação (CCT)
  - **Galo** — Agronomia
  - **Abelha** — Enfermagem
  - **Burro** — Medicina Veterinária
  - **Urso** — Ciências Biológicas
- **Mecânicas Especiais:** Relíquias 3D animadas, buffs sazonais que rotacionam a cada 30 minutos, combos temáticos de símbolos dos cursos e efeitos visuais imersivos.

---

## Modos de Execução & Versões

### 1. Aplicativo Android Offline (APK)
O projeto inclui um empacotamento Android com os arquivos do jogo no aparelho:
- O instalador **`Mascotes-UENP-Offline.apk`** está compilado e disponível para download na seção de [**Releases do GitHub**](../../releases).
- Empacotado de forma autocontida para Android, com todos os assets de imagens, sons e scripts inclusos.
- O login e a sincronização dependem de servidor; a WebView atual usa arquivos locais e ainda precisa da configuração do endereço das APIs para validar esse fluxo no APK.

### 2. Versão Web / PWA (Online e Cache Offline)
- Funciona em qualquer navegador moderno (Desktop e Mobile).
- Suporte a Progressive Web App (PWA) via `sw.js` e `manifest.json`, permitindo instalação como aplicativo na tela inicial do celular.
- Para rodar localmente:
  ```bash
  # Inicie qualquer servidor HTTP simples na pasta raiz:
  npx serve .
  # Ou com Python:
  python -m http.server 8080
  ```

### Testar sem servidor de autenticação ou Redis

Na pasta raiz, execute `python -m http.server 8080 --bind 127.0.0.1` e abra **http://localhost:8080/?demo=1**. Clique em **Entrar no teste local**; não é necessário informar telefone ou PIN.

O parâmetro `demo=1` só funciona em `localhost`, `127.0.0.1` ou `[::1]`. Os links de mascotes preservam esse modo, por exemplo `?setor=agronomia&demo=1`. O saldo é mantido entre os jogos e ao reabrir o navegador.

Conta e ranking de teste usam dados locais separados. Nesse modo não há chamadas de login, sincronização ou registro de prêmio no servidor. No endereço publicado, o parâmetro é ignorado e o login normal continua obrigatório. Para testar as APIs reais, use `npx vercel dev --local` com um Redis de desenvolvimento configurado.

### Continuar jogando sem internet na versão Web/PWA

1. Abra o site por HTTPS (ou localhost durante o desenvolvimento), entre na conta com internet e aguarde **“Todos os mascotes estão disponíveis offline neste aparelho”**.
2. O Service Worker guarda a página, os scripts e todos os símbolos, fundos, mascotes e animações das cinco atléticas. A lista é construída a partir de `mascots-config.js`, incluindo jogos ainda não visitados. Fontes externas são opcionais e possuem uma alternativa local.
3. Se a conexão cair, a lógica dos giros continua no aparelho. Saldo e recorde usam a persistência local já existente. A navegação entre links de mascotes e a reabertura da página usam o cache quando a rede falha.
4. A primeira entrada em uma conta continua exigindo servidor. A preparação inicial do cache precisa terminar antes da desconexão. A sequência completa de rodadas bônus ainda não é restaurada após fechar o jogo.

O aviso de conectividade diferencia **Online**, **Sincronizando**, **Offline — sem internet**, **Sem comunicação com o servidor** e **Sessão expirada**. O estado online depende de uma resposta válida da API, não somente de `navigator.onLine`. Eventos de desconexão atualizam o aviso imediatamente; falhas de comunicação detectadas nas requisições preservam os pontos pendentes. As requisições têm limite de 8 segundos e as novas tentativas ocorrem automaticamente a cada 30 segundos, além da reconexão do navegador.

O ranking informa quando está mostrando dados salvos e deixa de apresentar jogadores como conectados sem confirmação do servidor. Instalar a PWA na tela inicial é opcional para utilizar o cache.

---

## QR Codes e Centros Acadêmicos

A aplicação inclui um gerador/visualizador interno de QR Codes para testes e impressão:
- **Computação / Javali:** `?setor=computacao` (Relíquia Xícara de Java)
- **Agronomia / Galo:** `?setor=agronomia` (Relíquia Milho Sagrado)
- **Enfermagem / Abelha:** `?setor=enfermagem` (Relíquia Seringa de Jade)
- **Veterinária / Burro:** `?setor=veterinaria` (Relíquia Ferradura de Ouro)
- **Biologia / Urso:** `?setor=biologia` (Relíquia Carpa de Jade)

Cada link abre o jogo do respectivo mascote. A conta, o saldo e o recorde são compartilhados entre os links no mesmo navegador. Os parâmetros antigos `sector` e `mascote` continuam aceitos.

Acesse o botão **🔔 Notificações**, com o mesmo estilo dos botões Ranking e QR Codes, para ver a conexão, os links dos dois jogos com maior bônus e as regras. Cada jogo bonificado mostra seu multiplicador de **3,5x**. A rotação ocorre a cada **30 minutos**; os demais ficam com **1,8x**. A troca fica bloqueada durante giros e rodadas automáticas de bônus. A relíquia continua sendo ativada automaticamente pelos giros, sem botão de teste manual. As regras e o resultado da premiação ficam no painel.

### Premiação: topo do ranking no encerramento

**Quem estiver no topo do ranking quando o aplicativo for encerrado pela organização ganha.** Vale o **maior recorde confirmado pelo servidor até o encerramento**, independentemente do saldo atual. Nenhuma pontuação encerra a competição automaticamente. Em empate, vence quem confirmou aquele recorde primeiro no servidor. A ordem é dada por uma sequência Redis, inclusive para confirmações no mesmo milissegundo.

- Fechar uma aba ou aplicativo **não encerra a competição**. Somente a organização pode executar `POST /api/competition` com a ação `close` e seu segredo administrativo.
- Um único script Lua (`EVAL`) atualiza o máximo pessoal, o recorde elegível e o vencedor no Redis. Envios simultâneos, heartbeats e reenvios não reduzem recordes nem substituem o resultado fechado.
- Pontos offline recebidos **depois** do encerramento atualizam o ranking geral e o recorde pessoal, mas **não participam do prêmio nem alteram o vencedor**. Vale a confirmação no servidor, sem confiar no relógio do aparelho. A interface conserva a última confirmação disponível offline.
- Se não houver nenhum recorde elegível, a competição encerra sem vencedor. Não há reabertura automática.
- A migração é automática e atômica no primeiro acesso à API v3. Preserva `ranking:players` e os registros privados das premiações anteriores. Os recordes já confirmados participam sem exigir novo login. Resultados automáticos antigos ficam somente no histórico; um encerramento global já feito pela organização permanece válido, com seu vencedor e seus recordes elegíveis congelados.
- A ordem original de confirmação é preservada quando disponível. Para registros antigos sem sequência, a migração usa `achievedAt` ou `updatedAt`; em empate desse horário, usa o identificador privado estável da conta. Sem horários, considera o instante da migração. Os novos envios são ordenados pela sequência Redis, e a ordem pública dos empates acompanha o mesmo critério da premiação.
- A API aceita inteiros de `0` a `Number.MAX_SAFE_INTEGER` (`9.007.199.254.740.991`). Os valores são guardados como strings decimais dentro do JSON Redis para evitar arredondamento do Lua/cjson e retornados como números na API. Esse limite é de precisão numérica, sem relação com a escolha do vencedor.
- O telefone fica somente nos dados privados da organização. A API pública usa uma lista explícita de campos permitidos. Como antes, os pontos são calculados pelo cliente: confirmação autenticada não equivale a validação dos giros contra fraude.

### Orientações e conexão

As orientações abrem automaticamente uma vez para contas criadas nesta versão. A apresentação fica registrada imediatamente por conta no aparelho e é confirmada no Redis no próximo envio autenticado. Recarregar, trocar de mascote e sair/entrar não repetem a orientação. Outros aparelhos respeitam a confirmação do servidor após a sincronização. Se uma apresentação ocorrer offline, a confirmação é enviada ao reconectar; antes disso, outro aparelho ainda pode recebê-la. Contas antigas não são obrigadas a passar pelo aviso novo. O botão **🔔 Notificações** sempre permite consultar novamente.

O indicador compacto de conexão fica fora do painel, na barra do jogo, e distingue **Online**, **Offline**, **Servidor indisponível**, sincronização e sessão expirada. O painel tem rolagem e limite de altura para telas pequenas; quando fechado, não cobre controles. As pendências offline são separadas por conta, inclusive ao trocar de jogador no mesmo aparelho.

### Configuração e encerramento pela organização

Configure `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (ou os aliases `KV_REST_API_URL` e `KV_REST_API_TOKEN`) no servidor. Configure também `COMPETITION_ADMIN_TOKEN` com um segredo aleatório longo, exclusivo da organização. **Nunca coloque esse segredo nos arquivos do navegador, no APK ou no repositório.**

Para encerrar globalmente, use um terminal da organização, com o mesmo segredo no ambiente:

```powershell
$env:COMPETITION_ADMIN_TOKEN = 'segredo-configurado-no-servidor'
node scripts/close-competition.mjs https://endereco-do-jogo.vercel.app
```

O comando envia `{ "action": "close" }` para `/api/competition` usando `Authorization: Bearer ...`. Encerramentos repetidos retornam o resultado já congelado. Não há segredo administrativo nem botão de encerramento nas telas dos jogadores. Publicar o código não encerra a competição.

### Testes

```powershell
npm ci
npm test
```

Os testes de modelo, API, contas, orientações, sincronização, cache, assets e verificações de responsividade não exigem Redis nem dependências npm. A suíte de integração executa **o script Lua real**, com chaves isoladas e limpeza apenas dessas chaves, quando há um Redis de teste:

```powershell
$env:REDIS_TEST_URL = 'redis://127.0.0.1:6379'
npm run test:redis
```

Ela cobre permanência da competição aberta para qualquer pontuação válida, encerramento pelo maior recorde, empates, recordes simultâneos, reenvios, corrida entre encerramento e envio, migração e pontos offline tardios. Sem `REDIS_TEST_URL`, essa suíte é indicada como pendente, sem simular o comportamento do Redis. Use uma instância de desenvolvimento, nunca credenciais de produção.

O workflow de testes do GitHub Actions cria seu próprio Redis descartável e roda a suíte completa em pushes e pull requests.

Depois de alterar o jogo web, sincronize os arquivos usados pelo empacotamento Android com `node scripts/sync-android-assets.mjs`. Isso atualiza os fontes embarcados; para distribuir um APK novo é necessário compilá-lo novamente.

A proposta, especificações, decisões de design e tarefas estão em [docs/premiacao-e-informacoes.md](docs/premiacao-e-informacoes.md).

---

## Autoria

- **Matéria:** Sistemas Distribuídos
- **Integrantes:**
  - Leandro
  - Anibal
  - Armando
  - Sophia
  - Pedroso
  - Meneguel
