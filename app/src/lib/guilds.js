// Guilds = curated problem sets. Each guild's deck is its problems grouped into
// pattern cards (sections), each holding subpatterns (topics). All static, built once.
import { LISTS, QUESTIONS, SECTIONS } from './data';

export const GUILDS = [
  {
    key: 'association',
    name: 'The Central Registry',
    tag: 'Government Guild',
    motto: 'The official registry. Every gate on record.',
    color: '#fbbf24',
    crest: 'CR',
    unique: true,
  },
  { key: 'blind75', name: 'Blind 75', tag: 'Strike Guild', motto: 'The 75 that show up in every interview.', color: '#f472b6', crest: 'B75' },
  { key: 'neetcode150', name: 'NeetCode 150', tag: 'Raid Guild', motto: 'Blind 75 expanded into a full roadmap.', color: '#4cc2ff', crest: 'NC' },
  { key: 'top150', name: 'Top Interview 150', tag: 'Vanguard Guild', motto: "LeetCode's own interview roadmap, 23 topics.", color: '#fb923c', crest: 'TI' },
  { key: 'striver', name: 'Striver SDE', tag: 'Training Guild', motto: 'The day-by-day SDE interview sheet.', color: '#a78bfa', crest: 'SDE' },
];

export const GUILD_BY_KEY = Object.fromEntries(GUILDS.map((g) => [g.key, g]));

const members = (key) => (key === 'association' ? null : new Set(LISTS[key].items.map((i) => i.id)));

const buildDeck = (key) => {
  const set = members(key);
  const keep = (q) => !set || set.has(q.id);
  return SECTIONS.map((s) => {
    const topics = s.topics
      .map((t) => ({ name: t.name, questions: t.questions.filter(keep) }))
      .filter((t) => t.questions.length);
    return { name: s.name, rank: s.rank, topics, questions: s.questions.filter(keep) };
  }).filter((p) => p.questions.length);
};

export const DECKS = Object.fromEntries(GUILDS.map((g) => [g.key, buildDeck(g.key)]));

export const GUILD_QUESTIONS = Object.fromEntries(
  GUILDS.map((g) => {
    const set = members(g.key);
    return [g.key, set ? QUESTIONS.filter((q) => set.has(q.id)) : QUESTIONS];
  }),
);
