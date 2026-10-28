import { useCallback, useEffect, useRef, useState } from 'react';
import { migrateCompleted } from './data';
import { ymd } from './date';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
 *   notes       { questionId: string }
 *   trackedTime { 'YYYY-MM-DD': seconds }
 * Writes to localStorage are debounced; the backend gets a debounced POST
 * instead of one request per click.
 */
export function useProgress(username) {
  const [completed, setCompleted] = useState(() => migrateCompleted(read('completedQuestions', {})));
  const [reviews, setReviews] = useState(() => read('reviews', {}));
  const [notes, setNotes] = useState(() => read('notes', {}));
  const [trackedTime, setTrackedTime] = useState(() => read('trackedTime', {}));
  const hydrated = useRef(false);

  // Pull server state once per login and merge it in.
  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    fetch(`${API_URL}/sync/${encodeURIComponent(username)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then((data) => {
        if (cancelled) return;
        if (data.completed) setCompleted((prev) => ({ ...migrateCompleted(data.completed), ...prev }));
        if (data.trackedTime) {
          setTrackedTime((prev) => {
            const next = { ...prev };
            for (const [d, s] of Object.entries(data.trackedTime)) next[d] = Math.max(next[d] || 0, s);
            return next;
          });
        }
      })
      .catch(() => { /* offline or no backend: local-only mode */ })
      .finally(() => { hydrated.current = true; });
    return () => { cancelled = true; };
  }, [username]);

  useEffect(() => {
    const t = setTimeout(() => {
      write('completedQuestions', completed);
      write('reviews', reviews);
      write('notes', notes);
      write('trackedTime', trackedTime);
    }, 250);
    return () => clearTimeout(t);
  }, [completed, reviews, notes, trackedTime]);

  useEffect(() => {
    if (!username || !hydrated.current) return;
    const t = setTimeout(() => {
      fetch(`${API_URL}/sync/${encodeURIComponent(username)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed, trackedTime }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [completed, trackedTime, username]);

  const toggleSolved = useCallback((id) => {
    setCompleted((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = ymd();
      return next;
    });
    setReviews((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const markReviewed = useCallback((id, stage) => {
    setReviews((prev) => ({ ...prev, [id]: { ...prev[id], [stage]: ymd() } }));
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
