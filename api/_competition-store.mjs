import {
  COMPETITION_KEYS, createCompetition, encodeCompetition, decodeCompetition,
  decodeRecord, validateScore, scoreReceipt,
} from './_competition-model.mjs';

export const GUIDANCE_KEY = 'accounts:guidance-seen:v1';

// One EVAL serializes migration, personal maxima, tie order and closure.
// Scores are decimal strings in JSON: Redis cjson otherwise rounds large integers.
export const COMPETITION_SCRIPT = `
local stateKey, recordsKey, sequenceKey, migrationKey, generalKey, guidanceKey, previousStateKey, previousRecordsKey = unpack(KEYS)
local action, phone, nickname, scoreText, sector, icon, guidanceSeen = unpack(ARGV)
local clock = redis.call('TIME')
local now = tonumber(clock[1]) * 1000 + math.floor(tonumber(clock[2]) / 1000)
local rawState = redis.call('GET', stateKey)
local state
if rawState then
  state = cjson.decode(rawState)
else
  state = cjson.decode(ARGV[8])
  state.openedAt = now
  local previousStateRaw = redis.call('GET', previousStateKey)
  local previousState = previousStateRaw and cjson.decode(previousStateRaw) or nil
  -- An organization closure remains final. Previous automatic outcomes stay in history.
  local keepClosed = previousState and previousState.status == 'closed' and previousState.reason == 'organization'
  if keepClosed then
    local rule = state.rule
    state = previousState
    state.version, state.rule = 3, rule
    state.target = nil
  end
  -- Preserve every already-confirmed record as the initial eligible baseline.
  -- For a closed event, preserve the eligible snapshot instead of importing late records.
  local previous = redis.call('HGETALL', keepClosed and previousRecordsKey or generalKey)
  local baseline = {}
  local lastSequence = keepClosed and tonumber(state.closeSequence) or 0
  lastSequence = lastSequence or 0
  redis.call('SET', sequenceKey, 0)
  for i = 1, #previous, 2 do
    local record = cjson.decode(previous[i + 1])
    local score = tonumber(record.score)
    if score and score >= 0 and score <= 9007199254740991 and score == math.floor(score) then
      local metadata = record
      if not keepClosed then
        local oldRaw = redis.call('HGET', previousRecordsKey, previous[i])
        local old = oldRaw and cjson.decode(oldRaw) or nil
        if old and tonumber(old.score) == score then metadata = old end
      end
      baseline[#baseline + 1] = {phone=previous[i], nickname=record.nickname,
        score=string.format('%.0f', score), sector=record.sector, icon=record.icon,
        achievedAt=tonumber(metadata.achievedAt) or tonumber(record.updatedAt) or now,
        sequence=tonumber(metadata.sequence), origin='migration'}
    end
  end
  table.sort(baseline, function(a, b)
    if a.achievedAt == b.achievedAt then
      local aSequence, bSequence = a.sequence or 9007199254740991, b.sequence or 9007199254740991
      if aSequence ~= bSequence then return aSequence < bSequence end
      return a.phone < b.phone
    end
    return a.achievedAt < b.achievedAt
  end)
  for _, record in ipairs(baseline) do
    if keepClosed then
      record.sequence = record.sequence or (lastSequence + 1)
      lastSequence = math.max(lastSequence, record.sequence)
    else
      record.sequence = redis.call('INCR', sequenceKey)
    end
    redis.call('HSET', recordsKey, record.phone, cjson.encode(record))
    if not keepClosed and (state.leader == cjson.null or tonumber(record.score) > tonumber(state.leader.score)) then
      state.leader = record
    end
  end
  if keepClosed then redis.call('SET', sequenceKey, lastSequence) end
  redis.call('SET', stateKey, cjson.encode(state))
  redis.call('SET', migrationKey, cjson.encode({version=3, migratedAt=now,
    policy='ranking-at-close', importedRecords=#baseline, preservedClosure=keepClosed or false}))
end

local general, eligible
local accepted = false
if action == 'submit' then
  local rawGeneral = redis.call('HGET', generalKey, phone)
  general = rawGeneral and cjson.decode(rawGeneral) or {}
  local score = tonumber(scoreText)
  if not general.score or score > tonumber(general.score) then
    general.score = scoreText
    general.achievedAt = now
  else
    general.score = string.format('%.0f', tonumber(general.score))
  end
  general.nickname, general.sector, general.icon = nickname, sector, icon
  general.updatedAt, general.lastSeen = now, now
  redis.call('HSET', generalKey, phone, cjson.encode(general))

  local rawEligible = redis.call('HGET', recordsKey, phone)
  eligible = rawEligible and cjson.decode(rawEligible) or nil
  if state.status == 'open' then
    accepted = true
    if not eligible or tonumber(general.score) > tonumber(eligible.score) then
      eligible = {phone=phone, nickname=nickname, score=general.score, sector=sector,
        icon=icon, achievedAt=now, sequence=redis.call('INCR', sequenceKey)}
      redis.call('HSET', recordsKey, phone, cjson.encode(eligible))
      -- Equal scores retain the earlier server sequence, even in the same millisecond.
      if state.leader == cjson.null or tonumber(eligible.score) > tonumber(state.leader.score) then
        state.leader = eligible
      end
    end
  end
  if guidanceSeen == '1' then redis.call('HSETNX', guidanceKey, phone, now) end
elseif action == 'close' and state.status == 'open' then
  state.status, state.reason = 'closed', 'organization'
  state.closedAt, state.closeSequence = now, redis.call('INCR', sequenceKey)
  state.winner = state.leader
end
redis.call('SET', stateKey, cjson.encode(state))
return cjson.encode({state=state, general=general or cjson.null, eligible=eligible or cjson.null,
  accepted=accepted, guidanceSeen=(phone ~= '' and redis.call('HEXISTS', guidanceKey, phone) == 1)})
`;

export async function competitionOperation(redis, action, player = {}) {
  if (!['snapshot', 'submit', 'close'].includes(action)) throw new TypeError('Acao invalida.');
  if (action === 'submit') validateScore(player.score);
  const raw = await redis.eval(COMPETITION_SCRIPT, [
    COMPETITION_KEYS.state, COMPETITION_KEYS.records, COMPETITION_KEYS.sequence,
    COMPETITION_KEYS.migration, COMPETITION_KEYS.generalRecords, GUIDANCE_KEY,
    COMPETITION_KEYS.previousState, COMPETITION_KEYS.previousRecords,
  ], [action, player.phone || '', player.nickname || '', String(player.score ?? 0),
    player.sector || '', player.icon || '', player.guidanceSeen === true ? '1' : '0',
    encodeCompetition(createCompetition(0))]);
  const result = typeof raw === 'string' ? JSON.parse(raw) : raw;
  return {
    state: decodeCompetition(result.state),
    receipt: result.general ? {
      ...scoreReceipt(result.general, result.eligible, result.accepted),
      guidanceSeen: result.guidanceSeen,
    } : null,
  };
}

export function publicPlayers(records, now = Date.now(), eligibleRecords = {}) {
  return Object.entries(records || {}).map(([id, value]) => {
    const record = decodeRecord(value);
    const eligible = decodeRecord(eligibleRecords?.[id]);
    return {
      sequence: eligible?.score === record.score ? eligible.sequence : Number.MAX_SAFE_INTEGER,
      player: {
        nickname: record.nickname, score: record.score, sector: record.sector,
        icon: record.icon, updatedAt: record.updatedAt, achievedAt: record.achievedAt,
        online: now - record.lastSeen < 75000,
      },
    };
  }).sort((a, b) => b.player.score - a.player.score
    || (a.sequence ?? Number.MAX_SAFE_INTEGER) - (b.sequence ?? Number.MAX_SAFE_INTEGER)
    || (a.player.achievedAt || 0) - (b.player.achievedAt || 0)
    || a.player.nickname.localeCompare(b.player.nickname)).map(entry => entry.player);
}
