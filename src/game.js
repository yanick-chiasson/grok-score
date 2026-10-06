// Pure game logic. No React, no storage. Tested in tests/game.test.js.

// 3-player turn order for one round (6 turns).
// Clockwise pass first (A→B, B→C, C→A), then counterclockwise (B→A, C→B, A→C).
// The judge changes every turn, so nobody sits out twice in a row.
// Each entry is [poet, guesser, judge] as indexes into the chosen player order.
export const THREE_ORDER = [
  [0, 1, 2],
  [1, 2, 0],
  [2, 0, 1],
  [1, 0, 2],
  [2, 1, 0],
  [0, 2, 1],
];

export const POINTS = { hard: 3, easy: 1, miss: -1 };

export function turnsPerRound(g) {
  return g.mode === 'three' ? 6 : g.teams.length;
}

export function totalTurns(g) {
  return g.rounds * turnsPerRound(g);
}

export function teamSizes(teams) {
  return teams.map((t) => t.playerIds.length);
}

export function isUneven(teams) {
  const s = teamSizes(teams);
  return s.some((n) => n !== s[0]);
}

// Players on a team who take turns as Poet.
// Permanent judge mode: only the first (smallest team size) players poet; the extras judge all game.
export function poetPool(g, team) {
  if (g.unevenMode === 'permanent_judge') {
    const min = Math.min(...teamSizes(g.teams));
    return team.playerIds.slice(0, min);
  }
  return team.playerIds;
}

export function permanentJudges(g) {
  if (g.mode !== 'teams' || g.unevenMode !== 'permanent_judge') return [];
  const min = Math.min(...teamSizes(g.teams));
  return g.teams.flatMap((t) => t.playerIds.slice(min));
}

// Suggested number of rounds for a teams game.
export function defaultTeamRounds(teams, unevenMode) {
  const sizes = teamSizes(teams);
  const max = Math.max(...sizes);
  const min = Math.min(...sizes);
  if (!isUneven(teams)) return max;
  if (unevenMode === 'permanent_judge') return min;
  if (unevenMode === 'double') return max * 2;
  return max;
}

export function turnInfo(g, t) {
  const per = turnsPerRound(g);
  const round = Math.floor(t / per);
  const slot = t % per;
  if (g.mode === 'three') {
    const [p, gu, j] = THREE_ORDER[slot];
    return {
      round,
      slot,
      dir: slot < 3 ? 'CW' : 'CCW',
      poet: g.playerIds[p],
      guesser: g.playerIds[gu],
      judge: g.playerIds[j],
      scoreKeys: [g.playerIds[p], g.playerIds[gu]],
    };
  }
  const team = g.teams[slot];
  const pool = poetPool(g, team);
  const poet = pool.length ? pool[round % pool.length] : null;
  return { round, slot, teamIdx: slot, teamId: team.id, poet, scoreKeys: [team.id] };
}

// Score entities: players in 3-player mode, teams in teams mode.
export function entityKeys(g) {
  return g.mode === 'three' ? [...g.playerIds] : g.teams.map((t) => t.id);
}

// Scores are an append-only event log: { t: turnIndex, pts, keys: [...] }.
export function addEvent(g, pts) {
  const info = turnInfo(g, g.turn);
  return { ...g, events: [...g.events, { t: g.turn, pts, keys: info.scoreKeys }] };
}

export function undoEvent(g) {
  if (!g.events.length) return g;
  return { ...g, events: g.events.slice(0, -1) };
}

export function lastEventAtTurn(g) {
  const ev = g.events[g.events.length - 1];
  return ev ? ev.t : null;
}

export function turnScore(g, t = g.turn) {
  return g.events.filter((e) => e.t === t).reduce((a, e) => a + e.pts, 0);
}

// Per entity, per round.
export function scoreMatrix(g, rounds = g.rounds) {
  const per = turnsPerRound(g);
  const m = {};
  for (const k of entityKeys(g)) m[k] = Array(rounds).fill(0);
  for (const e of g.events) {
    const r = Math.floor(e.t / per);
    if (r >= rounds) continue;
    for (const k of e.keys) if (m[k]) m[k][r] += e.pts;
  }
  return m;
}

export function totals(g) {
  const out = {};
  for (const k of entityKeys(g)) out[k] = 0;
  for (const e of g.events) for (const k of e.keys) if (k in out) out[k] += e.pts;
  return out;
}

export function leaders(g) {
  const t = totals(g);
  const vals = Object.values(t);
  if (!vals.length) return [];
  const max = Math.max(...vals);
  return Object.keys(t).filter((k) => t[k] === max);
}

// Smallest number of rounds allowed right now: keeps the current turn and any scored turn.
export function minRounds(g) {
  const per = turnsPerRound(g);
  const lastT = g.events.reduce((m, e) => Math.max(m, e.t), -1);
  const needed = Math.max(g.turn, lastT);
  return Math.max(1, Math.floor(needed / per) + 1);
}

export function setRounds(g, rounds) {
  const r = Math.max(minRounds(g), Math.min(99, rounds));
  const lastTurn = r * turnsPerRound(g) - 1;
  return { ...g, rounds: r, maxTurn: Math.min(g.maxTurn ?? 0, lastTurn) };
}

export function goToTurn(g, t) {
  const clamped = Math.max(0, Math.min(totalTurns(g) - 1, t));
  return { ...g, turn: clamped, maxTurn: Math.max(g.maxTurn ?? 0, clamped) };
}

export function isLastTurn(g) {
  return g.turn >= totalTurns(g) - 1;
}

// Build a finished record for history. Ending early trims unplayed rounds.
export function finishGame(g, nameOf, early = false) {
  const per = turnsPerRound(g);
  const playedTurns = Math.max(g.turn, g.maxTurn ?? 0) + 1;
  const rounds = early ? Math.max(1, Math.ceil(playedTurns / per)) : g.rounds;
  const ids = allPlayerIds(g);
  const names = {};
  for (const id of ids) names[id] = nameOf(id);
  return { ...g, rounds, endedAt: Date.now(), endedEarly: early, names };
}

export function allPlayerIds(g) {
  return g.mode === 'three' ? [...g.playerIds] : g.teams.flatMap((t) => t.playerIds);
}

// Player ids credited with a win (ties share the win).
export function winningPlayerIds(g) {
  const top = leaders(g);
  const t = totals(g);
  if (!top.length || Object.values(t).every((v) => v === 0)) return [];
  if (g.mode === 'three') return top;
  return g.teams.filter((tm) => top.includes(tm.id)).flatMap((tm) => tm.playerIds);
}

// Points credited to a player for a game: own total (3-player) or their team's total.
export function playerPoints(g, id) {
  const t = totals(g);
  if (g.mode === 'three') return t[id] ?? 0;
  const team = g.teams.find((tm) => tm.playerIds.includes(id));
  return team ? t[team.id] ?? 0 : 0;
}

export function playerStats(games, id) {
  const played = games.filter((g) => allPlayerIds(g).includes(id));
  const wins = played.filter((g) => winningPlayerIds(g).includes(id)).length;
  const pts = played.map((g) => playerPoints(g, id));
  return {
    games: played.length,
    wins,
    winRate: played.length ? Math.round((wins / played.length) * 100) : 0,
    best: pts.length ? Math.max(...pts) : 0,
  };
}

export function newThreeGame({ id, playerIds, rounds }) {
  return { id, mode: 'three', startedAt: Date.now(), playerIds, rounds, turn: 0, maxTurn: 0, events: [] };
}

export function newTeamsGame({ id, teams, rounds, unevenMode }) {
  return {
    id,
    mode: 'teams',
    startedAt: Date.now(),
    teams,
    unevenMode: isUneven(teams) ? unevenMode : null,
    rounds,
    turn: 0,
    maxTurn: 0,
    events: [],
  };
}
