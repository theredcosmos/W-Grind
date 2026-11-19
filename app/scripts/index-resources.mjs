// Builds the search index for the Codex "Visual" tabs: the interactive pages in public/resources/
// are shown in an iframe, so Codex search cannot see inside them. This reads each page's panels
// (<section class="panel" id="p-...">) and writes their id, title and text to
// src/data/codex/visual-index.json. Re-run after replacing a page:
//
//   node scripts/index-resources.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const app = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = [
  { key: 'dsaVisual', file: 'dsa-visual.html' },
  { key: 'sdVisual', file: 'lld-hld-visual.html' },
];

const decode = (s) => s
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&rarr;/g, '→').replace(/&middot;/g, '·');
const plain = (html) => decode(html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' '))
  .replace(/\s+/g, ' ')
  .trim();
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const index = {};
for (const { key, file } of PAGES) {
  const html = readFileSync(join(app, 'public', 'resources', file), 'utf8');
  const starts = [...html.matchAll(/<section class="panel[^"]*" id="p-([^"]+)"[^>]*>/g)];
  const sections = starts.map((m, i) => {
    const id = m[1];
    const span = html.slice(m.index, i + 1 < starts.length ? starts[i + 1].index : html.indexOf('</main>', m.index));
    const h2 = span.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    // Panels drawn by the page's own script have no static heading: use its menu label instead.
    const menu = html.match(new RegExp(`\\["${escapeRe(id)}",\\s*"([^"]+)"`));
    const title = (h2 && plain(h2[1])) || (menu && decode(menu[1])) || id;
    const body = plain(span).replace(title, '').trim();
    return { id, title, text: body.slice(0, 4000) };
  });
  // Follow the page's own menu order when it has one (var ORDER=[[id, label], ...]).
  const order = html.match(/var ORDER=(\[\[[\s\S]*?\]\]);/);
  const rank = order ? new Map(JSON.parse(order[1]).map(([id], n) => [id, n])) : new Map();
  index[key] = sections.sort((a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9));
  console.log(`${file}: ${index[key].length} sections`);
}
writeFileSync(join(app, 'src', 'data', 'codex', 'visual-index.json'), `${JSON.stringify(index, null, 1)}\n`);
