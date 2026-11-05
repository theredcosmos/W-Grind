/*
 * Parking lot (Stillpoint's park-core.js): a place to drop a stray thought mid-session so it
 * stops pulling at you. Each note is guessed into a kind; the list stays hidden until a break.
 *   note = { id, text, type: 'task' | 'lookup' | 'idea' | 'worry', created, sid, status, doneAt? }
 *   status: 'open' | 'done' | 'dropped' | 'promoted' (became the next focus)
 */

export const KINDS = {
  task: { label: 'To do', said: "Parked. It's safe here." },
  lookup: { label: 'Look up', said: 'Saved for your break. The internet will still be there.' },
  idea: { label: 'Idea', said: 'Idea kept. It will still be good later.' },
  worry: { label: 'Worry', said: 'Set down for now. You can pick it up at break.' },
};
export const KIND_KEYS = Object.keys(KINDS);
export const nextKind = (k) => KIND_KEYS[(KIND_KEYS.indexOf(k) + 1) % KIND_KEYS.length];

/** Guess what kind of thought this is from its words. Falls back to a to-do. */
export function classify(text) {
  const t = (text || '').toLowerCase().trim();
  if (/\b(worried|worry|anxious|what if|afraid|nervous|stress|scared|did i|forgot to|panic)\b/.test(t)) return 'worry';
  if (/https?:\/\/|\?$|\b(look up|lookup|google|search|research|find out|read|watch|check out|what is|what's|how do|how does|how to|why|who is|compare|price of)\b/.test(t)) return 'lookup';
  if (/\b(email|reply|call|text|message|buy|pay|book|send|fix|schedule|remind|order|cancel|submit|clean|finish|ask|tell|renew|return|pick up|update|sign|file|wash|tidy)\b/.test(t)) return 'task';
  if (/\b(idea|maybe|what about|could|should try|wouldn'?t it|build|make a|app for|business|story|write a)\b/.test(t)) return 'idea';
  return 'task';
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const isOpen = (n) => n.status === 'open';

/** Read a user's notes; handled ones are kept for a week, then forgotten. */
export function loadNotes(key) {
  let notes;
  try { notes = JSON.parse(localStorage.getItem(key)) || []; } catch { notes = []; }
  const weekAgo = Date.now() - 7 * 864e5;
  return notes.filter((n) => n && n.text && (isOpen(n) || (n.doneAt || n.created) > weekAgo));
}

export function saveNotes(key, notes) {
  try { localStorage.setItem(key, JSON.stringify(notes)); } catch { /* private mode: keep it for this session */ }
}

export const makeNote = (text, type, sid) => ({
  id: uid(),
  text: text.trim().slice(0, 200),
  type: type || classify(text),
  created: Date.now(),
  sid: sid || null,
  status: 'open',
});
