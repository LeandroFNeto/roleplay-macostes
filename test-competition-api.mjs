import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import * as model from './api/_competition-model.mjs';
import * as store from './api/_competition-store.mjs';

// Load the real HTTP handlers without opening a production Redis connection.
export function handlers(db) {
  const context = vm.createContext({
    ...model, ...store, redis: db, Buffer, process, randomBytes, scryptSync, timingSafeEqual,
    clean: (value, size) => String(value ?? '').replace(/[<>]/g, '').trim().slice(0, size),
    body: req => typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {},
    getSession: async req => req.session || null,
  });
  for (const name of ['ranking', 'competition']) {
    const code = fs.readFileSync(`api/${name}.mjs`, 'utf8')
      .replace(/^import .*\r?\n/gm, '').replace(/^export default .*;\r?$/gm, '')
      .replace(/^export function /gm, 'function ');
    vm.runInContext(code, context);
  }
  const ranking = context.createRankingHandler(db);
  const competition = context.createCompetitionHandler(db, () => 'test-organization-secret');
  return {
    request: (method, score, phone, nickname = 'Ana', extra = {}) => invoke(ranking, {
      method, headers: {}, body: { score, phone: 'forged-phone', nickname: 'Forged', ...extra },
      session: phone ? { phone, user: { nickname } } : null,
    }),
    close: (token = 'test-organization-secret', payload = { action: 'close' }) => invoke(competition, {
      method: 'POST', headers: { authorization: `Bearer ${token}` }, body: payload,
    }),
    context,
  };
}

export async function invoke(handler, req) {
  const res = { statusCode: 200, headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = JSON.parse(JSON.stringify(data)); return this; }, end() {},
  };
  await handler(req, res);
  return res;
}

test('API exige sessão e inteiros seguros sem impor uma pontuação para vitória', async () => {
  const calls = [];
  const db = {
    async eval(script, keys, args) {
      calls.push({ script, keys, args });
      return JSON.stringify({ state: model.createCompetition(1),
        general: { nickname: 'Ana', score: args[3] }, eligible: null, accepted: true });
    },
    async hgetall() { return {}; },
  };
  const api = handlers(db);
  assert.equal((await api.request('POST', 1000000000)).statusCode, 401);
  for (const score of ['1000000000', null, -1, 1.2, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal((await api.request('POST', score, '43999990000')).statusCode, 400);
  }
  assert.equal(calls.length, 0);
  for (const score of [1000000, 1000000000, 1250000000, Number.MAX_SAFE_INTEGER]) {
    const res = await api.request('POST', score, '43999990000', 'Ana');
    assert.equal(res.statusCode, 200);
    assert.equal(res.data.confirmedScore, score);
    assert.equal(res.data.competition.winner, null);
    assert.equal(res.data.competition.rule, 'ranking-at-close');
    assert.equal(res.data.competition.target, undefined);
    const call = calls.at(-1);
    assert.equal(call.script, store.COMPETITION_SCRIPT);
    assert.ok(call.keys.includes(model.COMPETITION_KEYS.state));
    assert.ok(call.keys.includes(model.COMPETITION_KEYS.generalRecords));
    assert.ok(!call.keys.includes(model.COMPETITION_KEYS.legacyPrize));
    assert.equal(call.args[1], '43999990000');
    assert.equal(call.args[2], 'Ana');
    assert.equal(call.args[3], String(score));
  }
  assert.equal(calls.length, 4, 'Um único EVAL por atualização de recorde e prêmio');
  assert.equal((await api.request('DELETE')).statusCode, 405);
});

test('encerramento exige segredo da organização e não é acessível pela sessão do jogador', async () => {
  let executions = 0;
  const api = handlers({ async eval() {
    executions++;
    return { state: { ...model.createCompetition(1), status: 'closed', reason: 'organization', closedAt: 2 } };
  } });
  for (const token of ['', 'player-session-token', 'wrong']) {
    assert.equal((await api.close(token)).statusCode, 403);
  }
  assert.equal(executions, 0);
  assert.equal((await api.close('test-organization-secret', { action: 'reopen' })).statusCode, 400);
  assert.equal((await api.close()).data.competition.status, 'closed');
  assert.equal(executions, 1);
  const unavailable = api.context.createCompetitionHandler({}, () => undefined);
  assert.equal((await invoke(unavailable, { method: 'POST', headers: {} })).statusCode, 503);
});

test('API pública usa allowlist para ranking, vencedor e competição', async () => {
  const privateRecord = { phone: '43999990000', token: 'private-token', nickname: 'Ana',
    score: '1250000000', achievedAt: 2, lastSeen: Date.now(), sector: 'Computação', icon: '🐗' };
  const state = { ...model.createCompetition(1), status: 'closed', reason: 'organization',
    winner: privateRecord, leader: privateRecord, closedAt: 2 };
  const api = handlers({ async eval() { return { state }; }, async hgetall() { return { '43999990000': privateRecord }; } });
  const response = await api.request('GET');
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.equal(response.data.players[0].score, 1250000000);
  assert.equal(JSON.stringify(response.data).includes('43999990000'), false);
  assert.equal(JSON.stringify(response.data).includes('private-token'), false);
  assert.deepEqual(Object.keys(response.data.competition.winner).sort(), ['achievedAt', 'nickname', 'score']);
});

test('falhas de Redis retornam indisponibilidade, sem anunciar vencedor', async () => {
  const api = handlers({ async eval() { throw Error('connection lost'); } });
  assert.equal((await api.request('GET')).statusCode, 503);
  const result = await api.request('POST', 1000000000, '43999990000');
  assert.equal(result.statusCode, 503);
  assert.equal(result.data.prizeWinner, undefined);
  assert.equal((await api.close()).statusCode, 503);
});

test('a ordem pública dos empates acompanha a sequência de confirmação usada para o prêmio', () => {
  const records = {
    A: { nickname: 'Ana', score: 5000, achievedAt: 100, lastSeen: 100 },
    B: { nickname: 'Bia', score: 5000, achievedAt: 100, lastSeen: 100 },
  };
  const eligible = {
    A: { ...records.A, sequence: 2 },
    B: { ...records.B, sequence: 1 },
  };
  const players = store.publicPlayers(records, 100, eligible);
  assert.deepEqual(players.map(player => player.nickname), ['Bia', 'Ana']);
  assert.equal(players[0].sequence, undefined);
});

test('login persiste orientações por conta no servidor e não força aviso para contas legadas', async () => {
  const hashes = new Map();
  const db = {
    async get() { return null; }, async set() {}, async del() {},
    async hget(key, field) { return hashes.get(key)?.[field] ?? null; },
    async hsetnx(key, field, value) {
      const hash = hashes.get(key) || {};
      if (hash[field] !== undefined) return 0;
      hash[field] = value; hashes.set(key, hash); return 1;
    }, async hdel(key, field) { delete hashes.get(key)?.[field]; },
  };
  const { context } = handlers(db);
  const source = fs.readFileSync('api/login.mjs', 'utf8').replace(/^import .*\r?\n/gm, '')
    .replace('export default async function handler', 'async function loginHandler');
  vm.runInContext(source + '\nthis.loginHandler = loginHandler;', context);
  const login = phone => invoke(context.loginHandler, { method: 'POST', body: { phone, pin: '1234', nickname: phone } });
  const first = await login('43999990000');
  assert.equal(first.data.guidanceRequired, true);
  await db.hsetnx(store.GUIDANCE_KEY, '43999990000', Date.now());
  assert.equal((await login('43999990000')).data.guidanceRequired, false);
  assert.equal((await login('43988880000')).data.guidanceRequired, true);
  delete hashes.get('users')['43988880000'].guidanceVersion;
  assert.equal((await login('43988880000')).data.guidanceRequired, false);
});
