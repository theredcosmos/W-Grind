import { useCallback, useEffect, useRef, useState } from 'react';
import { BY_ID } from './data';
import { ymd } from './date';
import { API_URL, userKey } from './session';

const SYNC_EVERY_MS = 15 * 60 * 1000;

/**
 * Pulls your latest accepted LeetCode submissions (LeetCode only exposes the last 20 publicly)
 * through the backend and ticks any matching problem. Runs on open, every 15 minutes while the
 * tab is visible, and when you come back to the tab.
 */
export function useLeetCodeSync({ session, importSolved, onImported }) {
  const key = userKey(session.username, 'lcUser');
  const [lcUser, setLcUserState] = useState(() => {
    try { return localStorage.getItem(key) || ''; } catch { return ''; }
  });
  const [status, setStatus] = useState({ state: 'idle' });
  const lastRun = useRef(0);
  const cloud = session.mode === 'cloud';

  const sync = useCallback(async (user = lcUser) => {
    if (!cloud || !user) return;
    lastRun.current = Date.now();
    setStatus({ state: 'syncing' });
    try {
      const res = await fetch(`${API_URL}/leetcode/${encodeURIComponent(user)}/recent`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'LeetCode sync failed.');
      const found = {};
      for (const s of data.solves) {
        if (!BY_ID.has(s.slug)) continue;
        const day = ymd(new Date(s.at));
        if (!found[s.slug] || day < found[s.slug]) found[s.slug] = day; // earliest accepted date
      }
      const added = importSolved(found);
      setStatus({ state: 'ok', at: Date.now(), seen: data.solves.length, added: added.length });
      if (added.length) onImported(added);
    } catch (err) {
      setStatus({ state: 'error', at: Date.now(), message: err.message });
    }
  }, [cloud, lcUser, session.token, importSolved, onImported]);

  const setLcUser = useCallback((name) => {
    const v = name.trim();
    try {
      if (v) localStorage.setItem(key, v);
      else localStorage.removeItem(key);
    } catch { /* storage blocked */ }
    setLcUserState(v);
    setStatus({ state: 'idle' });
    if (v) sync(v);
  }, [key, sync]);

  useEffect(() => {
    if (!cloud || !lcUser) return undefined;
    const maybe = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastRun.current > SYNC_EVERY_MS) sync();
    };
    // First sync shortly after sign-in, once the server's progress has merged in.
    const first = setTimeout(maybe, 2500);
    const timer = setInterval(maybe, 60 * 1000);
    document.addEventListener('visibilitychange', maybe);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      document.removeEventListener('visibilitychange', maybe);
    };
  }, [cloud, lcUser, sync]);

  return { lcUser, setLcUser, sync, status, available: cloud };
}
