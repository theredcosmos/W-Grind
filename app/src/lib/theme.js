// Visual constants shared by several components.
import {
  Award, Boxes, Brain, BrainCircuit, Castle, Coins, Crosshair, Crown, DoorOpen, EyeOff, Flame, Gem,
  GitBranch, Hash, Layers, LayoutGrid, Link, Moon, Mountain, Network, ScrollText, Search, Share2,
  Shield, ShieldCheck, Sparkles, Sword, Swords, Table, Triangle, Trophy, Type, Zap,
} from 'lucide-react';

// Emblem drawn on each pattern card.
export const SECTION_ICONS = {
  Arrays: LayoutGrid,
  Strings: Type,
  'Linked Lists': Link,
  'Stacks & Queues': Layers,
  'Binary Search': Search,
  Trees: Network,
  'Heaps & Priority Queues': Triangle,
  Graphs: Share2,
  'Dynamic Programming': Table,
  Backtracking: GitBranch,
  'Greedy Algorithms': Coins,
  'Hashing, Math & Bit Manipulation': Hash,
  'System Design & Data Structure Design': Boxes,
};

export const RANK_COLOR = { E: '#94a3b8', D: '#34d399', C: '#38bdf8', B: '#818cf8', A: '#c084fc', S: '#fbbf24' };

export const ACHIEVEMENT_ICONS = {
  Award, Brain, BrainCircuit, Castle, Crosshair, Crown, DoorOpen, EyeOff, Flame, Gem,
  Moon, Mountain, ScrollText, Shield, ShieldCheck, Sparkles, Sword, Swords, Trophy, Zap,
};

export const LIST_STYLE = {
  blind75: { color: '#f472b6', bg: 'rgb(244 114 182 / 0.1)' },
  neetcode150: { color: '#4cc2ff', bg: 'rgb(76 194 255 / 0.1)' },
  striver: { color: '#a78bfa', bg: 'rgb(167 139 250 / 0.12)' },
  top150: { color: '#fb923c', bg: 'rgb(251 146 60 / 0.12)' },
};

