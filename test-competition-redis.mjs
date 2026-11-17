import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COMPETITION_KEYS as keys, decodeRecord } from './api/_competition-model.mjs';
import { competitionOperation, GUIDANCE_KEY } from './api/_competition-store.mjs';
import { testRedis } from './test-redis-client.mjs';

const submit = (db, phone, score) => competitionOperation(db, 'submit', { phone, nickname: phone, score });

test('integração: script Lua real em Redis isolado', {
  skip: !process.env.REDIS_TEST_URL && 'Defina REDIS_TEST_URL=redis://127.0.0.1:6379 para executar a integração real',
}, async t => {
  const scenario = async (name, run) => t.test(name, async () => {
    const db = testRedis(process.env.REDIS_TEST_URL);
    try { await run(db); } finally { await db.cleanup(); }
  });
  await scenario('um milhão não vence; atingir exatamente um bilhão encerra', async db => {
    assert.equal((await submit(db, 'Ana', 1000000)).state.status, 'open');
    assert.equal((await submit(db, 'Ana', 999999999)).state.status, 'open');
    const { state } = await submit(db, 'Ana', 1000000000);
    assert.equal(state.winner.score, 1000000000);
    assert.equal(state.reason, 'target');
  });
  await scenario('ultrapassar a meta em uma jogada aceita até o maior inteiro seguro sem arredondar', async db => {
    const { state } = await submit(db, 'Ana', Number.MAX_SAFE_INTEGER);
    assert.equal(state.winner.score, Number.MAX_SAFE_INTEGER);
    assert.equal(decodeRecord(await db.hget(keys.generalRecords, 'Ana')).score, Number.MAX_SAFE_INTEGER);
  });
  await scenario('encerramento sem meta usa recorde, não o saldo mais recente; empates pela primeira confirmação', async db => {
    await submit(db, 'Ana', 800000000);
    await submit(db, 'Bia', 800000000);
    await submit(db, 'Ana', 5000);
    const before = await competitionOperation(db, 'snapshot');
    assert.equal(before.state.leader.nickname, 'Ana');
    const { state } = await competitionOperation(db, 'close');
    assert.equal(state.reason, 'organization');
    assert.equal(state.winner.nickname, 'Ana');
    assert.equal(state.winner.score, 800000000);
  });
  await scenario('atingir recorde empatado posteriormente não toma o desempate', async db => {
    await submit(db, 'Ana', 100);
    await submit(db, 'Bia', 800000000);
    await submit(db, 'Ana', 800000000);
    assert.equal((await competitionOperation(db, 'close')).state.winner.nickname, 'Bia');
  });
  await scenario('sem participantes encerra sem vencedor e não reabre', async db => {
    const first = await competitionOperation(db, 'close');
    assert.equal(first.state.winner, null);
    assert.deepEqual((await submit(db, 'Ana', 1250000000)).state, first.state);
    assert.deepEqual((await competitionOperation(db, 'close')).state, first.state);
  });
  await scenario('pontuação offline tardia atualiza geral e mantém resultado e recorde elegível congelados', async db => {
    await submit(db, 'Ana', 800000000);
    const first = (await competitionOperation(db, 'close')).state;
    const late = await submit(db, 'Ana', 1250000000);
    assert.deepEqual(late.state, first);
    assert.deepEqual(late.receipt, { confirmedScore: 1250000000, eligibleScore: 800000000,
      awardEligibility: 'closed', guidanceSeen: false });
  });
  await scenario('envios concorrentes e reenvios escolhem exatamente um vencedor imutável', async db => {
    const results = await Promise.all(Array.from({ length: 40 }, (_, i) => submit(db, `player-${i}`, 1000000000 + i)));
    const winners = new Set(results.map(result => result.state.winner.nickname));
    assert.equal(winners.size, 1);
    const frozen = (await competitionOperation(db, 'snapshot')).state;
    await Promise.all(Array.from({ length: 20 }, () => submit(db, frozen.winner.phone, frozen.winner.score)));
    assert.deepEqual((await competitionOperation(db, 'close')).state, frozen);
  });
  await scenario('máximo pessoal é atômico e reenvios não alteram a ordem de desempate', async db => {
    await Promise.all([900000000, 1, 800000000, 50, 700000000].map(score => submit(db, 'Ana', score)));
    const first = decodeRecord(await db.hget(keys.records, 'Ana'));
    assert.equal(first.score, 900000000);
    await submit(db, 'Ana', 900000000);
    assert.deepEqual(decodeRecord(await db.hget(keys.records, 'Ana')), first);
    assert.equal(decodeRecord(await db.hget(keys.generalRecords, 'Ana')).score, 900000000);
  });
  await scenario('encerramento concorrente com pontuação e reenvios de encerramento mantêm um único resultado', async db => {
    await submit(db, 'Ana', 100);
    const results = await Promise.all([submit(db, 'Bia', 1250000000), competitionOperation(db, 'close')]);
    const frozen = results[1].state;
    assert.equal(frozen.status, 'closed');
    assert.ok(['Ana', 'Bia'].includes(frozen.winner.nickname));
    await Promise.all(Array.from({ length: 20 }, () => competitionOperation(db, 'close')));
    assert.deepEqual((await competitionOperation(db, 'snapshot')).state, frozen);
  });
  await scenario('migração mantém prêmio legado e inclui recordes já confirmados sem exigir outro login', async db => {
    const legacy = { nickname: 'Antigo', phone: 'private', score: 1000000 };
    await db.set(keys.legacyPrize, legacy);
    await db.hset(keys.generalRecords, 'Ana', { nickname: 'Ana', score: 900000000, lastSeen: 1 });
    assert.equal((await competitionOperation(db, 'snapshot')).state.winner, null);
    assert.equal((await competitionOperation(db, 'close')).state.winner.score, 900000000);
    assert.deepEqual(await db.get(keys.legacyPrize), legacy);
    assert.equal((await db.hget(keys.generalRecords, 'Ana')).score, 900000000);
  });
  await scenario('migração desempata registros antigos pelo horário disponível e identificador estável', async db => {
    await db.hset(keys.generalRecords, 'Bia', { nickname: 'Bia', score: 900000000, updatedAt: 200 });
    await db.hset(keys.generalRecords, 'Ana', { nickname: 'Ana', score: 900000000, updatedAt: 100 });
    await db.hset(keys.generalRecords, 'Aline', { nickname: 'Aline', score: 900000000, updatedAt: 100 });
    assert.equal((await competitionOperation(db, 'close')).state.winner.nickname, 'Aline');
  });
  await scenario('recordes legados na meta não são apagados e elegem um único vencedor na migração', async db => {
    await db.hset(keys.generalRecords, 'Bia', { nickname: 'Bia', score: 1000000000, updatedAt: 200 });
    await db.hset(keys.generalRecords, 'Ana', { nickname: 'Ana', score: 1000000000, updatedAt: 100 });
    const result = await competitionOperation(db, 'snapshot');
    assert.equal(result.state.winner.nickname, 'Ana');
    assert.equal(result.state.reason, 'target');
    assert.equal((await submit(db, 'Outra', 1250000000)).state.winner.nickname, 'Ana');
  });
  await scenario('confirmação das orientações é idempotente, por conta, inclusive após encerramento', async db => {
    await competitionOperation(db, 'close');
    const send = () => competitionOperation(db, 'submit', { phone: 'Ana', nickname: 'Ana', score: 5000, guidanceSeen: true });
    await Promise.all([send(), send(), send()]);
    assert.ok(await db.hget(GUIDANCE_KEY, 'Ana'));
    assert.equal((await submit(db, 'Bia', 5000)).receipt.guidanceSeen, false);
  });
});
