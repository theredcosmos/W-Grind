import { useEffect, useState } from 'react';

// Local-calendar date helpers. Everything is keyed by 'YYYY-MM-DD' in the user's
// own timezone (toISOString() would roll the date over at UTC midnight).

export const ymd = (d = new Date()) => {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
};

export const parseYmd = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s, n) => {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};

export const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000);

/** Current local date that updates at midnight and when the tab becomes visible again. */
export function useToday() {
  const [today, setToday] = useState(ymd);
  useEffect(() => {
    const check = () => setToday(ymd());
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const t = setTimeout(check, midnight - now + 500);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearTimeout(t);
      document.removeEventListener('visibilitychange', check);
    };
  }, [today]);
  return today;
}

export const prettyDate = (s) =>
  parseYmd(s).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

export const formatDuration = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m`;
  return `${s}s`;
};
