import { ymd } from '../date';

/*
 * Focus timer engine (ported from Stillpoint's app.js + background.js).
 *
 * One timer per signed-in user, stored in localStorage so it survives reloads:
 *   { status: 'idle' | 'running' | 'paused' | 'done', durationMs, remaining, endAt, onBreak, focusMs,
 *     intent, sid, halfPinged }
 * While running, the time left is always `endAt - Date.now()`, so a throttled background tab or a
 * reload never drifts. The engine lives at module level: once the Focus page has been opened it
 * keeps scheduling the end of the session (and the tab title) while you browse other pages.
 */

export const MAX_MS = 60 * 60000; // the dial face is one hour
export const BREAK_MS = 5 * 60000;
export const PRESETS = [5, 10, 15, 25, 45, 60];
const HALF_PING_MIN_MS = 10 * 60000; // only longer sessions get a halfway ping
const LATE_CHIME_MS = 60000; // a session that ended long ago (tab closed) finishes quietly

export const DEFAULT_TIMER = {
  status: 'idle', durationMs: 25 * 60000, remaining: 25 * 60000, endAt: 0,
  onBreak: false, focusMs: 0, intent: '', sid: null, halfPinged: false,
};

const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode: keep it in memory */ }
};

/** Time left right now, in ms. */
export const remainingOf = (t, now = Date.now()) => (t.status === 'running' ? Math.max(0, t.endAt - now) : t.remaining);

/** 25:00 style. Rounds up, so the display never shows 00:00 while time is left. */
export const fmt = (ms) => {
  const s = Math.ceil(Math.max(0, ms) / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

/** In the last minute (or last 10% of a short session) the dial turns to its warning colour. */
export const isWarn = (t, rem) => t.status === 'running' && !t.onBreak && rem <= Math.min(60000, t.durationMs * 0.1 + 1000);

/** A focus session is under way (break time doesn't count). */
export const inSession = (t) => (t.status === 'running' || t.status === 'paused') && !t.onBreak;

// ---------------------------------------------------------------- focus log
// { 'YYYY-MM-DD': { count, min } }, kept for 90 days.
export const readLog = (key) => read(key, {});
const logSession = (key, minutes) => {
  const log = readLog(key);
  const today = ymd();
  log[today] = { count: (log[today]?.count || 0) + 1, min: (log[today]?.min || 0) + minutes };
  const cutoff = ymd(new Date(Date.now() - 90 * 864e5));
  for (const d of Object.keys(log)) if (d < cutoff) delete log[d];
  write(key, log);
  return log;
};

// ---------------------------------------------------------------- engine (module singleton)
let keys = null; // { timer, log }
let T = DEFAULT_TIMER;
let handlers = {};
let endTimer = 0;
let halfTimer = 0;
let titleTimer = 0;
let baseTitle = null;
const listeners = new Set();

const emit = () => listeners.forEach((fn) => fn());
export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const getTimer = () => T;

function commit(next) {
  T = next;
  if (keys) write(keys.timer, T);
  schedule();
  emit();
}

function setTitle() {
  if (T.status !== 'running' && T.status !== 'paused') {
    if (baseTitle !== null) document.title = baseTitle;
    baseTitle = null;
    return;
  }
  if (baseTitle === null) baseTitle = document.title;
  const mins = Math.ceil(remainingOf(T) / 60000);
  const what = T.onBreak ? 'Break' : T.intent.trim() || 'Focus';
  document.title = T.status === 'paused' ? `Paused · ${what}` : `${mins} min · ${what}`;
}

function schedule() {
  clearTimeout(endTimer);
  clearTimeout(halfTimer);
  clearInterval(titleTimer);
  if (T.status === 'running') {
    // One plain timeout (not a chain) so background-tab throttling only delays it by about a second.
    endTimer = setTimeout(finishIfDue, Math.max(0, T.endAt - Date.now()) + 50);
    const halfAt = T.endAt - T.durationMs / 2;
    if (!T.onBreak && !T.halfPinged && T.durationMs >= HALF_PING_MIN_MS && halfAt > Date.now()) {
      halfTimer = setTimeout(() => {
        if (T.status !== 'running' || T.halfPinged) return;
        commit({ ...T, halfPinged: true });
        handlers.onHalf?.();
      }, halfAt - Date.now());
    }
    titleTimer = setInterval(setTitle, 5000);
  }
  setTitle();
}

/** End the session if its time is up. Safe to call any time (and from several tabs). */
export function finishIfDue() {
  if (!keys || T.status !== 'running' || Date.now() < T.endAt - 250) return;
  // Another tab may already have finished this session: trust what's stored.
  const stored = read(keys.timer, null);
  if (stored && (stored.status !== 'running' || stored.endAt !== T.endAt)) {
    T = { ...DEFAULT_TIMER, ...stored };
    schedule();
    emit();
    return;
  }
  const late = Date.now() - T.endAt > LATE_CHIME_MS;
  if (T.onBreak) {
    const durationMs = T.focusMs || DEFAULT_TIMER.durationMs;
    commit({ ...T, status: 'idle', onBreak: false, durationMs, remaining: durationMs, halfPinged: false });
    handlers.onBreakDone?.({ late });
    return;
  }
  const minutes = Math.round(T.durationMs / 60000);
  const log = logSession(keys.log, minutes);
  const done = { ...T, status: 'done', remaining: 0 };
  commit(done);
  handlers.onFocusDone?.({ minutes, seconds: Math.round(T.durationMs / 1000), intent: done.intent, sid: done.sid, late, log });
}

/** Point the engine at a user's storage keys ({ timer, log }). Cheap and idempotent. */
export function load(storageKeys) {
  if (keys?.timer === storageKeys.timer) return;
  keys = storageKeys;
  T = { ...DEFAULT_TIMER, ...read(keys.timer, {}) };
  schedule();
  emit();
}

/**
 * Register what happens when a session ends ({ onFocusDone, onBreakDone, onHalf }).
 * Handlers are kept after the page unmounts so a session still completes on other pages.
 */
export function attach(nextHandlers) {
  handlers = nextHandlers;
  finishIfDue();
}

/**
 * App-wide handlers for when the Focus page hasn't been opened yet this page load, so a session
 * started before a reload still finishes (and is credited) on any page. Never replaces the
 * Focus page's own handlers.
 */
export function attachFallback(fallbackHandlers) {
  if (handlers.onFocusDone) return;
  attach(fallbackHandlers);
}

// Another tab changed the timer: follow it.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (!keys || e.key !== keys.timer) return;
    T = { ...DEFAULT_TIMER, ...read(keys.timer, {}) };
    schedule();
    emit();
  });
  // Coming back to a tab whose session ended while it slept.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') finishIfDue();
  });
}

// ---------------------------------------------------------------- actions
const busy = () => T.status === 'running' || T.status === 'paused';

export function setMinutes(min) {
  if (busy()) return;
  const m = Math.max(1, Math.min(60, Math.round(min)));
  commit({ ...T, durationMs: m * 60000, remaining: m * 60000, status: 'idle', halfPinged: false, onBreak: false });
}

export function setIntent(intent) {
  commit({ ...T, intent: intent.slice(0, 80) });
}

export function start() {
  if (T.status === 'running') return;
  const fresh = T.status !== 'paused';
  const remaining = T.status === 'done' || T.remaining <= 0 ? T.durationMs : T.remaining;
  commit({
    ...T,
    status: 'running',
    remaining,
    endAt: Date.now() + remaining,
    halfPinged: fresh ? false : T.halfPinged,
    // A session id ties thoughts parked during it to this round.
    sid: fresh && !T.onBreak ? Date.now().toString(36) : T.sid,
  });
}

export function pause() {
  if (T.status !== 'running') return;
  commit({ ...T, status: 'paused', remaining: remainingOf(T) });
}

export function reset() {
  const durationMs = T.onBreak ? T.focusMs || DEFAULT_TIMER.durationMs : T.durationMs;
  commit({ ...T, status: 'idle', onBreak: false, durationMs, remaining: durationMs, halfPinged: false });
}

export function startBreak() {
  commit({ ...T, focusMs: T.durationMs, onBreak: true, durationMs: BREAK_MS, remaining: BREAK_MS, status: 'idle', halfPinged: false });
  start();
}

export function again() {
  commit({ ...T, status: 'idle', remaining: T.durationMs, halfPinged: false });
  start();
}
