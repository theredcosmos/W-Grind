// The three Classic tabs (Anti-Blank Protocol, Pattern Decoder, Element Linker), built from the
// original manual.json tables into the normal tab shape (./schema.js), so every card opens in the
// Codex reading window like the rest of the Codex.
import manual from '../manual.json';

const ACRONYMS = /\b(Adhd|Dsa|Lru|Bfs|Dfs|Dp)\b/g;
const titleCase = (s) => s
  .replace(/^\d+\.\s*/, '')
  .toLowerCase()
  .replace(/(^|[\s(/'-])(\w)/g, (m, a, b) => a + b.toUpperCase())
  .replace(ACRONYMS, (w) => w.toUpperCase())
  .replace(/\bLeetcode\b/g, 'LeetCode');

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48).replace(/^-+|-+$/g, '');

// A script line is code-like when it has comments or several lines; otherwise it reads as advice.
const doThis = (text) => (text.includes('\n') || text.trimStart().startsWith('#')
  ? { type: 'code', lang: 'text', title: 'Do this', code: text.replace(/\t/g, '    ') }
  : { type: 'callout', tone: 'drill', title: 'Do this', text });

// Anti-Blank: one section per part of the protocol, each step a card with its action.
const antiBlankSections = () => {
  const groups = new Map();
  for (const r of manual.antiBlank.rows) {
    if (!groups.has(r[0])) groups.set(r[0], []);
    groups.get(r[0]).push(r);
  }
  return [...groups].map(([name, rows]) => ({
    id: slug(titleCase(name)),
    title: titleCase(name),
    summary: rows.map((r) => r[1]).join(' · '),
    tags: ['anti-blank', 'adhd', 'protocol'],
    blocks: rows.flatMap((r) => [
      { type: 'callout', tone: 'key', title: r[1], text: r[2] },
      doThis(r[3]),
    ]),
  }));
};

export const antiBlank = {
  key: 'antiBlank',
  label: 'Anti-Blank Protocol',
  intro: 'The original protocol for when your mind goes blank: why it happens, the 90-second unfreeze ritual, and how to run a live round and practice.',
  sections: antiBlankSections(),
};

export const decoder = {
  key: 'decoder',
  label: 'Pattern Decoder',
  intro: 'Read a clue in the prompt (input size, a keyword) and decode it into the pattern to try.',
  sections: manual.decoder.rows.map((r, i) => ({
    id: `decoder-${i}-${slug(r[1])}`,
    title: r[1],
    summary: `${titleCase(r[0])}: ${r[2]} → ${r[3]}`,
    tags: ['decoder', titleCase(r[0]).toLowerCase()],
    blocks: [
      { type: 'text', text: r[4] },
      { type: 'table', title: 'Decode', head: ['Clue', 'Complexity', 'Try'], rows: [[r[1], r[2], r[3]]] },
    ],
  })),
};

export const linker = {
  key: 'linker',
  label: 'Element Linker',
  intro: 'Pairs of data structures that solve a problem together: what each one gives, and the glue that links them.',
  sections: manual.linker.rows.map((r, i) => ({
    id: `linker-${i}-${slug(r[0].replace(/^\d+\.\s*/, ''))}`,
    title: r[0].replace(/^\d+\.\s*/, ''),
    summary: r[4],
    tags: ['linker', 'combo'],
    blocks: [
      { type: 'list', title: 'What each piece gives', items: [r[1], r[2]] },
      { type: 'callout', tone: 'key', title: 'The glue', text: r[3] },
      { type: 'callout', tone: 'tip', title: 'Used in', text: r[4] },
    ],
  })),
};
