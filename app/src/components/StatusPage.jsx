import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, Dices, Flame, Lock, Pause, Play, Timer } from 'lucide-react';
import { BY_ID, QUESTIONS } from '../lib/data';
import { DAILY_QUESTS, QUEST_XP, RANKS } from '../lib/game';
import { addDays, formatDuration, parseYmd, ymd } from '../lib/date';
import { ACHIEVEMENT_ICONS, LIST_STYLE } from '../lib/theme';
import { Bar, DiffPill, Ring } from './ui';

const STAT_INFO = {
  STR: 'Hard problems defeated',
  AGI: 'Medium problems cleared',
  INT: 'Distinct patterns learned',
  VIT: 'Best streak (days)',
  PER: 'Spaced reviews finished',
};

// Ticks once a second but only re-renders itself.
const Countdown = memo(function Countdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const left = Math.max(0, Math.floor((midnight - now) / 1000));
  const hh = String(Math.floor(left / 3600)).padStart(2, '0');
  const mm = String(Math.floor((left % 3600) / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return <span className="font-mono tabular">{hh}:{mm}:{ss}</span>;
});

function HunterCard({ game, username }) {
  const nextRank = RANKS.find((r) => r.min > game.level);
  return (
    <section className="sys-window p-6 lg:col-span-7">
      <div className="flex items-center justify-between mb-5">
        <span className="sys-label">Status</span>
        <span className="text-xs text-faint">Total XP <span className="text-dim tabular">{game.xp.toLocaleString()}</span></span>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="text-center">
          <div className="sys-heading text-[64px] leading-none text-white glow-text tabular">{game.level}</div>
          <div className="sys-label text-[10px] mt-1 text-dim">Level</div>
        </div>
        <div className="flex-1 min-w-[220px]">
          <div className="text-xs text-faint mb-0.5">Name</div>
          <div className="sys-heading text-xl mb-2 truncate">{username}</div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <div><span className="text-faint">Rank </span><span className="font-semibold" style={{ color: game.rank.color }}>{game.rank.name}</span></div>
            <div><span className="text-faint">Title </span><span className="font-semibold text-ink">{game.title}</span></div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-dim">EXP</span>
              <span className="text-dim tabular">{game.into} / {game.need}</span>
            </div>
            <Bar value={game.into} total={game.need} className="h-2" />
            {nextRank && <div className="text-[11px] text-faint mt-1.5">{nextRank.name} unlocks at Lv. {nextRank.min}</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-6">
        {Object.entries(game.stats).map(([k, v]) => (
          <div key={k} className="card px-2 py-3 text-center" title={STAT_INFO[k]}>
            <div className="sys-label text-[10px] text-dim">{k}</div>
            <div className="sys-heading text-xl mt-1 tabular">{v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DailyQuest({ game }) {
  const p = game.quest.progress;
  const t = game.quest.today;
  const detail = {
    solve: `${t.solves}/2`,
    strong: `${t.strong}/1`,
    train: t.reviews > 0 ? 'review done' : `${Math.floor(t.seconds / 60)}/25 min`,
  };
  return (
    <section className="sys-window p-6 lg:col-span-5 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <span className="sys-label">Daily Quest</span>
        <span className="text-xs text-dim flex items-center gap-1.5"><Timer size={13} /> <Countdown /></span>
      </div>
      <h2 className="sys-heading text-lg mb-4">Preparations to Become Powerful</h2>
      <ul className="space-y-2.5 flex-1">
        {DAILY_QUESTS.map((q) => {
          const done = p[q.id] >= q.target;
          return (
            <li key={q.id} className={`flex items-center gap-3 card px-3.5 py-3 ${done ? 'border-sys/40' : ''}`}>
              {done ? <CheckCircle2 size={18} className="text-sys shrink-0" /> : <Circle size={18} className="text-faint shrink-0" />}
              <span className={`text-sm flex-1 ${done ? 'text-dim line-through decoration-sys/50' : ''}`}>{q.label}</span>
              <span className="text-xs text-dim tabular">{detail[q.id]}</span>
            </li>
          );
        })}
      </ul>
      <div className={`mt-4 text-[12.5px] rounded-lg px-3 py-2.5 border ${game.quest.done ? 'border-sys/40 bg-sys/10 text-sys' : 'border-hard/25 bg-hard/[0.06] text-hard/90'}`}>
        {game.quest.done
          ? `Quest complete. Reward: +${QUEST_XP} XP. The System acknowledges your effort.`
          : `Reward: +${QUEST_XP} XP. Warning: miss today and your ${game.streak}-day streak resets.`}
      </div>
    </section>
  );
}

function PathCards({ game, onOpen }) {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {Object.values(game.lists).map((l) => {
        const next = l.next && BY_ID.get(l.next.id);
        const color = LIST_STYLE[l.key].color;
        return (
          <section key={l.key} className="card card-hover p-5 flex flex-col">
            <div className="flex items-center gap-4">
              <Ring value={l.done} total={l.total} size={58} stroke={6} color={color}>
                <span className="text-xs font-bold tabular">{Math.round((l.done / l.total) * 100)}%</span>
              </Ring>
              <div className="min-w-0">
                <a href={`#/guilds/${l.key}`} className="sys-heading text-[15px] hover:underline underline-offset-4">{l.name}</a>
                <div className="text-xs text-dim tabular">{l.done} / {l.total} cleared</div>
              </div>
            </div>
            {next ? (
              <button onClick={() => onOpen(next.id)} className="mt-4 text-left rounded-lg border border-line px-3 py-2.5 hover:border-line-strong transition-colors group">
                <div className="text-[10.5px] uppercase tracking-wider text-faint mb-1">Next target · {l.next.group}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate flex-1 group-hover:text-white">{next.title}</span>
                  <DiffPill difficulty={next.difficulty} />
                </div>
              </button>
            ) : (
              <div className="mt-4 text-sm text-sys">Path complete. Legendary.</div>
            )}
          </section>
        );
      })}
    </div>
  );
}

const FocusDungeon = memo(function FocusDungeon({ todaySeconds, onAddTime }) {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  const savedRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now() - elapsed * 1000;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // Bank time every minute so a closed tab doesn't lose the session.
  const elapsedRef = useRef(0);
  useEffect(() => {
    elapsedRef.current = elapsed;
    if (elapsed - savedRef.current >= 60) {
      onAddTime(elapsed - savedRef.current);
      savedRef.current = elapsed;
    }
  }, [elapsed, onAddTime]);
  // Navigating away mid-run banks whatever is left.
  useEffect(() => () => onAddTime(elapsedRef.current - savedRef.current), [onAddTime]);

  const stop = () => {
    onAddTime(elapsed - savedRef.current);
    savedRef.current = 0;
    setElapsed(0);
    setRunning(false);
  };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const hardStop = elapsed >= 20 * 60;

  return (
    <section className="card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="sys-label">Instant Dungeon</span>
        <span className="text-xs text-dim">Today {formatDuration(todaySeconds + elapsed - savedRef.current)}</span>
      </div>
      <div className="flex items-center gap-5">
        <Ring value={Math.min(elapsed, 1500)} total={1500} size={92} stroke={7} color={hardStop ? 'var(--color-gold)' : 'var(--color-sys)'}>
          <span className="font-mono text-lg tabular">{mm}:{ss}</span>
        </Ring>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-dim leading-snug mb-3">
            {hardStop
              ? '20-minute hard stop reached. Stuck? Read the trigger hint, then the solution. No shame.'
              : running
                ? 'Hands typing within 5 seconds. Strip the costume: input, constraint, goal.'
                : 'Start a focused run. Time counts toward today’s quest.'}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setRunning((r) => !r)} className="btn btn-sys">
              {running ? <><Pause size={15} /> Pause</> : <><Play size={15} /> {elapsed ? 'Resume' : 'Enter'}</>}
            </button>
            {elapsed > 0 && <button onClick={stop} className="btn">Exit & save</button>}
          </div>
        </div>
      </div>
    </section>
  );
});

function Heatmap({ heatmap, streak, bestStreak }) {
  const weeks = 22;
  const cells = useMemo(() => {
    const today = ymd();
    const start = addDays(today, -(weeks * 7 - 1) - parseYmd(today).getDay() + 6);
    return Array.from({ length: weeks * 7 }, (_, i) => {
      const d = addDays(start, i);
      return { d, n: heatmap[d] || 0, future: d > today };
    });
  }, [heatmap]);
  const shade = (n) => (n === 0 ? 'rgb(255 255 255 / 0.05)' : n === 1 ? 'rgb(76 194 255 / 0.3)' : n <= 3 ? 'rgb(76 194 255 / 0.55)' : 'rgb(76 194 255 / 0.9)');
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="sys-label">Activity</span>
        <div className="flex items-center gap-4 text-xs text-dim">
          <span className="flex items-center gap-1.5"><Flame size={14} className="text-gold" /> <b className="text-ink tabular">{streak}</b> day streak</span>
          <span>Best <b className="text-ink tabular">{bestStreak}</b></span>
        </div>
      </div>
      <div className="overflow-x-auto scroll-thin pb-1">
        <div className="grid grid-flow-col grid-rows-7 gap-[3px] w-max">
          {cells.map((c) => (
            <div
              key={c.d}
              title={`${c.d}: ${c.n} activit${c.n === 1 ? 'y' : 'ies'}`}
              className="w-[13px] h-[13px] rounded-[3px]"
              style={{ background: c.future ? 'transparent' : shade(c.n) }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Titles({ achievements }) {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  return (
    <section className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="sys-label">Titles</span>
        <span className="text-xs text-dim tabular">{unlocked} / {achievements.length} earned</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5">
        {achievements.map((a) => {
          const Icon = ACHIEVEMENT_ICONS[a.icon] || Lock;
          return (
            <div
              key={a.id}
              className={`rounded-xl border px-3 py-3 ${a.unlocked ? 'border-sys/35 bg-sys/[0.06]' : 'border-line'}`}
              title={a.desc}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`grid place-items-center w-8 h-8 rounded-lg ${a.unlocked ? 'bg-sys/15 text-sys' : 'bg-white/[0.04] text-faint'}`}>
                  {a.unlocked ? <Icon size={16} /> : <Lock size={14} />}
                </div>
                <div className="min-w-0">
                  <div className={`text-[12.5px] font-semibold truncate ${a.unlocked ? 'text-ink' : 'text-dim'}`}>{a.name}</div>
                  <div className="text-[10.5px] text-faint">+{a.xp} XP</div>
                </div>
              </div>
              <div className="text-[11px] text-faint leading-snug mb-2 line-clamp-2 min-h-[28px]">{a.desc}</div>
              <Bar value={a.value} total={a.target} className="h-1" />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function StatusPage({ game, username, completed, onOpen, onAddTime }) {
  const pickRandom = () => {
    const pool = QUESTIONS.filter((q) => !completed[q.id]);
    if (pool.length) onOpen(pool[Math.floor(Math.random() * pool.length)].id);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 anim-rise">
        <div>
          <div className="sys-label mb-1.5">Welcome back, Player</div>
          <h1 className="sys-heading text-2xl md:text-[28px]">
            {game.solved} <span className="text-faint">/ {game.total}</span> problems cleared
          </h1>
        </div>
        <div className="flex gap-2">
          {game.due.length > 0 && (
            <a href="#/reviews" className="btn border-gold/40 text-gold">{game.due.length} reviews due <ArrowRight size={14} /></a>
          )}
          <button onClick={pickRandom} className="btn btn-sys"><Dices size={16} /> Random Gate</button>
        </div>
      </header>

      <div className="grid lg:grid-cols-12 gap-5 stagger">
        <HunterCard game={game} username={username} />
        <DailyQuest game={game} />
      </div>

      <PathCards game={game} onOpen={onOpen} />

      <div className="grid lg:grid-cols-2 gap-5">
        <FocusDungeon todaySeconds={game.quest.today.seconds} onAddTime={onAddTime} />
        <Heatmap heatmap={game.heatmap} streak={game.streak} bestStreak={game.bestStreak} />
      </div>

      <Titles achievements={game.achievements} />
    </div>
  );
}
