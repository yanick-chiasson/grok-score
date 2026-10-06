import { useApp } from '../context';
import { color } from '../colors';
import * as G from '../game';

const MEDALS = ['🥇', '🥈', '🥉'];
const fmt = (v) => (v > 0 ? `+${v}` : v === 0 ? '—' : String(v));
const cls = (v) => (v > 0 ? 'pos' : v < 0 ? 'neg' : 'zero');

export function entityView(game, nameOf, colorOf, theme) {
  if (game.mode === 'three') return game.playerIds.map((id) => ({ key: id, name: nameOf(id, game), color: colorOf(id), members: null }));
  return game.teams.map((t, i) => ({ key: t.id, name: t.name, color: color(i, theme), members: t.playerIds.map((id) => nameOf(id, game)).join(', ') }));
}

export default function Results({ game, onHome, onNew, onDelete, fresh }) {
  const { nameOf, colorOf, settings } = useApp();
  const totals = G.totals(game);
  const matrix = G.scoreMatrix(game);
  const ents = entityView(game, nameOf, colorOf, settings.theme);
  const ranked = [...ents].sort((a, b) => totals[b.key] - totals[a.key]);
  const top = totals[ranked[0]?.key];
  const allZero = Object.values(totals).every((v) => v === 0);
  const winners = ranked.filter((e) => totals[e.key] === top);
  const date = new Date(game.endedAt ?? game.startedAt);

  // Medal by distinct score so ties share a place.
  const distinct = [...new Set(ranked.map((e) => totals[e.key]))];

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={onHome} aria-label="Back">←</button>
        <h1>{fresh ? 'Game over' : 'Past game'}</h1>
      </div>

      <div className="hero" style={{ paddingTop: 4 }}>
        <div className="emoji">🏆</div>
        <h2>{allZero ? 'No points scored' : winners.length > 1 ? 'Grok declare tie' : `${winners[0].name} win`}</h2>
        <div className="muted small">
          {date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} ·{' '}
          {game.mode === 'three' ? '3 players' : `${game.teams.length} teams`} · {game.rounds} round{game.rounds > 1 ? 's' : ''}
          {game.endedEarly ? ' · ended early' : ''}
        </div>
      </div>

      <div className="stack">
        {ranked.map((e) => {
          const place = distinct.indexOf(totals[e.key]);
          const first = place === 0 && !allZero;
          return (
            <div key={e.key} className="podium-row" style={{ borderColor: first ? e.color : undefined }}>
              <div className="row grow">
                <span style={{ fontSize: 22 }}>{MEDALS[place] ?? `#${place + 1}`}</span>
                <div className="grow">
                  <div className="pn" style={{ color: e.color }}>{e.name}</div>
                  {e.members && <div className="small muted">{e.members}</div>}
                </div>
              </div>
              <div className="pv" style={{ color: first ? e.color : undefined }}>{totals[e.key]}</div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="label">Points by round</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{game.mode === 'three' ? 'Player' : 'Team'}</th>
                {Array.from({ length: game.rounds }).map((_, i) => <th key={i}>R{i + 1}</th>)}
                <th style={{ color: 'var(--gold)' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {ents.map((e) => (
                <tr key={e.key}>
                  <td style={{ color: e.color, fontWeight: 700 }}>{e.name}</td>
                  {matrix[e.key].map((v, i) => <td key={i} className={cls(v)}>{fmt(v)}</td>)}
                  <td style={{ color: 'var(--gold)', fontWeight: 700 }}>{totals[e.key]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {onNew && <button className="btn btn-big btn-gold" onClick={onNew}>🔄 New game</button>}
      <button className="btn btn-big" onClick={onHome}>{fresh ? '🏠 Home' : '← Back to history'}</button>
      {onDelete && (
        <button className="btn btn-danger" onClick={() => window.confirm('Delete this game from history?') && onDelete()}>
          🗑 Delete this game
        </button>
      )}
    </>
  );
}
