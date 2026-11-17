// Minimal RESP client for integration tests; no package or production credentials needed.
import net from 'node:net';
import tls from 'node:tls';
import { randomUUID } from 'node:crypto';

const incomplete = Symbol('incomplete');
function parse(buffer, offset = 0) {
  if (offset >= buffer.length) return incomplete;
  const end = buffer.indexOf('\r\n', offset);
  if (end < 0) return incomplete;
  const type = String.fromCharCode(buffer[offset]);
  const value = buffer.toString('utf8', offset + 1, end);
  let next = end + 2;
  if (type === '-') return { value: new Error(value), next };
  if (type === '+') return { value, next };
  if (type === ':') return { value: Number(value), next };
  if (type === '$') {
    const size = Number(value);
    if (size === -1) return { value: null, next };
    if (buffer.length < next + size + 2) return incomplete;
    return { value: buffer.toString('utf8', next, next + size), next: next + size + 2 };
  }
  if (type === '*') {
    if (Number(value) === -1) return { value: null, next };
    const array = [];
    for (let i = 0; i < Number(value); i++) {
      const item = parse(buffer, next);
      if (item === incomplete) return incomplete;
      array.push(item.value); next = item.next;
    }
    return { value: array, next };
  }
  throw Error('Invalid RESP response');
}

function encode(parts) {
  return Buffer.concat([Buffer.from(`*${parts.length}\r\n`), ...parts.flatMap(value => {
    const bytes = Buffer.from(String(value));
    return [Buffer.from(`$${bytes.length}\r\n`), bytes, Buffer.from('\r\n')];
  })]);
}

export function testRedis(url) {
  const endpoint = new URL(url);
  const prefix = `test:mascotes:${randomUUID()}:`;
  const used = new Set();
  const keyFor = key => { const name = prefix + key; used.add(name); return name; };
  const command = parts => new Promise((resolve, reject) => {
    const socket = endpoint.protocol === 'rediss:'
      ? tls.connect({ host: endpoint.hostname, port: Number(endpoint.port || 6379), servername: endpoint.hostname })
      : net.connect({ host: endpoint.hostname, port: Number(endpoint.port || 6379) });
    const commands = [];
    if (endpoint.password) commands.push(endpoint.username
      ? ['AUTH', decodeURIComponent(endpoint.username), decodeURIComponent(endpoint.password)]
      : ['AUTH', decodeURIComponent(endpoint.password)]);
    if (endpoint.pathname.slice(1)) commands.push(['SELECT', endpoint.pathname.slice(1)]);
    commands.push(parts);
    let count = 0, buffer = Buffer.alloc(0);
    socket.setTimeout(5000, () => socket.destroy(Error('Redis test timeout')));
    socket.once('error', reject);
    socket.once(endpoint.protocol === 'rediss:' ? 'secureConnect' : 'connect', () => socket.write(Buffer.concat(commands.map(encode))));
    socket.on('data', bytes => {
      buffer = Buffer.concat([buffer, bytes]);
      while (true) {
        const parsed = parse(buffer);
        if (parsed === incomplete) break;
        buffer = buffer.subarray(parsed.next);
        if (parsed.value instanceof Error) { socket.destroy(); reject(parsed.value); return; }
        if (++count === commands.length) { socket.end(); resolve(parsed.value); return; }
      }
    });
  });
  return {
    async eval(script, keys, args) { return command(['EVAL', script, keys.length, ...keys.map(keyFor), ...args]); },
    async hgetall(key) {
      const entries = await command(['HGETALL', keyFor(key)]);
      return Object.fromEntries(Array.from({ length: entries.length / 2 }, (_, i) => [entries[i * 2], JSON.parse(entries[i * 2 + 1])]));
    },
    async hget(key, field) { const value = await command(['HGET', keyFor(key), field]); return value ? JSON.parse(value) : null; },
    async hset(key, field, value) { return command(['HSET', keyFor(key), field, JSON.stringify(value)]); },
    async get(key) { const value = await command(['GET', keyFor(key)]); return value ? JSON.parse(value) : null; },
    async set(key, value) { return command(['SET', keyFor(key), JSON.stringify(value)]); },
    async cleanup() { if (used.size) await command(['DEL', ...used]); },
  };
}
