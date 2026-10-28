import { useCallback, useEffect, useRef, useState } from 'react';
import { migrateCompleted } from './data';
import { ymd } from './date';
import { API_URL, claimLegacyProgress, userKey } from './session';

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — progress still lives in memory and the backend */
  }
};

/**
 * All user progress in one place.
 *   completed   { questionId: 'YYYY-MM-DD' }
 *   reviews     { questionId: { r7?: date, r14?: date } }
 *   removed     { questionId: { date, review } }  un-solved problems: tells the server to delete the row,
 *               keeps the login merge from resurrecting it, and restores date + reviews on re-solve
 *   notes       { questionId: string }
 *   trackedTime { 'YYYY-MM-DD': seconds }
 * Writes to localStorage are debounced; the backend gets a debounced POST
 * instead of one request per click. Both are flushed on sign-out and tab close.
 */
export function useProgress(session, onExpired) {
  const { username } = session;
  const key = (k) => userKey(username, k);
  // completed/reviews/removed change together, so they live in one state object.
  const [solve, setSolve] = useState(() => {
    claimLegacyProgress(username);
    return {
      completed: migrateCompleted(read(key('completedQuestions'), {})),
      reviews: read(key('reviews'), {}),
      removed: read(key('removed'), {}),
    };
  });
  const [notes, setNotes] = useState(() => read(key('notes'), {}));
  const [trackedTime, setTrackedTime] = useState(() => read(key('trackedTime'), {}));
  const { completed, reviews, removed } = solve;
  const hydrated = useRef(false);
  const token = session.mode === 'cloud' ? session.token : null;

  // Latest values for the flush-on-exit path (effects below can't see future renders).
  const latest = useRef(null);
  useEffect(() => {
    latest.current = { completed, reviews, removed, notes, trackedTime };
  }, [completed, reviews, removed, notes, trackedTime]);

  // Pull server state once per login and merge it in.
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${API_URL}/sync`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (res.status === 401) onExpired();
        return res.ok ? res.json() : Promise.reject(new Error(res.statusText));
      })
      .then((data) => {
        if (cancelled) return;
        if (data.completed) {
          setSolve((prev) => {
            const fromServer = migrateCompleted(data.completed);
            for (const id of Object.keys(prev.removed)) delete fromServer[id]; // un-solved here: don't resurrect
            return { ...prev, completed: { ...fromServer, ...prev.completed } };
          });
        }
        if (data.trackedTime) {
          setTrackedTime((prev) => {
            const next = { ...prev };
            for (const [d, s] of Object.entries(data.trackedTime)) next[d] = Math.max(next[d] || 0, s);
            return next;
          });
        }
        hydrated.current = true;
      })
      .catch(() => { /* server unreachable: keep working locally, push on the next change */ hydrated.current = true; });
    return () => { cancelled = true; };
  }, [token, onExpired]);

  const saveLocal = useCallback((s) => {
    write(userKey(username, 'completedQuestions'), s.completed);
    write(userKey(username, 'reviews'), s.reviews);
    write(userKey(username, 'removed'), s.removed);
    write(userKey(username, 'notes'), s.notes);
    write(userKey(username, 'trackedTime'), s.trackedTime);
  }, [username]);

  const push = useCallback((s, { keepalive = false } = {}) => fetch(`${API_URL}/sync`, {
    method: 'POST',
    keepalive,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ completed: s.completed, trackedTime: s.trackedTime, removed: Object.keys(s.removed) }),
  }), [token]);

  useEffect(() => {
    const t = setTimeout(() => saveLocal({ completed, reviews, removed, notes, trackedTime }), 250);
    return () => clearTimeout(t);
  }, [completed, reviews, removed, notes, trackedTime, saveLocal]);

  useEffect(() => {
    if (!token || !hydrated.current) return;
    const t = setTimeout(() => {
      push({ completed, trackedTime, removed })
        .then((res) => res.status === 401 && onExpired())
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [completed, trackedTime, removed, token, onExpired, push]);

  // Flush pending writes when the tab is hidden/closed and when this user's view unmounts (sign-out).
  useEffect(() => {
    const flush = () => {
      if (!latest.current) return;
      saveLocal(latest.current);
      if (token && hydrated.current) push(latest.current, { keepalive: true }).catch(() => {});
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [saveLocal, push, token]);

  const toggleSolved = useCallback((id) => {
    setSolve((prev) => {
      const completedNext = { ...prev.completed };
      const reviewsNext = { ...prev.reviews };
      const removedNext = { ...prev.removed };
      if (completedNext[id]) {
        // Un-solve: remember the original date and reviews in case it was a mis-click.
        removedNext[id] = { date: completedNext[id], review: reviewsNext[id] };
        delete completedNext[id];
        delete reviewsNext[id];
      } else if (removedNext[id]) {
        // Re-solve: restore history instead of counting it as a brand-new solve today.
        completedNext[id] = removedNext[id].date;
        if (removedNext[id].review) reviewsNext[id] = removedNext[id].review;
        delete removedNext[id];
      } else {
        completedNext[id] = ymd();
      }
      return { completed: completedNext, reviews: reviewsNext, removed: removedNext };
    });
  }, []);

  const markReviewed = useCallback((id, stage) => {
    setSolve((prev) => ({ ...prev, reviews: { ...prev.reviews, [id]: { ...prev.reviews[id], [stage]: ymd() } } }));
  }, []);

  const setNote = useCallback((id, text) => {
    setNotes((prev) => {
      const next = { ...prev };
      if (text.trim()) next[id] = text;
      else delete next[id];
      return next;
    });
  }, []);

  const addTime = useCallback((seconds) => {
    if (seconds <= 0) return;
    const today = ymd();
    setTrackedTime((prev) => ({ ...prev, [today]: (prev[today] || 0) + Math.round(seconds) }));
  }, []);

  return { completed, reviews, notes, trackedTime, toggleSolved, markReviewed, setNote, addTime };
}
