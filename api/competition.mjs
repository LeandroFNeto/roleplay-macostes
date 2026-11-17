import { timingSafeEqual } from 'node:crypto';
import { redis, body } from './_lib.mjs';
import { publicCompetition } from './_competition-model.mjs';
import { competitionOperation } from './_competition-store.mjs';

export function createCompetitionHandler(db, secret = () => process.env.COMPETITION_ADMIN_TOKEN) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).end();
    }
    const expected = secret();
    if (!expected) return res.status(503).json({ error: 'encerramento nao configurado pela organizacao' });
    const provided = (req.headers.authorization || '').replace(/^Bearer /, '');
    const a = Buffer.from(provided), b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return res.status(403).json({ error: 'somente a organizacao pode encerrar' });
    }
    try {
      let data;
      try { data = body(req); } catch { return res.status(400).json({ error: 'dados invalidos' }); }
      if (data.action !== 'close') return res.status(400).json({ error: 'acao invalida' });
      const { state } = await competitionOperation(db, 'close');
      return res.status(200).json({ competition: publicCompetition(state) });
    } catch {
      return res.status(503).json({ error: 'servidor indisponivel' });
    }
  };
}

export default createCompetitionHandler(redis);
