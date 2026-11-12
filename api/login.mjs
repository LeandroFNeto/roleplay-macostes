import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { redis, clean, body } from './_lib.mjs';

const hashPin = (pin, salt) => scryptSync(pin, salt, 32).toString('hex');
const MAX_FAILS = 5;
const LOCK_S = 900;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const b = body(req);
    let phone = String(b.phone || '').replace(/\D/g, '');
    if (phone.length >= 12 && phone.startsWith('55')) phone = phone.slice(2); // DDI Brasil
    const pin = String(b.pin || '');
    if (!/^\d{10,11}$/.test(phone)) return res.status(400).json({ error: 'Telefone invalido (DDD + numero)' });
    if (!/^\d{4,6}$/.test(pin)) return res.status(400).json({ error: 'PIN deve ter 4 a 6 numeros' });

    const failKey = `fails:${phone}`;
    if ((Number(await redis.get(failKey)) || 0) >= MAX_FAILS) {
      return res.status(429).json({ error: 'Muitas tentativas. Tente em 15 minutos.' });
    }

    let user = await redis.hget('users', phone);
    if (user) {
      const ok = timingSafeEqual(Buffer.from(hashPin(pin, user.salt), 'hex'), Buffer.from(user.hash, 'hex'));
      if (!ok) {
        await redis.incr(failKey);
        await redis.expire(failKey, LOCK_S);
        return res.status(401).json({ error: 'PIN incorreto' });
      }
      await redis.del(failKey);
    } else {
      const nickname = clean(b.nickname, 20);
      if (nickname.length < 2) return res.status(400).json({ error: 'Primeiro acesso: informe um apelido' });
      // 1 apelido por telefone: reserva atômica do apelido
      const claimed = await redis.hsetnx('nicks', nickname.toLowerCase(), phone);
      if (!claimed) return res.status(409).json({ error: 'Apelido ja em uso' });
      const salt = randomBytes(16).toString('hex');
      user = { nickname, salt, hash: hashPin(pin, salt), createdAt: Date.now() };
      // hsetnx evita que duas requisições simultâneas criem a mesma conta
      if (!(await redis.hsetnx('users', phone, user))) {
        await redis.hdel('nicks', nickname.toLowerCase());
        return res.status(409).json({ error: 'Telefone ja cadastrado, entre com o PIN' });
      }
    }

    const token = randomBytes(24).toString('hex');
    await redis.set(`sess:${token}`, phone, { ex: 60 * 60 * 24 * 30 });
    res.status(200).json({ token, nickname: user.nickname });
  } catch (e) {
    res.status(500).json({ error: 'servidor indisponivel' });
  }
}
