import { useCallback, useEffect, useState } from 'react';
import { ymd } from './date';
import { userKey } from './session';

/*
 * Daily reminder. Browsers only let a site show notifications while it is open (a tab or the
 * installed app window), so this fires at your chosen time while the app is running, or the
 * next time you open it after that time — once per day, and only if today's quest isn't done.
 */
export function useReminder(username, { questDone, dueCount }) {
  const key = userKey(username, 'reminder');
  const [settings, setSettings] = useState(() => {
    try { return { enabled: false, time: '19:00', ...JSON.parse(localStorage.getItem(key)) }; } catch { return { enabled: false, time: '19:00' }; }
  });
  const supported = typeof window !== 'undefined' && 'Notification' in window;

  const update = useCallback(async (next) => {
    const merged = { ...settings, ...next };
    if (next.enabled && supported && Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') merged.enabled = false;
    }
    try { localStorage.setItem(key, JSON.stringify(merged)); } catch { /* storage blocked */ }
    setSettings(merged);
    return merged.enabled;
  }, [settings, supported, key]);

  useEffect(() => {
    if (!settings.enabled || !supported || Notification.permission !== 'granted') return undefined;
    const fire = () => {
      const today = ymd();
      if (settings.lastShown === today || questDone) return;
      const body = dueCount
        ? `A gate has opened: ${dueCount} review${dueCount > 1 ? 's' : ''} waiting.`
        : 'A gate has opened. Today’s training isn’t done yet.';
      try {
        new Notification('W-Grind', { body, icon: '/icon-192.png', tag: 'daily-gate' });
      } catch { /* some mobile browsers only allow notifications from a service worker */ }
      const stored = { ...settings, lastShown: today };
      try { localStorage.setItem(key, JSON.stringify(stored)); } catch { /* ignore */ }
      setSettings(stored);
    };
    const [h, m] = settings.time.split(':').map(Number);
    const now = new Date();
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    if (now >= at) {
      fire();
      return undefined;
    }
    const t = setTimeout(fire, at - now);
    return () => clearTimeout(t);
  }, [settings, supported, questDone, dueCount, key]);

  return { reminder: settings, setReminder: update, supported };
}
