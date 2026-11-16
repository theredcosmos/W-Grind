// Codex tab: Java Cheatsheet. One section per data structure, each a recipe book of small
// copy-ready snippets for the jobs you actually do while solving ("update if it exists", "loop key
// and value", "remove while looping"...). Every snippet is compile-checked with javac:
//   node scripts/check-recipes.mjs src/data/codex/java/index.js
import hashmap from './hashmap.js';
import hashset from './hashset.js';
import arrays from './arrays.js';
import arraylist from './arraylist.js';
import strings from './strings.js';
import sorting from './sorting.js';
import stack from './stack.js';
import queue from './queue.js';
import heap from './heap.js';
import treemap from './treemap.js';
import treeset from './treeset.js';
import linkedhashmap from './linkedhashmap.js';
import nodes from './nodes.js';
import graphs from './graphs.js';
import numbers from './numbers.js';

export default {
  key: 'java',
  label: 'Java Cheatsheet',
  intro: 'Blank on syntax? Open the structure, find the job ("update if it exists", "loop key and value"), copy the snippet. Every card compiles. Type in the filter box inside a card to jump straight to a recipe.',
  sections: [hashmap, hashset, arrays, arraylist, strings, sorting, stack, queue, heap, treemap, treeset, linkedhashmap, nodes, graphs, numbers],
};
