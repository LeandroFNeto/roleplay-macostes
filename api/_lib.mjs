import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

export const clean = (v, n) => String(v ?? '').replace(/[<>]/g, '').trim().slice(0, n);

export const body = (req) => (typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {});

// Devolve { phone, user } da sessão (Authorization: Bearer <token>) ou null
export async function getSession(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const phone = await redis.get(`sess:${token}`);
  if (!phone) return null;
  const user = await redis.hget('users', phone);
  return user ? { phone, user } : null;
}
