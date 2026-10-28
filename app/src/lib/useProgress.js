import { useCallback, useEffect, useRef, useState } from 'react';
import { migrateCompleted } from './data';
import { ymd } from './date';
import { API_URL } from './session';


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
export function useProgress(session, onExpired) {
  const [completed, setCompleted] = useState(() => migrateCompleted(read('completedQuestions', {})));
  const [reviews, setReviews] = useState(() => read('reviews', {}));
  const [notes, setNotes] = useState(() => read('notes', {}));
  const [trackedTime, setTrackedTime] = useState(() => read('trackedTime', {}));
  const hydrated = useRef(false);
  const token = session.mode === 'cloud' ? session.token : null;

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
        if (data.completed) setCompleted((prev) => ({ ...migrateCompleted(data.completed), ...prev }));
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
    if (!token || !hydrated.current) return;
    const t = setTimeout(() => {
      fetch(`${API_URL}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ completed, trackedTime }),
      })
        .then((res) => res.status === 401 && onExpired())
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [completed, trackedTime, token, onExpired]);

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
