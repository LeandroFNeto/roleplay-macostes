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

A barra de seleção foi substituída por um aviso com os links dos dois jogos que estão pagando mais em pontos: bônus de **3,5x**, com rotação a cada **30 minutos**. Os demais ficam com **1,8x**. A troca fica bloqueada durante giros e rodadas automáticas de bônus.

### Desafio de 1 milhão de pontos

O login e a tela do jogo avisam para cadastrar corretamente o telefone com DDD. O primeiro jogador autenticado cuja pontuação de **1.000.000 ou mais** for registrada pelo servidor tem seu telefone salvo para contato da organização.

- O registro fica na chave privada Redis `prize:first-million`, com telefone, apelido, pontuação, setor e horário de confirmação do servidor.
- A operação atômica `SET NX` impede que dois jogadores sejam registrados como vencedores. O registro não expira nem é substituído por novos recordes.
- O ranking público mostra somente apelido, pontuação e horário do vencedor; o telefone não é devolvido pela API.
- No modo offline, o recorde fica salvo no aparelho e é enviado ao reconectar. A prioridade do prêmio segue a ordem de confirmação no servidor, não o relógio do celular.
- A pontuação continua sendo calculada pelo cliente, como no restante do projeto. O registro identifica o primeiro envio autenticado, sem validação dos giros no servidor.

Para conferir os assets, o layout e os fluxos: `node test-local.js`, `node test-responsive.js` e `node --test test-game-flows.js test-offline-cache.js`.

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
