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
  await scenario('qualquer pontuação mantém a competição aberta até a organização encerrar', async db => {
    for (const score of [1000000, 999999999, 1000000000, 1250000000, Number.MAX_SAFE_INTEGER]) {
      const { state } = await submit(db, 'Ana', score);
      assert.equal(state.status, 'open');
      assert.equal(state.winner, null);
      assert.equal(state.leader.score, score);
    }
  });
  await scenario('aceita até o maior inteiro seguro sem arredondar ou antecipar o resultado', async db => {
    const { state } = await submit(db, 'Ana', Number.MAX_SAFE_INTEGER);
    assert.equal(state.status, 'open');
    assert.equal(state.winner, null);
    assert.equal((await competitionOperation(db, 'close')).state.winner.score, Number.MAX_SAFE_INTEGER);
    assert.equal(decodeRecord(await db.hget(keys.generalRecords, 'Ana')).score, Number.MAX_SAFE_INTEGER);
  });
  await scenario('encerramento usa recorde, não o saldo mais recente; empates pela primeira confirmação', async db => {
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
    assert.ok(results.every(result => result.state.status === 'open' && result.state.winner === null));
    const frozen = (await competitionOperation(db, 'close')).state;
    assert.equal(frozen.winner.nickname, 'player-39');
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
  await scenario('recordes antigos elevados não encerram a competição durante a migração', async db => {
    await db.hset(keys.generalRecords, 'Bia', { nickname: 'Bia', score: 1500000000, updatedAt: 200 });
    await db.hset(keys.generalRecords, 'Ana', { nickname: 'Ana', score: 1000000000, updatedAt: 100 });
    const result = await competitionOperation(db, 'snapshot');
    assert.equal(result.state.status, 'open');
    assert.equal(result.state.winner, null);
    assert.equal(result.state.leader.nickname, 'Bia');
    assert.equal((await competitionOperation(db, 'close')).state.winner.nickname, 'Bia');
  });
  await scenario('resultado automático da versão anterior fica preservado e não fecha a nova competição', async db => {
    const record = { phone: 'Ana', nickname: 'Ana', score: '1000000000', achievedAt: 100, sequence: 1 };
    const previous = { version: 2, status: 'closed', reason: 'target', openedAt: 50,
      closedAt: 100, closeSequence: 1, winner: record, leader: record };
    await db.set(keys.previousState, previous);
    await db.hset(keys.previousRecords, 'Ana', record);
    await db.hset(keys.generalRecords, 'Ana', { ...record, score: 1000000000 });
    await db.hset(keys.generalRecords, 'Bia', { nickname: 'Bia', score: 1500000000, achievedAt: 200 });
    const { state } = await competitionOperation(db, 'snapshot');
    assert.equal(state.status, 'open');
    assert.equal(state.winner, null);
    assert.equal((await competitionOperation(db, 'close')).state.winner.nickname, 'Bia');
    assert.deepEqual(await db.get(keys.previousState), previous);
  });
  await scenario('migração respeita encerramento global já feito pela organização e exclui pontos tardios', async db => {
    const record = { phone: 'Ana', nickname: 'Ana', score: '800000000', achievedAt: 100, sequence: 7 };
    const previous = { version: 2, status: 'closed', reason: 'organization', openedAt: 50,
      closedAt: 200, closeSequence: 8, winner: record, leader: record };
    await db.set(keys.previousState, previous);
    await db.hset(keys.previousRecords, 'Ana', record);
    await db.hset(keys.generalRecords, 'Ana', { ...record, score: 1500000000 });
    const result = await submit(db, 'Ana', 2000000000);
    assert.equal(result.state.status, 'closed');
    assert.equal(result.state.winner.score, 800000000);
    assert.equal(result.state.closedAt, 200);
    assert.equal(result.receipt.eligibleScore, 800000000);
    assert.equal(result.receipt.confirmedScore, 2000000000);
    assert.deepEqual(await db.get(keys.previousState), previous);
  });
  await scenario('confirmação das orientações é idempotente, por conta, inclusive após encerramento', async db => {
    await competitionOperation(db, 'close');
    const send = () => competitionOperation(db, 'submit', { phone: 'Ana', nickname: 'Ana', score: 5000, guidanceSeen: true });
    await Promise.all([send(), send(), send()]);
    assert.ok(await db.hget(GUIDANCE_KEY, 'Ana'));
    assert.equal((await submit(db, 'Bia', 5000)).receipt.guidanceSeen, false);
  });
});
