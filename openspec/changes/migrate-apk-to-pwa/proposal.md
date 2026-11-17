# Proposal

## Why

Distribuir o jogo como APK exige compilar (Gradle/Android), publicar o arquivo em Releases e pedir que o aluno instale de fontes desconhecidas. Isso atrapalha a adesão via QR Codes nos campi. O app já tem `manifest.json`, `sw.js` e registro do service worker no `index.html`, então uma PWA instalável hospedada em HTTPS cobre o mesmo uso (instalar na tela inicial e jogar offline) sem gerar APK.

## What Changes

- Tornar a PWA a única forma de distribuição: o QR Code e o link abrem a URL hospedada, e o navegador oferece "Instalar app".
- Corrigir lacunas de instalabilidade: ícones reais de 192x192 e 512x512 (hoje o manifest declara esses tamanhos para um PNG grande de ~550 KB), incluindo versão `maskable`, e `<meta name="theme-color">` e ícone Apple no `index.html`.
- Tornar o cache offline confiável: o `sw.js` passa a usar cache versionado, com rede primeiro para navegação (HTML) e cache primeiro para assets estáticos. Assim, novas versões chegam sem exigir reinstalação. Fontes e dependências externas que o jogo precisa offline são incluídas no cache ou têm fallback.
- Publicar o site estático em HTTPS (GitHub Pages, ver premissa no design) com URL estável usada pelos QR Codes.
- Remover o fluxo do APK: apagar `Mascotes-UENP-Offline.apk` e a pasta `android/`, e reescrever a seção do README ("Modos de Execução") para instruir a instalação como PWA.
- **BREAKING**: o APK deixa de ser distribuído e mantido. Quem já o instalou precisa passar a usar a PWA.

## Capabilities

### New Capabilities
- `pwa-distribution`: instalabilidade (manifest, ícones, HTTPS), funcionamento offline com service worker e atualização de versão, e entrega via URL/QR Code.

### Modified Capabilities
<!-- Nenhuma: openspec/specs só contém responsive-layout, cujos requisitos não mudam. -->

## Impact

- Código: `manifest.json`, `sw.js`, `index.html`, novos ícones em `assets/icons/`, `README.md`, e `.gitignore` (remover regras do Android).
- Remoções: `android/`, `Mascotes-UENP-Offline.apk`.
- Infra: configuração de hospedagem estática com HTTPS (workflow de deploy do GitHub Pages).
- Sem alteração nas regras do jogo, no ranking ou no `auth-store.js`.
- Fora de escopo: empacotar a PWA em loja (TWA/Play Store), backend de ranking em produção (`DEFAULT_API_URL` ainda aponta para `localhost:3000`) e notificações push.
