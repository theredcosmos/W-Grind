import { memo, useMemo, useState } from 'react';
import { Mic, Skull, Timer } from 'lucide-react';
import { BY_ID, DIFFICULTIES, QUESTIONS } from '../lib/data';
import { prettyDate } from '../lib/date';
import { clock } from '../lib/fight';
import { floorOf, gateName, monsterOf } from '../lib/lore';
import { Empty } from './ui';

const DIFF_COLOR = { Easy: 'var(--color-easy)', Medium: 'var(--color-medium)', Hard: 'var(--color-hard)' };

// Every defeated monster, newest first: a visible, growing collection.
const Bestiary = memo(function Bestiary({ completed, extras, onOpen }) {
  const [filter, setFilter] = useState('All');
  const defeated = useMemo(() => Object.entries(completed)
    .filter(([id]) => BY_ID.has(id))
    .map(([id, date]) => ({ q: BY_ID.get(id), date }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.q.n - a.q.n), [completed]);

  const counts = Object.fromEntries(DIFFICULTIES.map((d) => [d, defeated.filter((x) => x.q.difficulty === d).length]));
  const totals = Object.fromEntries(DIFFICULTIES.map((d) => [d, QUESTIONS.filter((q) => q.difficulty === d).length]));
  const shown = filter === 'All' ? defeated : defeated.filter((x) => x.q.difficulty === filter);

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex flex-wrap items-center gap-2 mb-4 shrink-0">
        {['All', ...DIFFICULTIES].map((d) => (
          <button key={d} className="chip" data-on={filter === d} onClick={() => setFilter(d)}>
            {d === 'All' ? `All · ${defeated.length}` : `${d} · ${counts[d]}/${totals[d]}`}
          </button>
        ))}
        <span className="ml-auto text-xs text-dim tabular">{defeated.length} of {QUESTIONS.length} monsters defeated</span>
      </div>

      {shown.length === 0 ? (
        <Empty icon={Skull} title="No monsters here yet">Defeat a problem and its monster joins your bestiary.</Empty>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto scroll-thin -mx-1 px-1 pb-2">
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {shown.map(({ q, date }) => {
              const m = monsterOf(q.id);
              const time = extras.problemTime[q.id];
              const iv = extras.interviews[q.id];
              return (
                <button key={q.id} onClick={() => onOpen(q.id)} className="card card-hover p-4 text-left cv-auto" style={{ containIntrinsicSize: 'auto 120px' }}>
                  <div className="flex items-start gap-3">
                    <div className="grid place-items-center w-10 h-10 shrink-0 rounded-xl" style={{ color: DIFF_COLOR[q.difficulty], background: `color-mix(in srgb, ${DIFF_COLOR[q.difficulty]} 12%, transparent)` }}>
                      <Skull size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="sys-heading text-[15px] leading-tight text-hi truncate">{m.name}</div>
                      <div className="text-[12px] text-dim truncate">{m.kind} · {q.title}</div>
                    </div>
                    <span className="text-[11px] text-faint shrink-0">{prettyDate(date)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-faint">
                    <span>{gateName(q.section)} · F{floorOf(q.section, q.topic)}</span>
                    {time > 0 && <span className="flex items-center gap-1"><Timer size={12} /> {clock(time)}</span>}
                    {iv?.solved && <span className="flex items-center gap-1 text-easy"><Mic size={12} /> interview</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default Bestiary;
