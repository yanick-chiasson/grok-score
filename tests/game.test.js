import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../src/game.js';

const three = () => G.newThreeGame({ id: 'g1', playerIds: ['A', 'B', 'C'], rounds: 2 });

test('3-player round: clockwise pass then counterclockwise pass', () => {
  const g = three();
  const seq = [0, 1, 2, 3, 4, 5].map((t) => {
    const i = G.turnInfo(g, t);
    return `${i.poet}>${i.guesser}/${i.judge}/${i.dir}`;
  });
  assert.deepEqual(seq, ['A>B/C/CW', 'B>C/A/CW', 'C>A/B/CW', 'B>A/C/CCW', 'C>B/A/CCW', 'A>C/B/CCW']);
});

test('3-player round: each player poets 2, guesses 2, judges 2; judge never repeats back to back', () => {
  const g = three();
  const count = { poet: {}, guesser: {}, judge: {} };
  let prevJudge = null;
  for (let t = 0; t < G.totalTurns(g); t++) {
    const i = G.turnInfo(g, t);
    for (const r of ['poet', 'guesser', 'judge']) count[r][i[r]] = (count[r][i[r]] || 0) + 1;
    assert.notEqual(i.judge, prevJudge);
    prevJudge = i.judge;
  }
  for (const r of ['poet', 'guesser', 'judge']) assert.deepEqual(count[r], { A: 4, B: 4, C: 4 });
});

test('3-player round covers all 6 ordered pairs once', () => {
  const g = three();
  const pairs = new Set([0, 1, 2, 3, 4, 5].map((t) => { const i = G.turnInfo(g, t); return i.poet + i.guesser; }));
  assert.equal(pairs.size, 6);
});

test('3-player scoring credits poet and guesser, undo removes last', () => {
  let g = three();
  g = G.addEvent(g, 3); // A>B
  g = G.addEvent(g, -1);
  g = G.goToTurn(g, 1); // B>C
  g = G.addEvent(g, 1);
  assert.deepEqual(G.totals(g), { A: 2, B: 3, C: 1 });
  assert.equal(G.turnScore(g, 0), 2);
  g = G.undoEvent(g);
  assert.deepEqual(G.totals(g), { A: 2, B: 2, C: 0 });
  assert.deepEqual(G.leaders(g), ['A', 'B']);
});

test('rounds can be added any time but not removed below current or scored round', () => {
  let g = three(); // 2 rounds = 12 turns
  g = G.setRounds(g, 5);
  assert.equal(G.totalTurns(g), 30);
  g = G.goToTurn(g, 7); // round 2
  g = G.setRounds(g, 1);
  assert.equal(g.rounds, 2);
  g = G.setRounds(g, 4);
  g = G.goToTurn(g, 13); // round 3
  g = G.addEvent(g, 1);
  g = G.goToTurn(g, 2);
  g = G.setRounds(g, 1);
  assert.equal(g.rounds, 3, 'scored turn in round 3 keeps it');
});

test('score matrix sums per round', () => {
  let g = three();
  g = G.addEvent(g, 3);
  g = G.goToTurn(g, 8); // round 2, C>A
  g = G.addEvent(g, 1);
  const m = G.scoreMatrix(g);
  assert.deepEqual(m.A, [3, 1]);
  assert.deepEqual(m.B, [3, 0]);
  assert.deepEqual(m.C, [0, 1]);
});

const teams = (a, b) => [
  { id: 't1', name: 'Glad', playerIds: a },
  { id: 't2', name: 'Mad', playerIds: b },
];

test('teams: turns alternate teams, poet rotates within team', () => {
  const g = G.newTeamsGame({ id: 'x', teams: teams(['a1', 'a2'], ['b1', 'b2']), rounds: 2 });
  const seq = [0, 1, 2, 3].map((t) => G.turnInfo(g, t).poet);
  assert.deepEqual(seq, ['a1', 'b1', 'a2', 'b2']);
});

test('teams uneven: permanent judge excludes extras; double doubles rounds', () => {
  const tm = teams(['a1', 'a2', 'a3'], ['b1', 'b2']);
  assert.equal(G.defaultTeamRounds(tm, 'permanent_judge'), 2);
  assert.equal(G.defaultTeamRounds(tm, 'double'), 6);
  const g = G.newTeamsGame({ id: 'x', teams: tm, rounds: 3, unevenMode: 'permanent_judge' });
  assert.deepEqual(G.permanentJudges(g), ['a3']);
  assert.deepEqual([0, 2, 4].map((t) => G.turnInfo(g, t).poet), ['a1', 'a2', 'a1']);
  const d = G.newTeamsGame({ id: 'y', teams: tm, rounds: 6, unevenMode: 'double' });
  assert.deepEqual([1, 3, 5].map((t) => G.turnInfo(d, t).poet), ['b1', 'b2', 'b1']);
});

test('teams scoring and winners credit every team member', () => {
  let g = G.newTeamsGame({ id: 'x', teams: teams(['a1', 'a2'], ['b1', 'b2']), rounds: 2 });
  g = G.addEvent(g, 3);
  g = G.goToTurn(g, 1);
  g = G.addEvent(g, 1);
  assert.deepEqual(G.totals(g), { t1: 3, t2: 1 });
  assert.deepEqual(G.winningPlayerIds(g), ['a1', 'a2']);
  assert.equal(G.playerPoints(g, 'a2'), 3);
});

test('finish early trims unplayed rounds and snapshots names; stats count wins', () => {
  let g = three();
  g = G.setRounds(g, 4);
  g = G.goToTurn(g, 2);
  g = G.addEvent(g, 3); // C>A
  const done = G.finishGame(g, (id) => `Name ${id}`, true);
  assert.equal(done.rounds, 1);
  assert.equal(done.names.A, 'Name A');
  const s = G.playerStats([done], 'A');
  assert.deepEqual(s, { games: 1, wins: 1, winRate: 100, best: 3 });
  assert.deepEqual(G.playerStats([done], 'B'), { games: 1, wins: 0, winRate: 0, best: 0 });
});

test('no winner credited when nobody scored', () => {
  const g = three();
  assert.deepEqual(G.winningPlayerIds(g), []);
});
