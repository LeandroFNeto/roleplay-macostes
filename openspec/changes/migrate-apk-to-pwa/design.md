## Context

Já existem `manifest.json`, `sw.js` (cache-first com lista fixa de assets, `CACHE_NAME = 'atleticas-v1'`) e o registro do service worker em `index.html` (apenas em HTTPS ou localhost). O app é estático (HTML/JS/CSS) com Tailwind local (`tailwind.cdn.js`). Lacunas observadas:
- O manifest declara `192x192 512x512` para `computacao-javali.png`, que tem ~550 KB e não é desse tamanho, e não há ícone maskable.
- Cache-first também para o HTML: atualizações só chegam se `CACHE_NAME` for alterado manualmente.
- `index.html` carrega a fonte Inter do Google Fonts (não está no cache offline) e `script.js` usa `api.qrserver.com` para QR Codes (só funciona online).
- `README.md` e `.gitignore` tratam o APK e o `android/`.

## Goals / Non-Goals

**Goals:** PWA instalável em Android e iOS, jogável offline após a primeira visita, atualizável sem reinstalar, publicada em URL HTTPS estável, sem APK no repositório.

**Non-Goals:** loja de apps (TWA), backend de ranking em produção, push, mudanças de gameplay.

## Decisions

1. **Hospedagem: GitHub Pages**, por workflow de GitHub Actions publicando a raiz estática. O README já usa GitHub (Releases), é gratuito e tem HTTPS. Alternativa: Vercel/Netlify, com o mesmo resultado. É premissa, e trocar não muda o código do app. Como Pages serve em subcaminho (`/<repo>/`), `start_url` e `scope` permanecem relativos (`./`), como já estão.
2. **Ícones**: gerar `assets/icons/icon-192.png`, `icon-512.png` e `icon-maskable-512.png` (mascote com margem segura) a partir do javali da atlética de Computação (símbolo escolhido pelo usuário; não existe um logo único das atléticas no projeto), e referenciá-los no manifest com os `sizes` corretos. Adicionar `apple-touch-icon` e `theme-color` no `index.html`.
3. **Estratégia do service worker**: navegação (`request.mode === 'navigate'`) usa rede primeiro com fallback para o cache de `./index.html`. Demais GET do mesmo origin usam cache primeiro. O `CACHE_NAME` é versionado e o `activate` já limpa versões antigas. Descartada a estratégia stale-while-revalidate global por ser mais complexa sem necessidade.
4. **Dependências externas offline**: cachear em tempo de execução as respostas de `fonts.googleapis.com` e `fonts.gstatic.com` no service worker (offline após a primeira visita), em vez de hospedar as fontes. Para o QR Code via `api.qrserver.com`, manter o comportamento online e mostrar o link como fallback sem rede, por ser um recurso de compartilhamento que não bloqueia o jogo. Isso será confirmado na implementação ao ler `script.js`.
5. **Remoção do APK**: apagar `android/` e `Mascotes-UENP-Offline.apk` e limpar as regras do `.gitignore`. O histórico git preserva o conteúdo caso seja preciso recuperá-lo.

## Risks / Trade-offs

- Usuários do APK antigo ficam sem atualizações → o README e o aviso de release indicam a URL da PWA.
- iOS limita armazenamento de PWA e exige instalação manual via "Adicionar à Tela de Início" → documentar no README.
- Rede primeiro no HTML atrasa a abertura em rede ruim → usar timeout curto antes de cair no cache (shortcut: timeout fixo, ajustar se houver reclamação).
- Cache de ~30 assets grandes pode ser pesado em dados móveis na primeira visita → as imagens atuais somam alguns MB; avaliar otimização (webp) só se for um problema.
- A URL exata do Pages só existe após o primeiro deploy → os QR Codes dependem dela e devem ser regenerados quando ela estiver definida.

## Open Questions

- Qual a URL final de hospedagem (se não for GitHub Pages)?
