import Hourglass from './Hourglass';
import { useTimer } from '../useTimer';
import { useApp } from '../context';

// Remount with a new key on every turn so the hourglass resets automatically.
export default function TimerPanel() {
  const { settings } = useApp();
  const t = useTimer(settings.timerSeconds, settings);
  const secs = Math.ceil(t.remaining / 1000);
  const low = secs <= 15 && !t.done;
  const m = Math.floor(secs / 60);
  const s = String(secs % 60).padStart(2, '0');

  return (
    <div className="card" style={{ padding: '10px 14px' }}>
      <div className="timer">
        <Hourglass pct={t.remaining / t.total} running={t.running} low={low && t.running} done={t.done} onClick={t.done ? t.reset : t.toggle} size={0.62} />
        <div className="stack" style={{ alignItems: 'center', gap: 10 }}>
          <div className={`clock ${t.done ? 'done' : low && t.running ? 'low' : ''}`}>{t.done ? 'TIME!' : `${m}:${s}`}</div>
          <div className="row">
            <button className="btn btn-gold" style={{ minWidth: 96 }} onClick={t.done ? t.reset : t.toggle}>
              {t.done ? '↺ Again' : t.running ? '⏸ Pause' : '▶ Start'}
            </button>
            <button className="btn btn-ghost" onClick={t.reset} aria-label="Reset timer">↺</button>
          </div>
        </div>
      </div>
    </div>
  );
}
