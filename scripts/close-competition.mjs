// Explicit organization action. Run manually; never included in the game or service worker.
const [origin] = process.argv.slice(2);
const token = process.env.COMPETITION_ADMIN_TOKEN;
if (!origin || !token) {
  console.error('Uso: configure COMPETITION_ADMIN_TOKEN e execute node scripts/close-competition.mjs https://endereco-do-jogo');
  process.exitCode = 1;
} else {
  try {
    const url = new URL('/api/competition', origin);
    if (url.protocol !== 'https:' && !(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && url.protocol === 'http:')) {
      throw Error('Use HTTPS, ou HTTP somente em localhost para desenvolvimento.');
    }
    const response = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'close' }), signal: AbortSignal.timeout(10000),
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || `HTTP ${response.status}`);
    console.log(JSON.stringify(result.competition, null, 2));
  } catch (error) {
    console.error('Não foi possível confirmar o encerramento:', error.message);
    process.exitCode = 1;
  }
}
