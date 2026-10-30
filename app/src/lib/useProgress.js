import { useCallback, useEffect, useRef, useState } from 'react';
import { migrateCompleted } from './data';
import { HINT_COST, migrateReviews } from './game';
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
 *   reviews     { questionId: { r1?: date, r2?: date } }  (4 days after solving, then 7 after that)
 *   removed     { questionId: { date, review } }  un-solved problems: tells the server to delete the row,
 *               keeps the login merge from resurrecting it, and restores date + reviews on re-solve
 *   notes       { questionId: string }
 *   trackedTime { 'YYYY-MM-DD': seconds }
 *   extras      { hints: { id: date }, hintXp: { id: xp }, problemTime: { id: seconds }, interviews: { id: { date, seconds, solved } } }
 *               hints = the day a hint was first opened early; hintXp = total XP spent opening hints early
 *               (device-local: hint reveals cost XP, per-problem time, interview-mode results)
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
      reviews: migrateReviews(read(key('reviews'), {})),
      removed: read(key('removed'), {}),
    };
  });
  const [notes, setNotes] = useState(() => read(key('notes'), {}));
  const [trackedTime, setTrackedTime] = useState(() => read(key('trackedTime'), {}));
  const [extras, setExtras] = useState(() => ({ hints: {}, hintXp: {}, problemTime: {}, interviews: {}, ...read(key('extras'), {}) }));
  const { completed, reviews, removed } = solve;
  const hydrated = useRef(false);
  const token = session.mode === 'cloud' ? session.token : null;

  // Latest values for the flush-on-exit path (effects below can't see future renders).
  const latest = useRef(null);
  useEffect(() => {
    latest.current = { completed, reviews, removed, notes, trackedTime, extras };
  }, [completed, reviews, removed, notes, trackedTime, extras]);

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
    write(userKey(username, 'extras'), s.extras);
  }, [username]);

  const push = useCallback((s, { keepalive = false } = {}) => fetch(`${API_URL}/sync`, {
    method: 'POST',
    keepalive,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ completed: s.completed, trackedTime: s.trackedTime, removed: Object.keys(s.removed) }),
  }), [token]);

  useEffect(() => {
    const t = setTimeout(() => saveLocal({ completed, reviews, removed, notes, trackedTime, extras }), 250);
    return () => clearTimeout(t);
  }, [completed, reviews, removed, notes, trackedTime, extras, saveLocal]);

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

  /** Mark solved without toggling (fight / interview "Done"); never un-solves. */
  const markSolved = useCallback((id) => {
    setSolve((prev) => {
      if (prev.completed[id]) return prev;
      const removedNext = { ...prev.removed };
      delete removedNext[id];
      return { ...prev, completed: { ...prev.completed, [id]: ymd() }, removed: removedNext };
    });
  }, []);

  /**
   * Solves found on LeetCode: { id: 'YYYY-MM-DD' }. Skips problems already ticked and problems
   * you deliberately un-ticked here. Returns the ids actually added.
   */
  const importSolved = useCallback((found) => {
    const cur = latest.current;
    if (!cur) return [];
    const added = Object.keys(found).filter((id) => !cur.completed[id] && !cur.removed[id]);
    if (added.length) {
      setSolve((prev) => {
        const completedNext = { ...prev.completed };
        for (const id of added) if (!completedNext[id] && !prev.removed[id]) completedNext[id] = found[id];
        return { ...prev, completed: completedNext };
      });
    }
    return added;
  }, []);

  /** Record XP spent opening a hint rung early. Which rungs are open is session state (App). */
  const chargeHint = useCallback((id, xp) => {
    setExtras((prev) => {
      // A problem charged under the old one-off rule already paid HINT_COST once.
      const before = prev.hintXp?.[id] ?? (prev.hints[id] ? HINT_COST : 0);
      return {
        ...prev,
        hints: prev.hints[id] ? prev.hints : { ...prev.hints, [id]: ymd() },
        hintXp: { ...prev.hintXp, [id]: before + xp },
      };
    });
  }, []);

  /** Time spent fighting one problem; also counts toward today's focus time. */
  const addProblemTime = useCallback((id, seconds) => {
    const s = Math.round(seconds);
    if (s <= 0) return;
    setExtras((prev) => ({ ...prev, problemTime: { ...prev.problemTime, [id]: (prev.problemTime[id] || 0) + s } }));
    const today = ymd();
    setTrackedTime((prev) => ({ ...prev, [today]: (prev[today] || 0) + s }));
  }, []);

  const recordInterview = useCallback((id, seconds, solved) => {
    setExtras((prev) => {
      const best = prev.interviews[id];
      // Keep the best attempt: a pass beats a fail, then the faster time.
      if (best && (best.solved && !solved || best.solved === solved && best.seconds <= seconds)) return prev;
      return { ...prev, interviews: { ...prev.interviews, [id]: { date: ymd(), seconds: Math.round(seconds), solved } } };
    });
  }, []);

  return {
    completed, reviews, notes, trackedTime, extras,
    toggleSolved, markSolved, importSolved, markReviewed, setNote, addTime, chargeHint, addProblemTime, recordInterview,
  };
}
