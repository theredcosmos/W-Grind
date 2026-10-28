import { DECKS, GUILD_BY_KEY } from './guilds';

export const LAST_GUILD_KEY = 'lastGuild';

export const currentGuildKey = () => {
  try {
    const k = localStorage.getItem(LAST_GUILD_KEY);
    return GUILD_BY_KEY[k] ? k : 'association';
  } catch {
    return 'association';
  }
};

/**
 * "Enter today's gate": the one thing to do next, so there is nothing to decide.
 *   1. A spaced review that is due.
 *   2. Otherwise the floor you've started but are weakest in (lowest % cleared) in your current guild.
 *   3. Otherwise the first untouched floor, in roadmap order.
 */
export function todaysGate(game, completed, guildKey = currentGuildKey()) {
  if (game.due.length) return { kind: 'review', item: game.due[0], count: game.due.length };

  const floors = [];
  for (const p of DECKS[guildKey]) {
    for (const t of p.topics) {
      const done = t.questions.filter((q) => completed[q.id]).length;
      if (done < t.questions.length) floors.push({ pattern: p, topic: t, done, total: t.questions.length });
    }
  }
  if (!floors.length) return { kind: 'done', guildKey };

  const started = floors.filter((f) => f.done > 0).sort((a, b) => a.done / a.total - b.done / b.total);
  const pick = started[0] || floors[0];
  const q = pick.topic.questions.find((x) => !completed[x.id]);
  return { kind: 'new', q, pattern: pick.pattern.name, topic: pick.topic.name, guildKey, resumed: !!started[0] };
}
