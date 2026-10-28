// Tiny pub/sub for System notifications so firing a toast never re-renders the app tree.
const listeners = new Set();
let seq = 0;

export const notify = (message) => {
  const event = { id: ++seq, ...message };
  listeners.forEach((fn) => fn(event));
};

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
