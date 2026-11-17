import { copyFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
for (const name of ['index.html', 'style.css', 'script.js', 'app-mode.js', 'auth-store.js',
  'ranking-service.js', 'mascots-config.js', 'sw.js', 'manifest.json', 'tailwind.cdn.js']) {
  copyFileSync(new URL(name, root), new URL(`android/app/src/main/assets/${name}`, root));
}
console.log('Arquivos web do Android sincronizados. Recompile para gerar um novo APK.');
