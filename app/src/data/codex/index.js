/*
 * Codex tabs, in display order. Content tabs live in their own files (format: schema.js) and load
 * only when opened; the three "Classic" tabs are built from the original manual.json (./classic.js).
 * "Visual" tabs (with `frame`) show an interactive page from public/resources/ in an iframe; their
 * sections come from visual-index.json (scripts/index-resources.mjs) so search can reach them.
 */
const visualTab = (key, label, intro) => () => import('./visual-index.json').then(({ default: index }) => ({
  default: {
    key, label, intro,
    sections: index[key].map((s) => ({
      id: s.id, title: s.title, summary: s.text.slice(0, 140) || 'Interactive section', tags: ['visual', 'interactive'],
      blocks: [{ type: 'text', text: s.text || s.title }],
    })),
  },
}));

export const CODEX_TABS = [
  {
    key: 'dsaVisual', label: 'DSA Visual', group: 'Visual', frame: '/resources/dsa-visual.html',
    load: visualTab('dsaVisual', 'DSA Visual', 'Animated data structures and patterns in Java, with a pattern playbook and a LeetCode roadmap.'),
  },
  {
    key: 'sdVisual', label: 'LLD & HLD Visual', group: 'Visual', frame: '/resources/lld-hld-visual.html',
    load: visualTab('sdVisual', 'LLD & HLD Visual', 'Interactive LLD labs, HLD visual labs, worked designs and an estimation calculator.'),
  },
  { key: 'focus', label: 'Unfreeze', group: 'Fight', load: () => import('./focus.js') },
  { key: 'java', label: 'Java Cheatsheet', group: 'Fight', load: () => import('./java/index.js') },
  { key: 'patterns', label: 'Pick the Pattern', group: 'Fight', load: () => import('./patterns.js') },
  { key: 'structures', label: 'Data Structures', group: 'Fight', load: () => import('./structures.js') },
  { key: 'methods', label: 'Methods', group: 'Fight', load: () => import('./methods.js') },
  { key: 'followups', label: 'Follow-ups', group: 'Fight', load: () => import('./followups.js') },
  { key: 'sdcheat', label: 'SD Cheat Sheet', group: 'Design', load: () => import('./sdcheat.js') },
  { key: 'lld', label: 'LLD', group: 'Design', load: () => import('./lld.js') },
  { key: 'hld', label: 'HLD', group: 'Design', load: () => import('./hld.js') },
  { key: 'sdbook', label: 'SD Book Notes', group: 'Design', load: () => import('./sdbook/index.js') },
  { key: 'antiBlank', label: 'Anti-Blank Protocol', group: 'Classic', load: () => import('./classic.js').then((m) => ({ default: m.antiBlank })) },
  { key: 'decoder', label: 'Pattern Decoder', group: 'Classic', load: () => import('./classic.js').then((m) => ({ default: m.decoder })) },
  { key: 'linker', label: 'Element Linker', group: 'Classic', load: () => import('./classic.js').then((m) => ({ default: m.linker })) },
];

const cache = new Map();
/** Loads one content tab (cached). */
export const loadTab = (key) => {
  const meta = CODEX_TABS.find((t) => t.key === key);
  if (!meta?.load) return Promise.resolve(null);
  if (!cache.has(key)) cache.set(key, meta.load().then((m) => m.default));
  return cache.get(key);
};

/** Every tab, for search across the whole Codex. */
export const loadAllTabs = () => Promise.all(CODEX_TABS.map((t) => loadTab(t.key).catch(() => null)));

// Plain text of a section, for search.
export const sectionText = (s) => [
  s.title, s.summary, ...(s.tags || []),
  ...s.blocks.flatMap((b) => [
    b.title, b.text, b.code,
    ...(b.items || []).flatMap((i) => (typeof i === 'string' ? [i] : [i.q, i.a, i.task, i.note, i.code])),
    ...(b.head || []), ...(b.rows || []).flat(),
    ...(b.cols || []).flat().map((n) => n.replace(/^\w+:/, '')), ...(b.labels || []), b.note,
  ]),
].filter(Boolean).join(' ').toLowerCase();
