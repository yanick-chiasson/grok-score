import { useRef, useState } from 'react';
import { useApp } from '../context';
import { PALETTE_SIZE } from '../colors';
import { exportAll, save, KEYS } from '../storage';
import { allPlayerIds } from '../game';
import { RenameSheet } from '../components/Sheet';

export default function Settings({ onBack }) {
  const { settings, setSettings, players, setPlayers, games, addPlayer, renamePlayer, colorOf } = useApp();
  const [newName, setNewName] = useState('');
  const [renaming, setRenaming] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const fileRef = useRef(null);

  const set = (patch) => setSettings({ ...settings, ...patch });
  const used = new Set(games.flatMap((g) => allPlayerIds(g)));
  const visible = players.filter((p) => showArchived || !p.archived);
  const archivedCount = players.filter((p) => p.archived).length;

  const update = (id, patch) => setPlayers((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const remove = (p) => {
    if (used.has(p.id)) {
      if (window.confirm(`${p.name} is in past games. Hide them from new games? Their history stays.`)) update(p.id, { archived: true });
    } else if (window.confirm(`Delete ${p.name}?`)) {
      setPlayers((list) => list.filter((x) => x.id !== p.id));
    }
  };

  const add = () => {
    if (!newName.trim()) return;
    addPlayer(newName);
    setNewName('');
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(exportAll(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `grok-score-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const restore = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      if (data.app !== 'grok-score') throw new Error('Not a Grok Score backup');
      if (!window.confirm('Replace all players, settings and history on this device with the backup?')) return;
      for (const k of KEYS) if (k in data) save(k, data[k]);
      window.location.reload();
    } catch (e) {
      window.alert(`Could not restore: ${e.message}`);
    }
  };

  const wipe = () => {
    if (!window.confirm('Erase all players, history and settings on this device? This cannot be undone.')) return;
    for (const k of KEYS) localStorage.removeItem(`grok.${k}`);
    window.location.reload();
  };

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" onClick={onBack} aria-label="Back">←</button>
        <h1>Settings</h1>
      </div>

      <div className="card">
        <div className="label">Appearance</div>
        <div className="seg">
          <button className={settings.theme === 'dark' ? 'on' : ''} onClick={() => set({ theme: 'dark' })}>🌙 Dark</button>
          <button className={settings.theme === 'light' ? 'on' : ''} onClick={() => set({ theme: 'light' })}>☀️ Light</button>
        </div>
      </div>

      <div className="card">
        <div className="label">Hourglass</div>
        <div className="spread">
          <span>Seconds per turn</span>
          <div className="stepper">
            <button onClick={() => set({ timerSeconds: Math.max(15, settings.timerSeconds - 15) })} aria-label="Less time">−</button>
            <span>{settings.timerSeconds}</span>
            <button onClick={() => set({ timerSeconds: Math.min(300, settings.timerSeconds + 15) })} aria-label="More time">+</button>
          </div>
        </div>
        {settings.timerSeconds !== 90 && (
          <button className="btn btn-ghost" onClick={() => set({ timerSeconds: 90 })}>Reset to official 90 seconds</button>
        )}
        <Toggle label="Beep when time is up" on={settings.sound} onChange={(v) => set({ sound: v })} />
        <Toggle label="Vibrate when time is up" on={settings.vibrate} onChange={(v) => set({ vibrate: v })} />
        <Toggle label="Keep screen awake while running" on={settings.wakeLock} onChange={(v) => set({ wakeLock: v })} />
      </div>

      <div className="card">
        <div className="spread">
          <div className="label">Players ({players.length - archivedCount})</div>
          {archivedCount > 0 && (
            <button className="btn btn-ghost small" style={{ padding: '4px 8px' }} onClick={() => setShowArchived((v) => !v)}>
              {showArchived ? 'Hide hidden' : `Show hidden (${archivedCount})`}
            </button>
          )}
        </div>
        {visible.length === 0 && <div className="small muted">No players yet.</div>}
        {visible.map((p) => (
          <div key={p.id} className="list-row" style={{ opacity: p.archived ? 0.55 : 1 }}>
            <button
              className="mini"
              style={{ background: colorOf(p.id), borderColor: 'transparent' }}
              onClick={() => update(p.id, { colorIdx: (p.colorIdx + 1) % PALETTE_SIZE })}
              aria-label="Change color"
            />
            <span className="grow editable" style={{ fontWeight: 700, borderBottomColor: 'transparent' }} onClick={() => setRenaming(p)}>
              {p.name} <span className="muted small">✏</span>
            </span>
            {p.archived ? (
              <button className="mini" onClick={() => update(p.id, { archived: false })} aria-label="Restore">↺</button>
            ) : (
              <button className="mini" onClick={() => remove(p)} aria-label="Remove">✕</button>
            )}
          </div>
        ))}
        <div className="row">
          <input className="input" placeholder="New player name" value={newName} maxLength={24} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className="btn" onClick={add} disabled={!newName.trim()}>+ Add</button>
        </div>
        <div className="small muted">Tap a name to rename it everywhere, including past games. Tap the color to change it.</div>
      </div>

      <div className="card">
        <div className="label">Data on this device</div>
        <div className="small muted">Players and history are stored on this phone only. Back up to move them to another device.</div>
        <div className="row">
          <button className="btn grow" onClick={download}>⬇ Back up</button>
          <button className="btn grow" onClick={() => fileRef.current?.click()}>⬆ Restore</button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])} />
        <button className="btn btn-danger" onClick={wipe}>Erase everything</button>
      </div>

      <div className="small muted" style={{ textAlign: 'center' }}>Grok Score v1 · works offline</div>

      {renaming && <RenameSheet title="Rename player" value={renaming.name} onSave={(v) => renamePlayer(renaming.id, v)} onClose={() => setRenaming(null)} />}
    </>
  );
}

function Toggle({ label, on, onChange }) {
  return (
    <label className="spread" style={{ cursor: 'pointer' }}>
      <span>{label}</span>
      <input type="checkbox" checked={!!on} onChange={(e) => onChange(e.target.checked)} style={{ width: 22, height: 22, accentColor: 'var(--gold)' }} />
    </label>
  );
}
