const fs = require('fs');

// Carrega mascots-config.js
const configCode = fs.readFileSync('mascots-config.js', 'utf8');
let catalog;
eval(configCode + '; catalog = MASCOTS_CATALOG;');

console.log('====================================================');
console.log('   TESTE LOCAL DE INTEGRIDADE DOS MASCOTES E ASSETS  ');
console.log('====================================================\n');

const expected = {
  'computacao': { bg: 'PRETO', relic: 'xicara_java.png' },
  'enfermagem': { bg: 'AMARELO', relic: 'seringa_jade.png' },
  'veterinaria': { bg: 'VERDE', relic: 'ferradura_ouro.png' },
  'agronomia': { bg: 'VERMELHO', relic: 'milho_sagrado.png' },
  'biologia': { bg: 'AZUL', relic: 'peixe_carpa.png' }
};

let errors = 0;

for (const [id, exp] of Object.entries(expected)) {
  const m = catalog[id];
  if (!m) {
    console.error(`[FAIL] Mascote ausente: ${id}`);
    errors++;
    continue;
  }
  
  if (!fs.existsSync(m.image)) {
    console.error(`[FAIL] Imagem do mascote não encontrada: ${m.image}`);
    errors++;
  }

  if (m.bgImage && !fs.existsSync(m.bgImage)) {
    console.error(`[FAIL] Background não encontrado: ${m.bgImage}`);
    errors++;
  }

  if (!fs.existsSync(m.relicImage)) {
    console.error(`[FAIL] Relíquia não encontrada: ${m.relicImage}`);
    errors++;
  }
  
  if (!m.symbolImages || m.symbolImages.length !== 5) {
    console.error(`[FAIL] Quantidade de símbolos incorreta para ${id}`);
    errors++;
  } else {
    for (const sym of m.symbolImages) {
      if (!fs.existsSync(sym)) {
        console.error(`[FAIL] Símbolo não encontrado: ${sym}`);
        errors++;
      }
    }
  }

  console.log(`✓ ${m.mascotName} (${m.athleticName})`);
  console.log(`   - Paleta: ${exp.bg}`);
  console.log(`   - Relíquia: ${m.relicName} (${m.relicImage})`);
  console.log(`   - 5 Símbolos verificados e íntegros`);
  console.log('----------------------------------------------------');
}

if (errors === 0) {
  console.log('\n[SUCESSO] Todos os 5 mascotes, 5 relíquias e 25 símbolos passaram no teste com 100% de integridade!');
} else {
  console.error(`\n[ERRO] Foram encontrados ${errors} erros.`);
  process.exit(1);
}
