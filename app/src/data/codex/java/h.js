// Block helpers for the Java Cheatsheet tab. Shape: ../schema.js.

export const t = (text) => ({ type: 'text', text });
export const list = (items, title) => ({ type: 'list', ...(title && { title }), items });
export const table = (head, rows, title) => ({ type: 'table', ...(title && { title }), head, rows });
export const key = (txt, title) => ({ type: 'callout', tone: 'key', ...(title && { title }), text: txt });
export const warn = (txt, title) => ({ type: 'callout', tone: 'warn', ...(title && { title }), text: txt });
export const tip = (txt, title) => ({ type: 'callout', tone: 'tip', ...(title && { title }), text: txt });
export const drill = (txt, title = 'Drill') => ({ type: 'callout', tone: 'drill', title, text: txt });

/**
 * One recipe card: a "how do I…" task, a copy-ready Java snippet, and optionally a one-line note
 * (when to use it, the trap) and a cost.
 *   r('Count how often each number appears', `map.merge(x, 1, Integer::sum);`, 'O(1)', 'Note.')
 */
export const r = (task, code, cost, note) => ({
  task, code: code.replace(/^\n/, '').replace(/\n\s*$/, ''), ...(cost && { cost }), ...(note && { note }),
});

/** A group of recipe cards under one heading, e.g. recipes('Read and update', [r(...), ...]). */
export const recipes = (title, items) => ({ type: 'recipes', title, items });

/** The cost table at the end of a section: [operation, call, time]. */
export const costs = (rows) => table(['Operation', 'Call', 'Time'], rows, 'Cost of each call');
