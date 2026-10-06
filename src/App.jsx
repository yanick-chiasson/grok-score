import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppCtx } from './context';
import { usePersisted, uid, requestPersistentStorage } from './storage';
import { PALETTE_SIZE, color } from './colors';
import { finishGame } from './game';
import Home from './screens/Home';
import Setup from './screens/Setup';
import Game from './screens/Game';
import Results from './screens/Results';
import History from './screens/History';
import Settings from './screens/Settings';

const DEFAULT_SETTINGS = { theme: 'dark', timerSeconds: 90, sound: true, vibrate: true, wakeLock: true };

export default function App() {
  const [settings, setSettings] = usePersisted('settings', DEFAULT_SETTINGS);
  const [players, setPlayers] = usePersisted('players', []);
  const [games, setGames] = usePersisted('games', []);
  const [current, setCurrent] = usePersisted('current', null);
  const [lastSetup, setLastSetup] = usePersisted('lastSetup', null);
  const [screen, setScreen] = useState('home');
  const [viewId, setViewId] = useState(null);

  const s = { ...DEFAULT_SETTINGS, ...settings };

  useEffect(() => {
    document.documentElement.dataset.theme = s.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', s.theme === 'light' ? '#f3eee4' : '#1a1208');
  }, [s.theme]);

  useEffect(() => requestPersistentStorage(), []);

  const byId = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p])), [players]);

  const nameOf = useCallback((id, game) => byId[id]?.name ?? game?.names?.[id] ?? 'Unknown', [byId]);
  const colorOf = useCallback((id) => color(byId[id]?.colorIdx ?? 0, s.theme), [byId, s.theme]);

  const addPlayer = useCallback(
    (name) => {
      const p = { id: uid(), name: name.trim(), colorIdx: players.length % PALETTE_SIZE, archived: false, createdAt: Date.now() };
      setPlayers((list) => [...list, p]);
      return p;
    },
    [players.length, setPlayers],
  );

  const renamePlayer = useCallback(
    (id, name) => setPlayers((list) => list.map((p) => (p.id === id ? { ...p, name } : p))),
    [setPlayers],
  );

  const ctx = { settings: s, setSettings, players, setPlayers, games, setGames, nameOf, colorOf, addPlayer, renamePlayer };

  const go = (name) => {
    setScreen(name);
    window.scrollTo(0, 0);
  };

  const startGame = (game, setup) => {
    setLastSetup(setup);
    setCurrent(game);
    go('game');
  };

  const endGame = (early) => {
    const record = finishGame(current, (id) => nameOf(id), early);
    setGames((list) => [record, ...list]);
    setCurrent(null);
    setViewId(record.id);
    go('results');
  };

  const abandonGame = () => {
    setCurrent(null);
    go('home');
  };

  const viewed = games.find((g) => g.id === viewId);

  let page;
  if (screen === 'setup') page = <Setup lastSetup={lastSetup} onStart={startGame} onBack={() => go('home')} />;
  else if (screen === 'game' && current) page = <Game game={current} setGame={setCurrent} onEnd={endGame} onAbandon={abandonGame} onHome={() => go('home')} />;
  else if (screen === 'results' && viewed) page = <Results game={viewed} onHome={() => go('home')} onNew={() => go('setup')} fresh />;
  else if (screen === 'detail' && viewed)
    page = (
      <Results
        game={viewed}
        onHome={() => go('history')}
        onDelete={() => {
          setGames((list) => list.filter((g) => g.id !== viewed.id));
          go('history');
        }}
      />
    );
  else if (screen === 'history') page = <History onBack={() => go('home')} onOpen={(id) => { setViewId(id); go('detail'); }} />;
  else if (screen === 'settings') page = <Settings onBack={() => go('home')} />;
  else page = <Home current={current} onResume={() => go('game')} onNew={() => go('setup')} onHistory={() => go('history')} onSettings={() => go('settings')} />;

  return (
    <AppCtx.Provider value={ctx}>
      <div className="app">{page}</div>
    </AppCtx.Provider>
  );
}
