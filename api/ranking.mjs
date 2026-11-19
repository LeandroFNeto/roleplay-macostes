import { redis, clean, body, getSession } from './_lib.mjs';
import { COMPETITION_KEYS, validateScore, publicCompetition, decodeRecord } from './_competition-model.mjs';
import { competitionOperation, publicPlayers } from './_competition-store.mjs';

// Trava anti-edicao pelo DevTools: ganho plausivel = rajada + taxa por segundo desde o ultimo envio.
// shortcut: limites estimados (aposta max 500 x linhas x bonus), sem simular o jogo; ajuste se o jogo mudar.
const BURST = 1_000_000, PER_SECOND = 500_000, START = 5000;
export function maxPlausible(prev, now = Date.now()) {
  if (!prev) return START + BURST;
  return prev.score + BURST + PER_SECOND * Math.max(0, (now - (prev.updatedAt || now)) / 1000);
}

const BLACKLIST_KEY = 'blacklist:phones';

// Limpa o ranking a cada leitura: remove contas que nao existem mais e manda fraudadores
// (pontuacao impossivel para o tempo de vida da conta) para a lista negra, apagando seus recordes.
// shortcut: o lider ja gravado em competition state nao e recalculado; upgrade se um fraudador vencer.
async function vetRecords(db, records) {
  const phones = Object.keys(records || {});
  if (!phones.length) return records || {};
  const [users, banned] = await Promise.all([db.hmget('users', ...phones), db.smembers(BLACKLIST_KEY)]);
  const blocked = new Set(banned || []);
  const clean = {}, drop = [], ban = [];
  for (const phone of phones) {
    const user = users?.[phone];
    let rec;
    try { rec = decodeRecord(records[phone]); } catch { rec = null; }
    if (blocked.has(phone) || !user) { drop.push(phone); continue; }
    const age = Math.max(0, ((rec?.updatedAt || Date.now()) - (user.createdAt || 0)) / 1000);
    if (rec && rec.score > START + BURST + PER_SECOND * age) { drop.push(phone); ban.push(phone); continue; }
    clean[phone] = records[phone];
  }
  if (ban.length) await db.sadd(BLACKLIST_KEY, ...ban);
  if (drop.length) {
    await db.hdel(COMPETITION_KEYS.generalRecords, ...drop);
    await db.hdel(COMPETITION_KEYS.records, ...drop);
  }
  return clean;
}

export function createRankingHandler(db, sessionFor = getSession) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    try {
      let result;
      if (req.method === 'POST') {
        const sess = await sessionFor(req);
        if (!sess) return res.status(401).json({ error: 'login necessario' });
        let b;
        try {
          b = body(req);
          validateScore(b.score);
          if (!sess.user.nickname) throw new TypeError('apelido invalido');
        } catch {
          return res.status(400).json({ error: 'pontuacao deve ser um inteiro entre 0 e 9007199254740991' });
        }
        if (await db.sismember(BLACKLIST_KEY, sess.phone)) return res.status(403).json({ error: 'conta bloqueada' });
        const prev = decodeRecord(await db.hget(COMPETITION_KEYS.generalRecords, sess.phone));
        if (b.score > maxPlausible(prev)) return res.status(400).json({ error: 'pontuacao invalida' });
        result = await competitionOperation(db, 'submit', {
          phone: sess.phone, nickname: sess.user.nickname, score: b.score,
          sector: clean(b.sector, 60), icon: clean(b.icon, 8), guidanceSeen: b.guidanceSeen,
        });
      } else if (req.method === 'GET') {
        result = await competitionOperation(db, 'snapshot');
      } else {
        res.setHeader('Allow', 'GET, POST');
        return res.status(405).end();
      }
      const players = publicPlayers(await vetRecords(db, await db.hgetall(COMPETITION_KEYS.generalRecords)));
      const competition = publicCompetition(result.state);
      return res.status(200).json({
        players: players.slice(0, 50), online: players.filter(p => p.online).length,
        competition, prizeWinner: competition.winner,
        ...(result.receipt || {}),
      });
    } catch {
      return res.status(503).json({ error: 'servidor indisponivel' });
    }
  };
}

export default createRankingHandler(redis);
