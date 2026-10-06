import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context';
import { uid } from '../storage';
import { color } from '../colors';
import { THREE_ORDER, defaultTeamRounds, isUneven, newTeamsGame, newThreeGame } from '../game';

const TEAM_NAMES = ['Glad', 'Mad', 'Rock', 'Fire', 'Bone', 'Mammoth'];
const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const a = [...arr];
  [a[i], a[j]] = [a[j], a[i]];
  return a;
};

export default function Setup({ lastSetup, onStart, onBack }) {
  const { players, addPlayer, nameOf, colorOf, settings } = useApp();
  const active = players.filter((p) => !p.archived);
  const activeIds = new Set(active.map((p) => p.id));
  const keep = (ids = []) => ids.filter((id) => activeIds.has(id));

  const [mode, setMode] = useState(lastSetup?.mode ?? 'three');
  const [order, setOrder] = useState(() => keep(lastSetup?.threeOrder).slice(0, 3));
  const [threeRounds, setThreeRounds] = useState(lastSetup?.threeRounds ?? 2);
  const [teams, setTeams] = useState(() =>
    lastSetup?.teams?.length
      ? lastSetup.teams.map((t) => ({ ...t, playerIds: keep(t.playerIds) }))
      : [0, 1].map((i) => ({ id: uid(), name: TEAM_NAMES[i], playerIds: [] })),
  );
  const [unevenMode, setUnevenMode] = useState(lastSetup?.unevenMode ?? null);
  const [teamRounds, setTeamRounds] = useState(null); // null = automatic
  const [newName, setNewName] = useState('');

  const uneven = mode === 'teams' && teams.every((t) => t.playerIds.length > 0) && isUneven(teams);
  const autoRounds = useMemo(() => (teams.every((t) => t.playerIds.length) ? defaultTeamRounds(teams, unevenMode) : 1), [teams, unevenMode]);
  const rounds = teamRounds ?? autoRounds;

  useEffect(() => {
    if (!uneven) setUnevenMode(null);
  }, [uneven]);

  const assigned = new Set(teams.flatMap((t) => t.playerIds));
  const bench = active.filter((p) => !assigned.has(p.id));

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    const p = addPlayer(name);
    if (mode === 'three' && order.length < 3) setOrder((o) => [...o, p.id]);
    setNewName('');
  };

  const toggleThree = (id) => setOrder((o) => (o.includes(id) ? o.filter((x) => x !== id) : o.length < 3 ? [...o, id] : o));

  const setTeamPlayers = (ti, fn) => {
    setTeams((ts) => ts.map((t, i) => (i === ti ? { ...t, playerIds: fn(t.playerIds) } : t)));
    setTeamRounds(null);
  };

  const setTeamCount = (n) => {
    setTeams((ts) => (n > ts.length ? [...ts, ...Array.from({ length: n - ts.length }, (_, k) => ({ id: uid(), name: TEAM_NAMES[ts.length + k] ?? `Team ${ts.length + k + 1}`, playerIds: [] }))] : ts.slice(0, n)));
    setTeamRounds(null);
  };

  const teamsReady = teams.every((t) => t.playerIds.length >= 2) && (!uneven || unevenMode);
  const ready = mode === 'three' ? order.length === 3 : teamsReady;

  const hint =
    mode === 'three'
      ? order.length < 3 && `Pick ${3 - order.length} more player${3 - order.length > 1 ? 's' : ''}`
      : !teams.every((t) => t.playerIds.length >= 2)
        ? 'Each team needs at least 2 players'
        : uneven && !unevenMode
          ? 'Choose how to handle uneven teams'
          : null;

  const start = () => {
    if (!ready) return;
    if (mode === 'three') {
      onStart(newThreeGame({ id: uid(), playerIds: order, rounds: threeRounds }), { mode, threeOrder: order, threeRounds, teams, unevenMode });
    } else {
      onStart(newTeamsGame({ id: uid(), teams, rounds, unevenMode }), { mode, threeOrder: order, threeRounds, teams, unevenMode });
    }
  };

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>
        <h1>New game</h1>
      </div>

      <div className="seg">
        <button className={mode === 'three' ? 'on' : ''} onClick={() => setMode('three')}>
          👣 3 players<small>Poet · Guesser · Judge</small>
        </button>
        <button className={mode === 'teams' ? 'on' : ''} onClick={() => setMode('teams')}>
          👥 Teams<small>2 to 6 teams</small>
        </button>
      </div>

      {mode === 'three' && (
        <>
          <div className="card">
            <div className="label">Pick 3 players</div>
            {active.length ? (
              <div className="chips">
                {active.map((p) => (
                  <button key={p.id} className={`chip ${order.includes(p.id) ? 'on' : ''}`} onClick={() => toggleThree(p.id)}>
                    <span className="dot" style={{ background: colorOf(p.id) }} />
                    {p.name}
                  </button>
                ))}
              </div>
            ) : (
              <div className="small muted">No players yet. Add them below; they are saved for next time.</div>
            )}
            <AddPlayer value={newName} onChange={setNewName} onAdd={add} />
          </div>

          {order.length > 0 && (
            <div className="card">
              <div className="label">Seating order (clockwise)</div>
              {order.map((id, i) => (
                <div key={id} className="list-row">
                  <span className="muted small" style={{ width: 16 }}>{'ABC'[i]}</span>
                  <span className="dot" style={{ background: colorOf(id) }} />
                  <span className="grow" style={{ fontWeight: 700 }}>{nameOf(id)}</span>
                  <button className="mini" onClick={() => setOrder((o) => move(o, i, -1))} disabled={i === 0} aria-label="Move up">▲</button>
                  <button className="mini" onClick={() => setOrder((o) => move(o, i, 1))} disabled={i === order.length - 1} aria-label="Move down">▼</button>
                  <button className="mini" onClick={() => setOrder((o) => o.filter((x) => x !== id))} aria-label="Remove">✕</button>
                </div>
              ))}
              {order.length === 3 && (
                <div className="small muted">
                  First turn: <b style={{ color: colorOf(order[THREE_ORDER[0][0]]) }}>{nameOf(order[0])}</b> poets to{' '}
                  <b style={{ color: colorOf(order[1]) }}>{nameOf(order[1])}</b>, {nameOf(order[2])} judges. Clockwise pass, then counterclockwise.
                </div>
              )}
            </div>
          )}

          <div className="card">
            <div className="spread">
              <div>
                <div className="label">Rounds</div>
                <div className="small muted">{threeRounds * 6} turns · about {Math.round((threeRounds * 6 * settings.timerSeconds) / 60 + threeRounds * 3)} min</div>
              </div>
              <Stepper value={threeRounds} min={1} max={20} onChange={setThreeRounds} />
            </div>
            <div className="small muted">1 round = 6 turns. Every pair plays both roles each round.</div>
          </div>
        </>
      )}

      {mode === 'teams' && (
        <>
          <div className="card">
            <div className="spread">
              <div className="label">Number of teams</div>
              <Stepper value={teams.length} min={2} max={6} onChange={setTeamCount} />
            </div>
          </div>

          {teams.map((t, ti) => (
            <div key={t.id} className="card" style={{ borderColor: color(ti, settings.theme) }}>
              <div className="row">
                <span className="dot" style={{ background: color(ti, settings.theme) }} />
                <input className="input" value={t.name} maxLength={20} onChange={(e) => setTeams((ts) => ts.map((x, i) => (i === ti ? { ...x, name: e.target.value } : x)))} />
              </div>
              {t.playerIds.length === 0 && <div className="small muted">Add players from the bench below.</div>}
              {t.playerIds.map((id, i) => (
                <div key={id} className="list-row">
                  <span className="muted small" style={{ width: 16 }}>{i + 1}</span>
                  <span className="dot" style={{ background: colorOf(id) }} />
                  <span className="grow" style={{ fontWeight: 700 }}>{nameOf(id)}</span>
                  <button className="mini" onClick={() => setTeamPlayers(ti, (ids) => move(ids, i, -1))} disabled={i === 0} aria-label="Move up">▲</button>
                  <button className="mini" onClick={() => setTeamPlayers(ti, (ids) => move(ids, i, 1))} disabled={i === t.playerIds.length - 1} aria-label="Move down">▼</button>
                  <button className="mini" onClick={() => setTeamPlayers(ti, (ids) => ids.filter((x) => x !== id))} aria-label="Remove">✕</button>
                </div>
              ))}
            </div>
          ))}

          <div className="card">
            <div className="label">Bench</div>
            {bench.length === 0 && <div className="small muted">{active.length ? 'Everyone is on a team.' : 'No players yet. Add them below.'}</div>}
            {bench.map((p) => (
              <div key={p.id} className="list-row">
                <span className="dot" style={{ background: colorOf(p.id) }} />
                <span className="grow" style={{ fontWeight: 700 }}>{p.name}</span>
                {teams.map((t, ti) => (
                  <button key={t.id} className="mini" style={{ borderColor: color(ti, settings.theme), color: color(ti, settings.theme), fontWeight: 700 }} onClick={() => setTeamPlayers(ti, (ids) => [...ids, p.id])} aria-label={`Add to ${t.name}`}>
                    +{ti + 1}
                  </button>
                ))}
              </div>
            ))}
            <AddPlayer value={newName} onChange={setNewName} onAdd={add} />
          </div>

          {uneven && (
            <div className="notice">
              <div className="label" style={{ color: 'var(--gold)' }}>Uneven teams</div>
              <div className="seg" style={{ flexDirection: 'column' }}>
                <button className={unevenMode === 'permanent_judge' ? 'on' : ''} onClick={() => { setUnevenMode('permanent_judge'); setTeamRounds(null); }}>
                  ⚖️ Permanent judge<small>Extra players at the bottom of a team judge all game. Equal poet turns.</small>
                </button>
                <button className={unevenMode === 'double' ? 'on' : ''} onClick={() => { setUnevenMode('double'); setTeamRounds(null); }}>
                  🔁 Everyone poets twice<small>Twice the rounds, so the turns balance out.</small>
                </button>
              </div>
            </div>
          )}

          <div className="card">
            <div className="spread">
              <div>
                <div className="label">Rounds</div>
                <div className="small muted">{teamRounds == null ? 'Auto: ' : ''}{rounds * teams.length} turns</div>
              </div>
              <Stepper value={rounds} min={1} max={30} onChange={setTeamRounds} />
            </div>
            <div className="small muted">1 round = each team takes one turn. Poets rotate in list order.</div>
          </div>
        </>
      )}

      {hint && <div className="small muted" style={{ textAlign: 'center' }}>{hint}</div>}
      <button className="btn btn-big btn-gold" disabled={!ready} onClick={start}>🦴 Start game</button>
    </>
  );
}

function AddPlayer({ value, onChange, onAdd }) {
  return (
    <div className="row">
      <input className="input" placeholder="New player name" value={value} maxLength={24} onChange={(e) => onChange(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onAdd()} />
      <button className="btn" onClick={onAdd} disabled={!value.trim()}>+ Add</button>
    </div>
  );
}

export function Stepper({ value, min, max, onChange }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease">−</button>
      <span>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase">+</button>
    </div>
  );
}
