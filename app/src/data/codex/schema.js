/*
 * Shape of one Codex tab (src/data/codex/<key>.js, default export), rendered by CodexPage.
 *
 * {
 *   key: 'structures',                  // URL slug: #/codex/structures
 *   label: 'Data Structures',           // tab name (short)
 *   intro: 'One or two sentences on what this tab trains.',
 *   sections: [{
 *     id: 'hashmap',                    // unique within the tab, kebab-case
 *     title: 'HashMap',
 *     summary: 'One line: what it is for.',
 *     tags: ['lookup', 'counting'],     // search words
 *     blocks: [Block, ...],
 *   }],
 * }
 *
 * Block types (text fields may use `backticks` for inline code and **double stars** for bold):
 *   { type: 'text', text }
 *   { type: 'list', title?, items: [string] }               bullets
 *   { type: 'steps', title?, items: [string] }              numbered
 *   { type: 'table', title?, head: [string], rows: [[string]] }
 *   { type: 'code', title?, lang: 'java' | 'text', code }   multi-line, no tabs
 *   { type: 'callout', tone: 'tip' | 'warn' | 'key' | 'drill', title?, text }
 *   { type: 'qa', title?, items: [{ q, a }] }
 *   { type: 'flow', title?, cols: [[node]], labels?: [string], note? }
 *       A left-to-right picture: each col is a stack of boxes, arrows run between cols (labels[i]
 *       sits on the arrow after col i). A node is 'Label' or 'kind:Label', kind one of
 *       user | svc | lb | db | cache | q | ext | store. Stacks top-to-bottom on phones.
 *
 * Optional on a section: source: { label, href } for a "where this came from" link.
 *
 * Run `node src/data/codex/schema.js <file>` from app/ to check a tab file.
 */

const BLOCKS = {
  text: (b) => typeof b.text === 'string',
  list: (b) => Array.isArray(b.items) && b.items.every((i) => typeof i === 'string'),
  steps: (b) => Array.isArray(b.items) && b.items.every((i) => typeof i === 'string'),
  table: (b) => Array.isArray(b.head) && Array.isArray(b.rows) && b.rows.every((r) => Array.isArray(r) && r.length === b.head.length && r.every((c) => typeof c === 'string')),
  code: (b) => typeof b.code === 'string' && ['java', 'text'].includes(b.lang) && !b.code.includes('\t'),
  callout: (b) => typeof b.text === 'string' && ['tip', 'warn', 'key', 'drill'].includes(b.tone),
  qa: (b) => Array.isArray(b.items) && b.items.every((i) => typeof i.q === 'string' && typeof i.a === 'string'),
  flow: (b) => Array.isArray(b.cols) && b.cols.length > 0
    && b.cols.every((c) => Array.isArray(c) && c.length > 0 && c.every((n) => typeof n === 'string' && /^((user|svc|lb|db|cache|q|ext|store):)?[^:]/.test(n)))
    && (b.labels === undefined || (Array.isArray(b.labels) && b.labels.length <= b.cols.length - 1 && b.labels.every((l) => typeof l === 'string')))
    && (b.note === undefined || typeof b.note === 'string'),
};

/** Returns a list of problems (empty when the tab is valid). */
export function validateTab(tab) {
  const errors = [];
  for (const f of ['key', 'label', 'intro']) if (typeof tab?.[f] !== 'string' || !tab[f]) errors.push(`missing ${f}`);
  if (!Array.isArray(tab?.sections) || !tab.sections.length) return [...errors, 'no sections'];
  const ids = new Set();
  tab.sections.forEach((s, i) => {
    const where = `section ${i} (${s.id})`;
    if (!/^[a-z0-9-]+$/.test(s.id || '')) errors.push(`${where}: bad id`);
    if (ids.has(s.id)) errors.push(`${where}: duplicate id`);
    ids.add(s.id);
    for (const f of ['title', 'summary']) if (typeof s[f] !== 'string' || !s[f]) errors.push(`${where}: missing ${f}`);
    if (!Array.isArray(s.tags)) errors.push(`${where}: tags must be an array`);
    if (!Array.isArray(s.blocks) || !s.blocks.length) errors.push(`${where}: no blocks`);
    if (s.source !== undefined && !(typeof s.source?.label === 'string' && /^https:\/\//.test(s.source?.href || ''))) errors.push(`${where}: bad source`);
    (s.blocks || []).forEach((b, j) => {
      const ok = BLOCKS[b?.type];
      if (!ok) errors.push(`${where} block ${j}: unknown type ${b?.type}`);
      else if (!ok(b)) errors.push(`${where} block ${j}: bad ${b.type} block`);
    });
  });
  return errors;
}

// CLI: node src/data/codex/schema.js src/data/codex/structures.js
if (typeof process !== 'undefined' && process.argv[1]?.endsWith('schema.js') && process.argv[2]) {
  const { pathToFileURL } = await import('node:url');
  const { resolve } = await import('node:path');
  const mod = await import(pathToFileURL(resolve(process.argv[2])).href);
  const errors = validateTab(mod.default);
  const s = mod.default?.sections || [];
  const blocks = s.reduce((n, x) => n + (x.blocks?.length || 0), 0);
  console.log(errors.length ? `INVALID\n- ${errors.join('\n- ')}` : `OK: ${s.length} sections, ${blocks} blocks`);
  process.exitCode = errors.length ? 1 : 0;
}
