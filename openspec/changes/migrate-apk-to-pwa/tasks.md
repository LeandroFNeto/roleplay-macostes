## 1. Instalabilidade

- [x] 1.1 Gerar `assets/icons/icon-192.png`, `icon-512.png` e `icon-maskable-512.png` a partir do símbolo da atlética de Computação (javali, `assets/mascots/computacao-javali.png`), escolhido pelo usuário; conferir visualmente o recorte
- [x] 1.2 Atualizar `manifest.json` com os ícones nos tamanhos reais (`any` e `maskable`)
- [x] 1.3 Adicionar `theme-color` e `apple-touch-icon` no `<head>` de `index.html`

## 2. Offline e atualização

- [x] 2.1 Reescrever o handler `fetch` de `sw.js`: rede primeiro para navegação com fallback `./index.html`, cache primeiro para assets do mesmo origin, e incrementar `CACHE_NAME`
- [x] 2.2 Incluir os novos ícones em `ASSETS_TO_CACHE`
- [x] 2.3 Cachear em tempo de execução as fontes do Google Fonts no `sw.js` (em vez de hospedar localmente)
- [x] 2.4 Em `script.js`, mostrar o link como fallback quando o QR Code (`api.qrserver.com`) não carregar offline

## 3. Hospedagem

- [x] 3.1 Criar workflow do GitHub Actions que publica a raiz estática no GitHub Pages
- [x] 3.2 URL do Pages (https://leandrofneto.github.io/roleplay-macostes/) usada no README; confirmar após o primeiro deploy e regenerar os QR Codes

## 4. Remover APK

- [x] 4.1 Apagar `android/` e `Mascotes-UENP-Offline.apk`
- [x] 4.2 Remover as regras de Android e `*.apk` do `.gitignore`
- [x] 4.3 Reescrever em `README.md` a seção "Modos de Execução" e as menções a APK e Android WebView, com URL e passos de instalação (Android e iOS)

## 5. Verificação

- [ ] 5.1 Servir localmente (`npx serve .`) e conferir no Chrome DevTools > Application: manifest sem avisos, ícones e service worker ativos
- [ ] 5.2 Marcar Offline no DevTools, recarregar e jogar uma rodada
- [ ] 5.3 Mudar `CACHE_NAME` e conferir que a versão nova é carregada e o cache antigo some
- [ ] 5.4 Instalar a PWA publicada em um Android e em um iPhone
