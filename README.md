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
Para uso 100% autônomo sem necessidade de conexão ou servidor web externo:
- O instalador **`Mascotes-UENP-Offline.apk`** está compilado e disponível para download na seção de [**Releases do GitHub**](../../releases).
- Empacotado de forma autocontida para Android, com todos os assets de imagens, sons e scripts inclusos.

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

---

## QR Codes e Centros Acadêmicos

A aplicação inclui um gerador/visualizador interno de QR Codes para testes e impressão:
- **Computação:** `?sector=computacao` (Multiplicador 2.0x, Relíquia Xícara de Java)
- **Agronomia:** `?sector=agronomia` (Multiplicador 1.5x, Relíquia Milho Sagrado)
- **Enfermagem:** `?sector=enfermagem` (Multiplicador 1.5x, Relíquia Seringa de Jade)
- **Veterinária:** `?sector=veterinaria` (Multiplicador 1.5x, Relíquia Ferradura de Ouro)
- **Biologia:** `?sector=biologia` (Multiplicador 1.5x, Relíquia Carpa de Jade)

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
