import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMPETITION_KEYS, COMPETITION_TARGET, createCompetition, validateScore,
  encodeRecord, decodeRecord, encodeCompetition, decodeCompetition,
  publicCompetition, publicWinner, scoreReceipt,
} from './api/_competition-model.mjs';

const privateRecord = (score = 800_000_000) => ({
  phone: '43999990000', id: 'private-id', token: 'private-token',
  nickname: 'Jogador', score, sector: 'computacao', achievedAt: 123,
  sequence: 1, origin: 'migration',
});

test('estado inicial aberto não depende do vencedor legado', () => {
  assert.notEqual(COMPETITION_KEYS.state, COMPETITION_KEYS.legacyPrize);
  assert.notEqual(COMPETITION_KEYS.records, COMPETITION_KEYS.generalRecords);
  const state = createCompetition(100);
  assert.deepEqual(publicCompetition(state), {
    status: 'open', target: COMPETITION_TARGET, openedAt: 100,
    closedAt: null, reason: null, winner: null,
  });
  assert.deepEqual(decodeCompetition(encodeCompetition(state)), state);
  assert.throws(() => decodeCompetition(null), /nao migrada/);
});

test('resultado fechado expõe somente os campos públicos do vencedor', () => {
  for (const reason of ['target', 'organization']) {
    const winner = privateRecord(reason === 'target' ? 1_250_000_000 : 800_000_000);
    const state = { ...createCompetition(100), status: 'closed', closedAt: 200,
      closeSequence: 2, reason, leader: winner, winner, adminToken: 'segredo' };
    const result = publicCompetition(encodeCompetition(state));
    assert.deepEqual(result, {
      status: 'closed', target: COMPETITION_TARGET, openedAt: 100,
      closedAt: 200, reason,
      winner: { nickname: 'Jogador', score: winner.score, achievedAt: 123 },
    });
    assert.equal(JSON.stringify(result).includes('private'), false);
    assert.equal(JSON.stringify(result).includes('43999990000'), false);
    assert.equal(JSON.stringify(result).includes('segredo'), false);
    assert.equal(state.winner, winner);
  }
});

test('competição pode encerrar sem participantes e sem vencedor', () => {
  const state = { ...createCompetition(100), status: 'closed',
    closedAt: 200, closeSequence: 1, reason: 'organization' };
  assert.equal(publicCompetition(state).winner, null);
  assert.equal(publicCompetition(state).status, 'closed');
  assert.equal(publicWinner(null), null);
});

test('scores inteiros sobrevivem à serialização exata e à leitura legada', () => {
  for (const score of [0, 1_000_000, COMPETITION_TARGET, 1_250_000_000,
    Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER]) {
    const record = privateRecord(score);
    const encoded = encodeRecord(record);
    assert.equal(JSON.parse(encoded).score, String(score));
    assert.equal(decodeRecord(encoded).score, score);
    assert.equal(decodeRecord(JSON.stringify(record)).score, score);
    assert.equal(decodeRecord(record).score, score);
    const state = { ...createCompetition(100), leader: record, winner: record };
    assert.equal(decodeCompetition(encodeCompetition(state)).winner.score, score);
    assert.equal(publicWinner(encoded).score, score);
    assert.equal(record.score, score);
  }
});

test('entrada HTTP não aceita coerção, frações ou inteiros inseguros', () => {
  for (const score of ['1000000000', null, undefined, true, -1, 1.5,
    NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validateScore(score), TypeError);
  }
  for (const score of ['', '01', '1e9', '-1', '1.5', '9007199254740992']) {
    assert.throws(() => decodeRecord({ score }), TypeError);
  }
});

test('recibo tardio separa recorde geral do retrato elegível congelado', () => {
  const eligible = Object.freeze(privateRecord(800_000_000));
  const general = Object.freeze(privateRecord(1_250_000_000));
  assert.deepEqual(scoreReceipt(general, eligible, false), {
    confirmedScore: 1_250_000_000, eligibleScore: 800_000_000,
    awardEligibility: 'closed',
  });
  assert.equal(eligible.score, 800_000_000);
  assert.deepEqual(scoreReceipt(general, null, false), {
    confirmedScore: 1_250_000_000, eligibleScore: null, awardEligibility: 'closed',
  });
  assert.equal(scoreReceipt(eligible, eligible, true).awardEligibility, 'eligible');
});
