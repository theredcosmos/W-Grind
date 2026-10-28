// Game names layered over the real DSA taxonomy: each pattern (section) is a Gate,
// each subpattern (topic) is a Floor inside it, and each problem is a Monster.
// All names are original and generated deterministically, so they never change between loads.
import { QUESTIONS, SECTIONS } from './data';

export const GATE_NAMES = {
  Arrays: 'The Iron Corridor',
  Strings: 'The Thread Labyrinth',
  'Linked Lists': 'The Chained Crypt',
  'Stacks & Queues': 'The Tower of Echoes',
  'Binary Search': 'The Halving Chasm',
  Trees: 'The Rootbound Wilds',
  'Heaps & Priority Queues': 'The Ember Pyre',
  Graphs: 'The Web of Ways',
  'Dynamic Programming': 'The Memory Vault',
  Backtracking: 'The Mirror Maze',
  'Greedy Algorithms': "The Glutton's Bazaar",
  'Hashing, Math & Bit Manipulation': 'The Rune Archive',
  'System Design & Data Structure Design': 'The Golem Foundry',
};

export const gateName = (section) => GATE_NAMES[section] || `Gate of ${section}`;

// Floor number of each topic within its section, in sheet order.
const FLOOR = new Map();
for (const s of SECTIONS) s.topics.forEach((t, i) => FLOOR.set(`${s.name}|${t.name}`, i + 1));
export const floorOf = (section, topic) => FLOOR.get(`${section}|${topic}`) || 1;

// Creature class depends on difficulty; the epithet depends on the gate.
const CREATURES = {
  Easy: ['Imp', 'Wisp', 'Sprite', 'Slime', 'Gremlin', 'Kobold', 'Mite'],
  Medium: ['Ghoul', 'Wraith', 'Gargoyle', 'Harpy', 'Troll', 'Basilisk', 'Revenant', 'Ogre'],
  Hard: ['Wyrm', 'Leviathan', 'Behemoth', 'Lich', 'Colossus', 'Chimera', 'Hydra'],
};
const EPITHET = {
  Arrays: 'Iron', Strings: 'Thread', 'Linked Lists': 'Chain', 'Stacks & Queues': 'Tower',
  'Binary Search': 'Chasm', Trees: 'Root', 'Heaps & Priority Queues': 'Ember', Graphs: 'Web',
  'Dynamic Programming': 'Echo', Backtracking: 'Mirror', 'Greedy Algorithms': 'Glutton',
  'Hashing, Math & Bit Manipulation': 'Rune', 'System Design & Data Structure Design': 'Forge',
};
const START = ['Vor', 'Kael', 'Mor', 'Zar', 'Thal', 'Gri', 'Ny', 'Os', 'Ul', 'Vex', 'Dra', 'Sel', 'Quo', 'Ash', 'Bel', 'Cor', 'Fen', 'Hex', 'Ix', 'Ro'];
const MID = ['a', 'e', 'i', 'o', 'u', 'ae', 'y', 'ou', 'ai', 'ei'];
const END = ['th', 'rax', 'mor', 'nis', 'gul', 'dra', 'ven', 'lok', 'zir', 'sha', 'kon', 'rith', 'mael', 'tus', 'vyn', 'gor'];

const hash = (str) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** id -> { name: 'Vexmor', kind: 'Chain Ghoul' }, unique names across all problems. */
export const MONSTERS = (() => {
  const used = new Set();
  const out = new Map();
  for (const q of QUESTIONS) {
    let h = hash(q.id);
    let name;
    do {
      name = START[h % START.length] + MID[(h >>> 5) % MID.length] + END[(h >>> 11) % END.length];
      h = hash(`${h}`);
    } while (used.has(name));
    used.add(name);
    const pool = CREATURES[q.difficulty];
    const kind = `${EPITHET[q.section] || 'Rift'} ${pool[(hash(q.id) >>> 3) % pool.length]}`;
    out.set(q.id, { name, kind });
  }
  return out;
})();

export const monsterOf = (id) => MONSTERS.get(id) || { name: 'Unknown', kind: 'Rift Wisp' };
