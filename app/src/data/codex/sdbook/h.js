// Block helpers for the SD Book Notes tab. Shape: ../schema.js. Each helper returns a plain block.

export const t = (text) => ({ type: 'text', text });
export const list = (items, title) => ({ type: 'list', ...(title && { title }), items });
export const steps = (items, title) => ({ type: 'steps', ...(title && { title }), items });
export const table = (head, rows, title) => ({ type: 'table', ...(title && { title }), head, rows });
export const java = (code, title) => ({ type: 'code', lang: 'java', ...(title && { title }), code: code.replace(/^\n/, '') });
export const text = (code, title) => ({ type: 'code', lang: 'text', ...(title && { title }), code: code.replace(/^\n/, '') });
export const key = (txt, title) => ({ type: 'callout', tone: 'key', ...(title && { title }), text: txt });
export const warn = (txt, title) => ({ type: 'callout', tone: 'warn', ...(title && { title }), text: txt });
export const tip = (txt, title) => ({ type: 'callout', tone: 'tip', ...(title && { title }), text: txt });
export const drill = (txt, title = 'Drill') => ({ type: 'callout', tone: 'drill', title, text: txt });
export const qa = (pairs, title = 'Interviewer follow-ups') => ({ type: 'qa', title, items: pairs.map(([q, a]) => ({ q, a })) });

/**
 * A boxes-and-arrows picture. cols: [[node]] left to right; node 'kind:Label' with kind
 * user | svc | lb | db | cache | q | ext | store (default svc). labels[i] = text on arrow after col i.
 *   flow([['user:Client'], ['lb:Load balancer'], ['Web 1', 'Web 2'], ['db:MySQL']], 'Basic setup', ['HTTPS', '', 'SQL'])
 */
export const flow = (cols, title, labels, note) => ({
  type: 'flow', ...(title && { title }), cols, ...(labels && { labels }), ...(note && { note }),
});

const REPO = 'https://github.com/liquidslr/system-design-notes/tree/main/';
/** Link back to the chapter folder (with its original figures) in liquidslr/system-design-notes. */
export const src = (folder) => ({ label: `Source notes and original figures: liquidslr/system-design-notes · ${folder}`, href: REPO + encodeURIComponent(folder).replace(/%2F/g, '/') });
