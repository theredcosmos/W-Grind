// The "System": turns raw progress into XP, levels, hunter rank, quests and titles.
// Pure functions only — everything is derived from progress, nothing extra is stored.
import { BY_ID, DIFF_XP, LISTS, LIST_KEYS, QUESTIONS, SECTIONS } from './data';
import { addDays, daysBetween, ymd } from './date';

export const REVIEW_XP = 20;
export const QUEST_XP = 100;

// XP needed to go from level L to L+1. Early levels come fast on purpose.
const xpForLevel = (level) => 50 + level * 10;

export const levelFromXp = (xp) => {
  let level = 1;
  let floor = 0;
  while (xp >= floor + xpForLevel(level)) {
    floor += xpForLevel(level);
    level++;
  }
  return { level, into: xp - floor, need: xpForLevel(level) };
};

export const RANKS = [
  { id: 'E', min: 1, name: 'E-Rank', color: '#94a3b8' },
  { id: 'D', min: 10, name: 'D-Rank', color: '#34d399' },
  { id: 'C', min: 20, name: 'C-Rank', color: '#38bdf8' },
  { id: 'B', min: 35, name: 'B-Rank', color: '#818cf8' },
  { id: 'A', min: 50, name: 'A-Rank', color: '#c084fc' },
  { id: 'S', min: 70, name: 'S-Rank', color: '#fbbf24' },
  { id: 'P', min: 85, name: 'Paragon', color: '#fb7185' },
  { id: 'X', min: 95, name: 'Sovereign', color: '#a78bfa' },
];

export const rankForLevel = (level) => [...RANKS].reverse().find((r) => level >= r.min);

export const DAILY_QUESTS = [
  { id: 'solve', label: 'Clear 2 problems', target: 2 },
  { id: 'strong', label: 'Defeat 1 Medium or Hard', target: 1 },
  { id: 'train', label: 'Train 25 min or finish 1 review', target: 1 },
];

const FOCUS_GOAL = 25 * 60;

const questProgress = (day) => ({
  solve: Math.min(day.solves, 2),
  strong: Math.min(day.strong, 1),
  train: day.seconds >= FOCUS_GOAL || day.reviews > 0 ? 1 : 0,
});

const questDone = (day) => {
  const p = questProgress(day);
  return DAILY_QUESTS.every((q) => p[q.id] >= q.target);
};

/** Review schedule for one solved problem: 7 days after solving, then 14. */
export const reviewState = (solvedOn, rev = {}) => {
  if (!rev.r7) return { stage: 'r7', due: addDays(solvedOn, 7) };
  if (!rev.r14) {
    const due = addDays(solvedOn, 14);
    const gap = addDays(rev.r7, 7);
    return { stage: 'r14', due: due > gap ? due : gap };
  }
  return null;
};

export const ACHIEVEMENTS = [
  { id: 'first_blood', name: 'First Blood', desc: 'Clear your first problem', icon: 'Sword', xp: 25, metric: 'solved', target: 1 },
  { id: 'awakened', name: 'The Kindled', desc: 'Clear 10 problems', icon: 'Sparkles', xp: 50, metric: 'solved', target: 10 },
  { id: 'wolf_slayer', name: 'Wolf Slayer', desc: 'Clear 25 problems', icon: 'Crosshair', xp: 75, metric: 'solved', target: 25 },
  { id: 'double_dungeon', name: 'Twin Gate Survivor', desc: 'Clear 50 problems', icon: 'Shield', xp: 100, metric: 'solved', target: 50 },
  { id: 'hundred', name: 'Hundred-Kill Hunter', desc: 'Clear 100 problems', icon: 'Swords', xp: 200, metric: 'solved', target: 100 },
  { id: 'raid_leader', name: 'Raid Leader', desc: 'Clear 250 problems', icon: 'Crown', xp: 400, metric: 'solved', target: 250 },
  { id: 'monarch', name: 'Monarch of the Abyss', desc: 'Defeat every monster in every gate', icon: 'Moon', xp: 1000, metric: 'solved', target: QUESTIONS.length },
  { id: 'giant_slayer', name: 'Giant Slayer', desc: 'Defeat 10 Hard problems', icon: 'Mountain', xp: 150, metric: 'hard', target: 10 },
  { id: 'dragon_slayer', name: 'Dragon Slayer', desc: 'Defeat 50 Hard problems', icon: 'Flame', xp: 400, metric: 'hard', target: 50 },
  { id: 'streak3', name: 'Spark', desc: 'Keep a 3-day streak', icon: 'Zap', xp: 30, metric: 'bestStreak', target: 3 },
  { id: 'streak7', name: 'Relentless', desc: 'Keep a 7-day streak', icon: 'Flame', xp: 100, metric: 'bestStreak', target: 7 },
  { id: 'streak30', name: 'Unbreakable Will', desc: 'Keep a 30-day streak', icon: 'Gem', xp: 500, metric: 'bestStreak', target: 30 },
  { id: 'quest1', name: 'Initiate', desc: 'Complete a full Daily Quest', icon: 'ScrollText', xp: 50, metric: 'questDays', target: 1 },
  { id: 'quest7', name: 'Iron Routine', desc: 'Complete 7 Daily Quests', icon: 'ShieldCheck', xp: 150, metric: 'questDays', target: 7 },
  { id: 'review10', name: 'Memory Keeper', desc: 'Finish 10 spaced reviews', icon: 'Brain', xp: 75, metric: 'reviewsDone', target: 10 },
  { id: 'review50', name: 'Total Recall', desc: 'Finish 50 spaced reviews', icon: 'BrainCircuit', xp: 250, metric: 'reviewsDone', target: 50 },
  { id: 'gate1', name: 'Gate Breaker', desc: 'Fully clear one pattern', icon: 'DoorOpen', xp: 150, metric: 'gatesCleared', target: 1 },
  { id: 'gate5', name: 'Dungeon Conqueror', desc: 'Fully clear 5 patterns', icon: 'Castle', xp: 400, metric: 'gatesCleared', target: 5 },
  { id: 'blind75', name: 'Blind Swordsman', desc: 'Clear all of Blind 75', icon: 'EyeOff', xp: 500, metric: 'list:blind75', target: 75 },
  { id: 'neetcode150', name: 'Guild Elite', desc: 'Clear all of NeetCode 150', icon: 'Award', xp: 750, metric: 'list:neetcode150', target: 150 },
  { id: 'top150', name: 'Vanguard', desc: 'Clear all of Top Interview 150', icon: 'Award', xp: 750, metric: 'list:top150', target: 150 },
  { id: 'striver', name: 'SDE Ready', desc: 'Clear the whole Striver SDE Sheet', icon: 'Trophy', xp: 750, metric: 'list:striver', target: LISTS.striver.items.length },
];

export function computeGame({ completed, reviews, trackedTime }) {
  const today = ymd();
  const days = new Map();
  const day = (d) => {
    if (!days.has(d)) days.set(d, { solves: 0, strong: 0, reviews: 0, seconds: 0 });
    return days.get(d);
  };

  let solvedXp = 0;
  const byDiff = { Easy: 0, Medium: 0, Hard: 0 };
  const solvedIds = new Set();
  for (const [id, date] of Object.entries(completed)) {
    const q = BY_ID.get(id);
    if (!q) continue; // old/removed ids: keep them stored, but don't let them count
    const d = day(date);
    d.solves++;
    solvedIds.add(id);
    solvedXp += DIFF_XP[q.difficulty];
    byDiff[q.difficulty]++;
    if (q.difficulty !== 'Easy') d.strong++;
  }

  let reviewsDone = 0;
  const due = [];
  const upcoming = [];
  for (const id of solvedIds) {
    const rev = reviews[id] || {};
    for (const stage of ['r7', 'r14']) {
      if (rev[stage]) { reviewsDone++; day(rev[stage]).reviews++; }
    }
    const state = reviewState(completed[id], rev);
    if (!state) continue;
    const item = { id, q: BY_ID.get(id), ...state, overdue: daysBetween(state.due, today) };
    if (state.due <= today) due.push(item);
    else if (daysBetween(today, state.due) <= 7) upcoming.push(item);
  }
  due.sort((a, b) => a.due.localeCompare(b.due));
  upcoming.sort((a, b) => a.due.localeCompare(b.due));

  for (const [d, s] of Object.entries(trackedTime)) day(d).seconds += s;

  // Streaks: any day with a solve or a review counts as active.
  const active = new Set([...days].filter(([, v]) => v.solves || v.reviews).map(([d]) => d));
  let streak = 0;
  let cursor = active.has(today) ? today : addDays(today, -1);
  while (active.has(cursor)) { streak++; cursor = addDays(cursor, -1); }
  let bestStreak = 0;
  for (const d of active) {
    if (active.has(addDays(d, -1))) continue;
    let len = 0;
    let c = d;
    while (active.has(c)) { len++; c = addDays(c, 1); }
    bestStreak = Math.max(bestStreak, len);
  }

  let questDays = 0;
  for (const v of days.values()) if (questDone(v)) questDays++;
  const todayStats = day(today);

  const lists = Object.fromEntries(LIST_KEYS.map((k) => {
    const items = LISTS[k].items;
    const done = items.filter((i) => solvedIds.has(i.id)).length;
    return [k, { ...LISTS[k], key: k, total: items.length, done, next: items.find((i) => !solvedIds.has(i.id)) }];
  }));

  const gates = SECTIONS.map((s) => {
    const done = s.questions.filter((q) => solvedIds.has(q.id)).length;
    const boss = s.questions.filter((q) => q.difficulty === 'Hard' && !solvedIds.has(q.id))[0] || null;
    return { ...s, done, total: s.questions.length, cleared: done === s.questions.length, boss };
  });

  const topics = new Set();
  for (const id of solvedIds) topics.add(BY_ID.get(id).pattern);

  const metrics = {
    solved: solvedIds.size,
    hard: byDiff.Hard,
    bestStreak,
    questDays,
    reviewsDone,
    gatesCleared: gates.filter((g) => g.cleared).length,
    ...Object.fromEntries(LIST_KEYS.map((k) => [`list:${k}`, lists[k].done])),
  };
  const achievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    value: Math.min(metrics[a.metric], a.target),
    unlocked: metrics[a.metric] >= a.target,
  }));
  const achievementXp = achievements.reduce((sum, a) => sum + (a.unlocked ? a.xp : 0), 0);

  const xp = solvedXp + reviewsDone * REVIEW_XP + questDays * QUEST_XP + achievementXp;
  const lvl = levelFromXp(xp);
  const rank = rankForLevel(lvl.level);
  const title = [...achievements].reverse().find((a) => a.unlocked)?.name || 'Unawakened';

  const heatmap = {};
  for (const [d, v] of days) heatmap[d] = v.solves + v.reviews;

  return {
    today,
    xp,
    ...lvl,
    rank,
    title,
    streak,
    bestStreak,
    solved: solvedIds.size,
    total: QUESTIONS.length,
    byDiff,
    stats: {
      STR: byDiff.Hard,
      AGI: byDiff.Medium,
      INT: topics.size,
      VIT: bestStreak,
      PER: reviewsDone,
    },
    quest: { progress: questProgress(todayStats), done: questDone(todayStats), today: todayStats },
    questDays,
    lists,
    gates,
    due,
    upcoming,
    achievements,
    heatmap,
  };
}
