# Spec Delta

## Purpose

Define como o jogo é distribuído e executado como Progressive Web App instalável e utilizável offline, substituindo a distribuição por APK.

## ADDED Requirements

### Requirement: App instalável como PWA
O sistema SHALL ser servido por HTTPS com um web app manifest válido (nome, `start_url`, `display: standalone`, `theme_color`) e ícones PNG de 192x192 e 512x512, incluindo um ícone `maskable`, de forma que navegadores móveis ofereçam a instalação.

#### Scenario: Instalação no Android
- **WHEN** o usuário abre a URL publicada no Chrome para Android
- **THEN** o navegador oferece "Instalar app" e o app instalado abre em tela cheia (standalone) com o ícone do jogo

#### Scenario: Instalação no iOS
- **WHEN** o usuário usa "Adicionar à Tela de Início" no Safari
- **THEN** o app usa o ícone Apple definido no `index.html` e abre em modo standalone

### Requirement: Funcionamento offline
O sistema SHALL guardar em cache, durante a instalação do service worker, todos os arquivos necessários para jogar (HTML, CSS, JS, imagens e dependências externas essenciais), e SHALL permitir jogar sem conexão após a primeira visita.

#### Scenario: Abrir sem rede
- **WHEN** o usuário já visitou o app online e o abre novamente sem conexão
- **THEN** o jogo carrega e funciona com todos os mascotes e relíquias exibidos

#### Scenario: Pontuação offline
- **WHEN** o usuário joga sem conexão e depois a rede volta
- **THEN** a pontuação pendente é sincronizada com o ranking como já ocorre hoje

### Requirement: Atualização de versão sem reinstalar
O sistema SHALL usar cache versionado e buscar a navegação (HTML) primeiro na rede, com fallback para o cache, e SHALL remover caches de versões antigas ao ativar uma nova versão.

#### Scenario: Nova versão publicada
- **WHEN** uma nova versão é publicada e o usuário abre o app com conexão
- **THEN** o usuário recebe a versão nova, sem reinstalar, e o cache antigo é removido

### Requirement: Distribuição sem APK
O repositório e a documentação SHALL NOT depender de um APK. O README SHALL descrever a URL pública e os passos de instalação como PWA.

#### Scenario: Leitor do README
- **WHEN** alguém lê a seção de modos de execução
- **THEN** encontra a URL publicada e as instruções de instalação, sem links ou instruções de APK
