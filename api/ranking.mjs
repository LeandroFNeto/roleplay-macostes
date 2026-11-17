import { redis, clean, body, getSession } from './_lib.mjs';
import { COMPETITION_KEYS, validateScore, publicCompetition } from './_competition-model.mjs';
import { competitionOperation, publicPlayers } from './_competition-store.mjs';

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
      const [generalRecords, eligibleRecords] = await Promise.all([
        db.hgetall(COMPETITION_KEYS.generalRecords), db.hgetall(COMPETITION_KEYS.records),
      ]);
      const players = publicPlayers(generalRecords, Date.now(), eligibleRecords);
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
