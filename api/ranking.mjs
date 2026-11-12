import { redis, clean, body, getSession } from './_lib.mjs';

const KEY = 'ranking:players';
const ONLINE_MS = 75000; // 2 heartbeats de 30s + folga

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'POST') {
      const sess = await getSession(req);
      if (!sess) return res.status(401).json({ error: 'login necessario' });
      const b = body(req);
      const nickname = sess.user.nickname; // identidade vem da sessão, não do corpo
      const score = Math.floor(Number(b.score));
      if (!nickname || !Number.isFinite(score) || score < 0 || score > 1e9) {
        return res.status(400).json({ error: 'dados invalidos' });
      }
      const id = sess.phone;
      const old = await redis.hget(KEY, id);
      const now = Date.now();
      // mantém o maior score já salvo; o heartbeat só renova lastSeen
      await redis.hset(KEY, {
        [id]: {
          nickname,
          score: Math.max(score, old?.score || 0),
          sector: clean(b.sector, 60),
          icon: clean(b.icon, 8),
          updatedAt: now,
          lastSeen: now,
        },
      });
    } else if (req.method !== 'GET') {
      return res.status(405).end();
    }

    const all = Object.values((await redis.hgetall(KEY)) || {});
    const now = Date.now();
    const players = all
      .map((p) => ({ ...p, online: now - p.lastSeen < ONLINE_MS }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
    res.status(200).json({ players, online: all.filter((p) => now - p.lastSeen < ONLINE_MS).length });
  } catch (e) {
    res.status(500).json({ error: 'servidor indisponivel' });
  }
}

