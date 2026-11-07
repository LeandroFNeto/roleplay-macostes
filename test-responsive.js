const fs = require('fs');
const assert = require('assert');

console.log('--- TESTE DE RESPONSIVIDADE E LAYOUT CROSS-DEVICE ---');

const html = fs.readFileSync('index.html', 'utf8');
const css = fs.readFileSync('style.css', 'utf8');

// 1. Verificar configuração de viewport e dvh no HTML
assert.ok(html.includes('min-h-[100dvh]'), 'index.html deve conter min-h-[100dvh] no container principal/body');
assert.ok(html.includes('max-h-[85dvh]'), 'Modais no index.html devem limitar altura a 85dvh');
assert.ok(html.includes('md:max-w-lg'), 'Machine wrapper deve conter classe responsiva md:max-w-lg para telas de desktop');

// 2. Verificar variáveis e safe-area no CSS
assert.ok(css.includes('--stage-height: clamp('), 'style.css deve declarar --stage-height com clamp()');
assert.ok(css.includes('--mascot-height: clamp('), 'style.css deve declarar --mascot-height com clamp()');
assert.ok(css.includes('env(safe-area-inset-top)'), 'style.css deve respeitar safe-area-inset-top');
assert.ok(css.includes('env(safe-area-inset-bottom)'), 'style.css deve respeitar safe-area-inset-bottom');

// 3. Verificar media queries de compactação mobile (altura reduzida)
assert.ok(css.includes('@media (max-height: 750px)'), 'style.css deve conter media query para max-height 750px');
assert.ok(css.includes('@media (max-height: 640px)'), 'style.css deve conter media query para max-height 640px');

// 4. Verificar otimização para telas médias/grandes (computadores desktop)
assert.ok(css.includes('@media (min-width: 768px)'), 'style.css deve conter media query para min-width 768px');

// 5. Verificar ergonomia de botões e compactação de pontuação
assert.ok(css.includes('--bet-btn-min-height'), 'Botões de aposta devem ter variável de altura mínima');
assert.ok(css.includes('.spin-btn-ornamental'), 'Botão de girar deve ter estilização ornamental');
assert.ok(html.includes('id="ui-saldo"') && html.includes('id="ui-multiplier"'), 'index.html deve conter indicadores de saldo e multiplicador');

console.log('✓ Todas as verificações de responsividade mobile e desktop foram aprovadas com sucesso!');
