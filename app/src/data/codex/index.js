/*
 * Codex tabs, in display order. Content tabs live in their own files (format: schema.js) and load
 * only when opened; the three "Classic" tabs render the original manual.json tables.
 */
export const CODEX_TABS = [
  { key: 'focus', label: 'Unfreeze', group: 'Fight', load: () => import('./focus.js') },
  { key: 'patterns', label: 'Pick the Pattern', group: 'Fight', load: () => import('./patterns.js') },
  { key: 'structures', label: 'Data Structures', group: 'Fight', load: () => import('./structures.js') },
  { key: 'methods', label: 'Methods', group: 'Fight', load: () => import('./methods.js') },
  { key: 'java', label: 'Java Collections', group: 'Fight', load: () => import('./java.js') },
  { key: 'followups', label: 'Follow-ups', group: 'Fight', load: () => import('./followups.js') },
  { key: 'sdcheat', label: 'SD Cheat Sheet', group: 'Design', load: () => import('./sdcheat.js') },
  { key: 'lld', label: 'LLD', group: 'Design', load: () => import('./lld.js') },
  { key: 'hld', label: 'HLD', group: 'Design', load: () => import('./hld.js') },
  { key: 'antiBlank', label: 'Anti-Blank Protocol', group: 'Classic' },
  { key: 'decoder', label: 'Pattern Decoder', group: 'Classic' },
  { key: 'linker', label: 'Element Linker', group: 'Classic' },
];

const cache = new Map();
/** Loads one content tab (cached). */
export const loadTab = (key) => {
  const meta = CODEX_TABS.find((t) => t.key === key);
  if (!meta?.load) return Promise.resolve(null);
  if (!cache.has(key)) cache.set(key, meta.load().then((m) => m.default));
  return cache.get(key);
};

// The Classic decoder and linker tables, shaped like tabs so search covers them too.
const classicTabs = () => import('../manual.json').then(({ default: manual }) => [
  {
    key: 'decoder',
    label: 'Pattern Decoder',
    sections: manual.decoder.rows.map((r, i) => ({
      id: `decoder-${i}`, title: r[1], summary: `${r[2]} → ${r[3]}`, tags: [],
      blocks: [{ type: 'text', text: r[4] }],
    })),
  },
  {
    key: 'linker',
    label: 'Element Linker',
    sections: manual.linker.rows.map((r, i) => ({
      id: `linker-${i}`, title: r[0].replace(/^\d+\.\s*/, ''), summary: r[4], tags: [],
      blocks: [{ type: 'text', text: [r[1], r[2], r[3]].join(' ') }],
    })),
  },
]);

/** Every tab, for search across the whole Codex. */
export const loadAllTabs = () => Promise.all([
  ...CODEX_TABS.filter((t) => t.load).map((t) => loadTab(t.key).catch(() => null)),
  classicTabs(),
]).then((all) => all.flat());

// Plain text of a section, for search.
export const sectionText = (s) => [
  s.title, s.summary, ...(s.tags || []),
  ...s.blocks.flatMap((b) => [
    b.title, b.text, b.code,
    ...(b.items || []).flatMap((i) => (typeof i === 'string' ? [i] : [i.q, i.a])),
    ...(b.head || []), ...(b.rows || []).flat(),
  ]),
].filter(Boolean).join(' ').toLowerCase();
