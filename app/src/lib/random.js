import { QUESTIONS } from './data';
import { userKey } from './session';

/**
 * "Random Gate" draws from a shuffled bag: a question is never offered twice until
 * every unsolved question has been offered once. The bag is remembered per user.
 */
export function drawRandom(username, completed) {
  const key = userKey(username, 'randomSeen');
  let seen;
  try {
    seen = new Set(JSON.parse(localStorage.getItem(key)) || []);
  } catch {
    seen = new Set();
  }
  let pool = QUESTIONS.filter((q) => !completed[q.id] && !seen.has(q.id));
  if (!pool.length) {
    seen = new Set();
    pool = QUESTIONS.filter((q) => !completed[q.id]);
  }
  if (!pool.length) return null;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  seen.add(pick.id);
  try { localStorage.setItem(key, JSON.stringify([...seen])); } catch { /* storage full */ }
  return pick;
}

/** First unsolved item of each list, never repeating a question another list already suggests. */
export function distinctNextTargets(lists, completed) {
  const taken = new Set();
  return lists.map((l) => {
    const item = l.items.find((i) => !completed[i.id] && !taken.has(i.id)) || null;
    if (item) taken.add(item.id);
    return item;
  });
}
