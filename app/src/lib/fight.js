import { useCallback, useEffect, useState } from 'react';
import { userKey } from './session';

/*
 * The active "fight": a timer attached to one problem, in plain fight mode or 45-minute interview
 * mode. Stored per user so a reload or navigation never loses it.
 *   { id, mode: 'fight' | 'interview', acc: seconds banked, since: ms timestamp while running | null }
 */

export const INTERVIEW_SECONDS = 45 * 60;
export const HINT_UNLOCK_SECONDS = 20 * 60;
const MAX_GAP_MS = 2 * 60 * 1000; // a longer jump means the laptop slept: don't count it

const read = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
};

/** Seconds fought so far (banked time plus the current running stretch). */
export const elapsedOf = (fight, now = Date.now()) => {
  if (!fight) return 0;
  if (!fight.since) return fight.acc;
  return fight.acc + Math.max(0, (now - fight.since) / 1000);
};

export function useFight(username) {
  const key = userKey(username, 'fight');
  const [fight, setFight] = useState(() => {
    const f = read(key);
    // Resuming after the tab was closed: don't count the time it was closed.
    return f?.since ? { ...f, since: null, acc: f.acc + Math.min(60, (Date.now() - (f.seen || f.since)) / 1000) } : f;
  });

  useEffect(() => {
    try {
      if (fight) localStorage.setItem(key, JSON.stringify({ ...fight, seen: Date.now() }));
      else localStorage.removeItem(key);
    } catch { /* storage blocked */ }
  }, [fight, key]);

  // Heartbeat: detect sleep gaps while running and fold them out of the clock.
  useEffect(() => {
    if (!fight?.since) return undefined;
    let last = Date.now();
    const t = setInterval(() => {
      const now = Date.now();
      if (now - last > MAX_GAP_MS) {
        setFight((f) => (f?.since ? { ...f, acc: elapsedOf(f, last), since: now } : f));
      }
      last = now;
      try { localStorage.setItem(key, JSON.stringify({ ...fight, seen: now })); } catch { /* ignore */ }
    }, 5000);
    return () => clearInterval(t);
  }, [fight, key]);

  const start = useCallback((id, mode = 'fight') => {
    setFight({ id, mode, acc: 0, since: Date.now() });
  }, []);

  const pause = useCallback(() => setFight((f) => (f?.since ? { ...f, acc: elapsedOf(f), since: null } : f)), []);
  const resume = useCallback(() => setFight((f) => (f && !f.since ? { ...f, since: Date.now() } : f)), []);

  /** Ends the fight and returns { id, mode, seconds } for the caller to record. */
  const finish = useCallback(() => {
    if (!fight) return null;
    setFight(null);
    return { id: fight.id, mode: fight.mode, seconds: Math.round(elapsedOf(fight)) };
  }, [fight]);

  return { fight, start, pause, resume, finish };
}

/** Re-renders the caller once per second while `on` (keeps ticking local to small components). */
export function useTick(on) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!on) return undefined;
    const t = setInterval(() => setN((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [on]);
}

export const clock = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
