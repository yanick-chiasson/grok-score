import { useState } from 'react';
import { useApp } from '../context';
import { color } from '../colors';
import TimerPanel from '../components/TimerPanel';
import { RenameSheet, Sheet } from '../components/Sheet';
import { Stepper } from './Setup';
import * as G from '../game';

export default function Game({ game, setGame, onEnd, onAbandon, onHome }) {
  const { nameOf, colorOf, renamePlayer, settings } = useApp();
  const [rename, setRename] = useState(null); // { kind: 'player'|'team', id }
  const [menu, setMenu] = useState(false);

  const per = G.turnsPerRound(game);
  const info = G.turnInfo(game, game.turn);
  const totals = G.totals(game);
  const lead = G.leaders(game);
  const anyScore = Object.values(totals).some((v) => v !== 0);
  const turnPts = G.turnScore(game);
  const last = G.isLastTurn(game);

  const score = (pts) => setGame((g) => G.addEvent(g, pts));
  const undo = () => setGame((g) => G.undoEvent(g));
  const prev = () => setGame((g) => G.goToTurn(g, g.turn - 1));
  const next = () => (last ? onEnd(false) : setGame((g) => G.goToTurn(g, g.turn + 1)));
  const setRounds = (r) => setGame((g) => G.setRounds(g, r));
  const minR = G.minRounds(game);

  const teamColor = (i) => color(i, settings.theme);
  const renameTeam = (id, name) => setGame((g) => ({ ...g, teams: g.teams.map((t) => (t.id === id ? { ...t, name } : t)) }));

  const Name = ({ id, c }) => (
    <span className="editable" style={{ color: c ?? colorOf(id) }} onClick={() => setRename({ kind: 'player', id })}>
      {nameOf(id)}
    </span>
  );

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={onHome} aria-label="Home">←</button>
        <h1>{game.mode === 'three' ? '3-player game' : 'Teams game'}</h1>
        <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Game menu">⋯</button>
      </div>

      <div className="game-head">
        <div>
          <div className="label">Round</div>
          <div className="big-num">
            {info.round + 1}
            <small> / {game.rounds}</small>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="label">Rounds</div>
          <Stepper value={game.rounds} min={minR} max={99} onChange={setRounds} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="label">Turn</div>
          <div className="big-num">
            {info.slot + 1}
            <small> / {per}</small>
          </div>
        </div>
      </div>

      <div className="segments">
        {Array.from({ length: per }).map((_, i) => (
          <i key={i} className={i < info.slot ? 'past' : i === info.slot ? 'now' : ''} />
        ))}
      </div>

      {game.mode === 'three' ? (
        <>
          <div className="badge">{info.dir === 'CW' ? '🔄 CLOCKWISE' : '🔁 COUNTERCLOCKWISE'}</div>
          <div className="roles">
            {[
              ['POET 🎤', info.poet, true],
              ['GUESSER 🤔', info.guesser, true],
              ['JUDGE 🪓', info.judge, false],
            ].map(([label, id, on]) => (
              <div key={label} className={`role ${on ? '' : 'off'}`} style={{ borderColor: on ? colorOf(id) : undefined }}>
                <div className="rl">{label}</div>
                <div className="rn"><Name id={id} c={on ? undefined : 'var(--text)'} /></div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="card" style={{ borderColor: teamColor(info.teamIdx), borderWidth: 2 }}>
          <div className="spread">
            <div>
              <div className="label">Team up</div>
              <div style={{ fontWeight: 700, fontSize: 18, color: teamColor(info.teamIdx) }} className="editable" onClick={() => setRename({ kind: 'team', id: info.teamId })}>
                {game.teams[info.teamIdx].name}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="label">Poet 🎤</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{info.poet ? <Name id={info.poet} /> : '—'}</div>
            </div>
          </div>
          <div className="small muted">
            {game.teams.filter((_, i) => i !== info.teamIdx).map((t) => t.name).join(', ')} hold{game.teams.length > 2 ? '' : 's'} the NO! Stick.
            {G.permanentJudges(game).length > 0 && <> Permanent judge: {G.permanentJudges(game).map((id) => nameOf(id)).join(', ')}.</>}
          </div>
        </div>
      )}

      <TimerPanel key={`${game.id}-${game.turn}`} />

      <div className="score-btns">
        <button className="s-hard" onClick={() => score(G.POINTS.hard)}><span>🏆</span><span>+3 hard</span></button>
        <button className="s-easy" onClick={() => score(G.POINTS.easy)}><span>✅</span><span>+1 easy</span></button>
        <button className="s-miss" onClick={() => score(G.POINTS.miss)}><span>❌</span><span>−1 miss</span></button>
      </div>

      <div className="spread small">
        <span className="muted">
          {game.mode === 'three' ? (
            <>Shared by <Name id={info.poet} /> + <Name id={info.guesser} /></>
          ) : (
            'This turn'
          )}
        </span>
        <span style={{ fontWeight: 700, fontSize: 18 }} className={turnPts > 0 ? 'pos' : turnPts < 0 ? 'neg' : 'zero'}>
          {turnPts > 0 ? '+' : ''}
          {turnPts}
        </span>
      </div>

      <div className="totals">
        {game.mode === 'three'
          ? game.playerIds.map((id) => {
              const isLead = anyScore && lead.includes(id);
              const now = info.scoreKeys.includes(id);
              return (
                <div key={id} className={`total ${isLead ? 'lead' : ''} ${now ? 'now' : ''}`} style={{ borderColor: now || isLead ? colorOf(id) : undefined }}>
                  <div className="tn"><Name id={id} /></div>
                  <div className="tv" style={{ color: isLead ? colorOf(id) : undefined }}>{totals[id]}</div>
                  <div style={{ fontSize: 11, height: 14 }}>{isLead ? '👑' : ''}</div>
                </div>
              );
            })
          : game.teams.map((t, i) => {
              const isLead = anyScore && lead.includes(t.id);
              const now = i === info.teamIdx;
              return (
                <div key={t.id} className={`total ${isLead ? 'lead' : ''} ${now ? 'now' : ''}`} style={{ borderColor: now || isLead ? teamColor(i) : undefined }}>
                  <div className="tn" style={{ color: teamColor(i) }}>{t.name}</div>
                  <div className="tv" style={{ color: isLead ? teamColor(i) : undefined }}>{totals[t.id]}</div>
                  <div style={{ fontSize: 11, height: 14 }}>{isLead ? '👑' : ''}</div>
                </div>
              );
            })}
      </div>

      <div className="nav">
        <button className="btn" onClick={prev} disabled={game.turn === 0}>◀ Prev</button>
        <button className="btn" onClick={undo} disabled={!game.events.length}>↩ Undo</button>
        <button className={`btn ${last ? '' : 'btn-gold'}`} style={last ? { background: 'var(--green)', color: '#fff', borderColor: 'transparent' } : undefined} onClick={next}>
          {last ? '🏁 Finish' : 'Next turn ▶'}
        </button>
      </div>

      {menu && (
        <Sheet onClose={() => setMenu(false)}>
          <div className="label">Game</div>
          <button className="btn" onClick={() => { setMenu(false); onEnd(true); }}>🏁 End now and save to history</button>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Quit this game without saving it?')) {
                setMenu(false);
                onAbandon();
              }
            }}
          >
            ✕ Quit without saving
          </button>
          <button className="btn btn-ghost" onClick={() => setMenu(false)}>Cancel</button>
        </Sheet>
      )}

      {rename?.kind === 'player' && (
        <RenameSheet title="Rename player (saved everywhere)" value={nameOf(rename.id)} onSave={(v) => renamePlayer(rename.id, v)} onClose={() => setRename(null)} />
      )}
      {rename?.kind === 'team' && (
        <RenameSheet title="Rename team" value={game.teams.find((t) => t.id === rename.id)?.name ?? ''} onSave={(v) => renameTeam(rename.id, v)} onClose={() => setRename(null)} />
      )}
    </>
  );
}
