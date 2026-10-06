import { useCallback, useEffect, useRef, useState } from 'react';

let audioCtx = null;
function audio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function beep(ctx, at, freq, dur) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'square';
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(0.25, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g).connect(ctx.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

export function playEndSound() {
  const ctx = audio();
  if (!ctx) return;
  const t = ctx.currentTime;
  beep(ctx, t, 880, 0.18);
  beep(ctx, t + 0.25, 880, 0.18);
  beep(ctx, t + 0.5, 660, 0.6);
}

// Countdown based on wall-clock end time, so it stays accurate if the phone throttles the page.
export function useTimer(totalSeconds, { sound = true, vibrate = true, wakeLock = true } = {}) {
  const total = totalSeconds * 1000;
  const [remaining, setRemaining] = useState(total);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const endAt = useRef(null);
  const lock = useRef(null);

  const releaseLock = useCallback(() => {
    lock.current?.release?.().catch(() => {});
    lock.current = null;
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      const rem = endAt.current - Date.now();
      if (rem <= 0) {
        clearInterval(id);
        setRemaining(0);
        setRunning(false);
        setDone(true);
        releaseLock();
        if (sound) playEndSound();
        if (vibrate) navigator.vibrate?.([300, 100, 300, 100, 600]);
      } else {
        setRemaining(rem);
      }
    }, 100);
    return () => clearInterval(id);
  }, [running, sound, vibrate, releaseLock]);

  useEffect(() => releaseLock, [releaseLock]);

  const start = useCallback(() => {
    if (done) return;
    audio(); // unlock audio on the tap so the end beep can play
    endAt.current = Date.now() + remaining;
    setRunning(true);
    if (wakeLock && navigator.wakeLock) {
      navigator.wakeLock.request('screen').then((l) => (lock.current = l)).catch(() => {});
    }
  }, [done, remaining, wakeLock]);

  const pause = useCallback(() => {
    setRemaining(Math.max(0, endAt.current - Date.now()));
    setRunning(false);
    releaseLock();
  }, [releaseLock]);

  const reset = useCallback(() => {
    setRunning(false);
    setDone(false);
    setRemaining(total);
    releaseLock();
  }, [total, releaseLock]);

  const toggle = useCallback(() => (running ? pause() : start()), [running, pause, start]);

  return { remaining, running, done, total, start, pause, reset, toggle };
}
