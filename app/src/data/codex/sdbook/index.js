// Codex tab: chapter-by-chapter notes on System Design Interview Vol 1 and 2 (Alex Xu), rewritten
// from liquidslr/system-design-notes for a short-attention reader. Every chapter has an HLD part
// (boxes and arrows) and an LLD part (the core class or algorithm in Java).
import part1 from './part1.js';
import part2 from './part2.js';
import part3 from './part3.js';
import part4 from './part4.js';

export default {
  key: 'sdbook',
  label: 'SD Book Notes',
  intro: 'All 28 chapters of System Design Interview Vol 1 and 2, one card each: the gist, a picture, the HLD, the LLD code core, traps, and a drill. Open one, read Quick view, tick it off.',
  sections: [...part1, ...part2, ...part3, ...part4],
};
