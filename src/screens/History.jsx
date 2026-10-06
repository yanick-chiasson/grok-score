import { useState } from 'react';
import { useApp } from '../context';
import * as G from '../game';
import { entityView } from './Results';

export default function History({ onBack, onOpen }) {
  const { games, players, nameOf, colorOf, settings } = useApp();
  const [tab, setTab] = useState('games');

  const ids = [...new Set(games.flatMap((g) => G.allPlayerIds(g)))];
  const board = ids
    .map((id) => ({ id, name: players.find((p) => p.id === id)?.name ?? games.find((g) => g.names?.[id])?.names[id] ?? 'Unknown', ...G.playerStats(games, id) }))
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || b.best - a.best);

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>
        <h1>Past games</h1>
      </div>

      <div className="seg">
        <button className={tab === 'games' ? 'on' : ''} onClick={() => setTab('games')}>📜 Games</button>
        <button className={tab === 'board' ? 'on' : ''} onClick={() => setTab('board')}>👑 Leaderboard</button>
      </div>

      {games.length === 0 && <div className="card small muted">No finished games yet. Finished games show up here automatically.</div>}

      {tab === 'games' &&
        games.map((g) => {
          const t = G.totals(g);
          const ents = entityView(g, nameOf, colorOf, settings.theme).sort((a, b) => t[b.key] - t[a.key]);
          const d = new Date(g.endedAt ?? g.startedAt);
          return (
            <button key={g.id} className="card" style={{ textAlign: 'left' }} onClick={() => onOpen(g.id)}>
              <div className="spread">
                <span className="label">
                  {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {g.mode === 'three' ? '3 players' : 'Teams'}
                </span>
                <span className="muted small">›</span>
              </div>
              <div className="row" style={{ flexWrap: 'wrap', gap: 12 }}>
                {ents.map((e, i) => (
                  <span key={e.key} style={{ fontWeight: 700 }}>
                    {i === 0 && t[e.key] !== 0 ? '👑 ' : ''}
                    <span style={{ color: e.color }}>{e.name}</span> <span className="muted">{t[e.key]}</span>
                  </span>
                ))}
              </div>
            </button>
          );
        })}

      {tab === 'board' && board.length > 0 && (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Player</th><th>Games</th><th>Wins</th><th>Win %</th><th>Best</th></tr>
              </thead>
              <tbody>
                {board.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, color: colorOf(r.id) }}>{r.name}</td>
                    <td>{r.games}</td>
                    <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{r.wins}</td>
                    <td>{r.winRate}%</td>
                    <td>{r.best}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="small muted">Team wins count for every player on the team. Best = highest score in one game (team score for team games).</div>
        </div>
      )}
    </>
  );
}
