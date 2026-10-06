import { useEffect, useState } from 'react';
import { useApp } from '../context';
import { totalTurns, turnsPerRound } from '../game';

function useInstall() {
  const [evt, setEvt] = useState(null);
  const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone);
  useEffect(() => {
    const h = (e) => {
      e.preventDefault();
      setEvt(e);
    };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);
  return { standalone, canPrompt: !!evt, prompt: () => evt?.prompt().finally(() => setEvt(null)) };
}

export default function Home({ current, onResume, onNew, onHistory, onSettings }) {
  const { settings, setSettings, games, nameOf } = useApp();
  const install = useInstall();
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <>
      <div className="topbar">
        <h1>Grok Score</h1>
        <button className="icon-btn" aria-label="Toggle theme" onClick={() => setSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' })}>
          {settings.theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button className="icon-btn" aria-label="Settings" onClick={onSettings}>⚙️</button>
      </div>

      <div className="hero">
        <div className="emoji">🦴🗿🦴</div>
        <h2>Poetry for Neanderthals</h2>
        <div className="muted small">Scoreboard · Turns · Hourglass</div>
      </div>

      {current && (
        <div className="notice">
          <div className="label" style={{ color: 'var(--gold)' }}>Game in progress</div>
          <div className="small">
            {current.mode === 'three'
              ? current.playerIds.map((id) => nameOf(id)).join(' · ')
              : current.teams.map((t) => t.name).join(' vs ')}
          </div>
          <div className="muted small">
            Round {Math.floor(current.turn / turnsPerRound(current)) + 1} of {current.rounds} · turn {current.turn + 1} of {totalTurns(current)}
          </div>
          <button className="btn btn-gold" onClick={onResume}>▶ Resume game</button>
        </div>
      )}

      <button className={`btn btn-big ${current ? '' : 'btn-gold'}`} onClick={onNew}>🦴 New game</button>
      <button className="btn btn-big" onClick={onHistory}>📜 Past games {games.length ? `(${games.length})` : ''}</button>

      {!install.standalone && (install.canPrompt || isIOS) && (
        <div className="card">
          <div className="label">Install</div>
          {install.canPrompt ? (
            <button className="btn" onClick={install.prompt}>📲 Add to home screen</button>
          ) : (
            <div className="small muted">On iPhone: tap Share, then “Add to Home Screen”. It then works offline like an app.</div>
          )}
        </div>
      )}
    </>
  );
}
