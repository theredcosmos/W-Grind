import { useEffect, useRef, useState } from 'react';
import { BY_ID } from './data';
import { HINT_COST } from './game';
import { INTERVIEW_SECONDS } from './fight';
import { PHASES } from './interview';
import { HINT_GATES, hintLadderFor } from '../data/hintGuides';

/*
 * Bridge to the Stillpoint browser extension. While a fight runs, the extension shows a docked
 * panel on the LeetCode problem page (timer, interview step, hints, Solved / Give up), so nothing
 * has to float over W-Grind itself. The page and the extension's content script talk through
 * window.postMessage on this page:
 *
 *   page → ext   { source: 'wgrind', type: 'hello' }                  is the extension installed?
 *   page → ext   { source: 'wgrind', type: 'fight', fight: Snapshot | null }
 *   ext → page   { source: 'wgrind-ext', type: 'present', version }
 *   ext → page   { source: 'wgrind-ext', type: 'action', id, action, level? }
 *                action: 'pause' | 'resume' | 'solved' | 'giveup' | 'reveal' (level = hint rung)
 *
 * Snapshot (everything the panel needs, so the extension has no copy of the app's data):
 *   { id, title, url, difficulty, mode, acc, since, sentAt, interviewSeconds, phases,
 *     hintGates, hintCost, opened, hints: { nudge, approach, pattern, trigger, steps, edges, big } }
 * The fight is re-sent every HEARTBEAT_MS so the panel can tell when the W-Grind tab has closed.
 */
const HEARTBEAT_MS = 20 * 1000;
const PAGE = 'wgrind';
const EXT = 'wgrind-ext';

const snapshotOf = (fight, opened) => {
  const q = BY_ID.get(fight.id);
  if (!q) return null;
  const h = hintLadderFor(q);
  return {
    id: q.id,
    title: q.title,
    url: q.url,
    difficulty: q.difficulty,
    mode: fight.mode,
    acc: fight.acc,
    since: fight.since,
    sentAt: Date.now(),
    interviewSeconds: INTERVIEW_SECONDS,
    phases: PHASES.map(({ from, to, title, say }) => ({ from, to, title, say })),
    hintGates: HINT_GATES,
    hintCost: HINT_COST,
    opened,
    hints: { nudge: h.nudge, approach: h.approach, pattern: h.pattern, trigger: h.trigger, steps: h.steps, edges: h.edges, big: h.big },
  };
};

const post = (msg) => window.postMessage({ source: PAGE, ...msg }, window.location.origin);

/**
 * Keeps the extension's LeetCode panel in sync with the running fight.
 * Returns whether the extension is installed (false until it answers).
 */
export function useExtensionBridge({ fight, opened, onAction }) {
  const [present, setPresent] = useState(false);
  const onActionRef = useRef(onAction);
  useEffect(() => { onActionRef.current = onAction; }, [onAction]);
  const handled = useRef(new Set()); // action ids already applied (the relay may deliver twice)

  useEffect(() => {
    const onMessage = (e) => {
      if (e.source !== window || e.origin !== window.location.origin || e.data?.source !== EXT) return;
      if (e.data.type === 'present') setPresent(true);
      if (e.data.type === 'action' && e.data.id && !handled.current.has(e.data.id)) {
        handled.current.add(e.data.id);
        onActionRef.current?.(e.data);
      }
    };
    window.addEventListener('message', onMessage);
    post({ type: 'hello' });
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Send the fight whenever it (or the opened hints) changes, plus a heartbeat while it runs.
  useEffect(() => {
    if (!present) return undefined;
    const send = () => post({ type: 'fight', fight: fight ? snapshotOf(fight, opened) : null });
    send();
    if (!fight) return undefined;
    const t = setInterval(send, HEARTBEAT_MS);
    return () => clearInterval(t);
  }, [present, fight, opened]);

  return present;
}
