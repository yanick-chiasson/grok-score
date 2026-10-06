import { useEffect, useState } from 'react';

const PREFIX = 'grok.';

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage full or blocked: keep running in memory */
  }
}

export function usePersisted(key, initial) {
  const [value, setValue] = useState(() => load(key, initial));
  useEffect(() => save(key, value), [key, value]);
  return [value, setValue];
}

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);

// Ask the browser not to evict our data (installed PWAs usually get this).
export function requestPersistentStorage() {
  try {
    navigator.storage?.persist?.();
  } catch {
    /* ignore */
  }
}

export const KEYS = ['settings', 'players', 'games', 'current', 'lastSetup'];

export function exportAll() {
  const data = { app: 'grok-score', version: 1, exportedAt: new Date().toISOString() };
  for (const k of KEYS) data[k] = load(k, null);
  return data;
}
