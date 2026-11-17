// Modelo compartilhado pela migração e pelas operações atômicas da competição.
// Não abre uma competição automaticamente: a migração publica o estado inicial.
export const COMPETITION_TARGET = 1_000_000_000;
export const COMPETITION_KEYS = Object.freeze({
  state: 'competition:v2:state',
  records: 'competition:v2:records',
  sequence: 'competition:v2:sequence',
  migration: 'competition:v2:migration',
  generalRecords: 'ranking:players',
  legacyPrize: 'prize:first-million',
});

export function validateScore(score) {
  if (typeof score !== 'number' || !Number.isSafeInteger(score) || score < 0) {
    throw new TypeError('Pontuacao deve ser um inteiro nao negativo seguro.');
  }
  return score;
}

// Strings são um formato interno: Lua/cjson não deve arredondar o score.
// Na entrada HTTP, validateScore deve ser chamada antes de qualquer conversão.
export function storedScore(score) {
  if (typeof score === 'string') {
    if (!/^(0|[1-9][0-9]*)$/.test(score)) throw new TypeError('Pontuacao armazenada invalida.');
    return validateScore(Number(score));
  }
  return validateScore(score);
}

export function encodeRecord(record) {
  return JSON.stringify({ ...record, score: String(storedScore(record.score)) });
}

export function decodeRecord(value) {
  if (value === null || value === undefined) return null;
  const record = typeof value === 'string' ? JSON.parse(value) : value;
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new TypeError('Registro armazenado invalido.');
  }
  return { ...record, score: storedScore(record.score) };
}

export function createCompetition(openedAt) {
  if (!Number.isSafeInteger(openedAt) || openedAt < 0) throw new TypeError('Data invalida.');
  return {
    version: 2,
    status: 'open',
    target: COMPETITION_TARGET,
    openedAt,
    closedAt: null,
    closeSequence: null,
    reason: null,
    leader: null,
    winner: null,
  };
}

export function encodeCompetition(state) {
  return JSON.stringify({
    ...state,
    leader: state.leader ? { ...state.leader, score: String(storedScore(state.leader.score)) } : null,
    winner: state.winner ? { ...state.winner, score: String(storedScore(state.winner.score)) } : null,
  });
}

export function decodeCompetition(value) {
  if (value === null || value === undefined) throw new Error('Competicao ainda nao migrada.');
  const state = typeof value === 'string' ? JSON.parse(value) : value;
  if (!state || state.version !== 2 || !['open', 'closed'].includes(state.status)
      || state.target !== COMPETITION_TARGET) {
    throw new TypeError('Estado de competicao invalido.');
  }
  return { ...state, leader: decodeRecord(state.leader), winner: decodeRecord(state.winner) };
}

export function publicWinner(value) {
  const winner = decodeRecord(value);
  return winner ? {
    nickname: winner.nickname,
    score: winner.score,
    achievedAt: winner.achievedAt,
  } : null;
}

// Allowlist explícita: nenhum telefone, token, ID ou dado de migração é público.
export function publicCompetition(value) {
  const state = decodeCompetition(value);
  return {
    status: state.status,
    target: state.target,
    openedAt: state.openedAt,
    closedAt: state.closedAt,
    reason: state.reason,
    winner: publicWinner(state.winner),
  };
}

export function scoreReceipt(generalRecord, eligibleRecord, acceptedWhileOpen) {
  return {
    confirmedScore: decodeRecord(generalRecord).score,
    eligibleScore: decodeRecord(eligibleRecord)?.score ?? null,
    awardEligibility: acceptedWhileOpen ? 'eligible' : 'closed',
  };
}
