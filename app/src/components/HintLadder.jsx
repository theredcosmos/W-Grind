import { useMemo } from 'react';
import { Clock, Compass, Eye, Lightbulb, ListOrdered, Lock, ShieldAlert } from 'lucide-react';
import { HINT_GATES, hintLadderFor, timeLevel } from '../data/hintGuides';
import { HINT_COST } from '../lib/game';
import { clock } from '../lib/fight';

/*
 * Hints open one rung at a time, on a clock:
 *   1 Nudge · 2 Approach · 3 Pseudocode · 4 Edge cases & complexity
 * During a fight or interview each rung opens by itself at 4, 8, 12 and 15 minutes (HINT_GATES).
 * Opening the next rung before then costs HINT_COST, on solved problems too (reviews included).
 */
const HINT_RUNGS = [
  { title: 'Nudge', icon: Lightbulb },
  { title: 'Approach', icon: Compass },
  { title: 'Pseudocode', icon: ListOrdered },
  { title: 'Edge cases & complexity', icon: ShieldAlert },
];

function RungBody({ n, h }) {
  if (n === 1) return <p>{h.nudge}</p>;
  if (n === 2) {
    return (
      <div className="space-y-2">
        <p>{h.approach}</p>
        <p className="text-dim"><span className="text-faint">Pattern:</span> {h.pattern}</p>
        {h.linker && <p className="text-dim"><span className="text-faint">Tools:</span> {h.linker}</p>}
        <p className="text-dim"><span className="text-faint">Spot it when you see:</span> {h.trigger}</p>
      </div>
    );
  }
  if (n === 3) {
    return (
      <ol className="space-y-1 list-decimal pl-5 marker:text-faint">
        {h.steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
    );
  }
  return (
    <div className="space-y-2">
      <ul className="space-y-1 list-disc pl-5 marker:text-faint">
        {h.edges.map((e) => <li key={e}>{e}</li>)}
      </ul>
      {h.big && <p className="text-dim"><span className="text-faint">Target:</span> {h.big}</p>}
    </div>
  );
}

/**
 * opened: rungs opened early this session. seconds: time on the clock for this problem (0 when no
 * fight is running, so everything is early).
 */
export default function HintLadder({ q, opened = 0, seconds = 0, onReveal, compact = false }) {
  const h = useMemo(() => hintLadderFor(q), [q]);
  const shown = Math.max(opened, timeLevel(seconds));
  const next = shown + 1;
  const text = compact ? 'text-[13px]' : 'text-[13.5px]';

  return (
    <div className="space-y-2">
      <ol className="space-y-2">
        {HINT_RUNGS.map(({ title, icon: Icon }, i) => {
          const n = i + 1;
          const open = n <= shown;
          const opensAt = HINT_GATES[i];
          return (
            <li key={title} className={`rounded-xl border px-3.5 py-2.5 ${open ? 'border-line bg-ink/[0.02]' : 'border-dashed border-line'}`}>
              <div className="flex items-center gap-2">
                <Icon size={14} className={open ? 'text-gold' : 'text-faint'} />
                <span className={`text-[12px] font-semibold uppercase tracking-wider ${open ? 'text-gold' : 'text-faint'}`}>{n}. {title}</span>
                {!open && (
                  <span className="ml-auto flex items-center gap-1 font-mono text-[11px] text-faint tabular">
                    {n > next && <Lock size={11} />}
                    {seconds > 0 ? clock(opensAt - seconds) : `${opensAt / 60} min`}
                  </span>
                )}
              </div>
              {open && <div className={`${text} leading-relaxed mt-2`}><RungBody n={n} h={h} /></div>}
              {!open && n === next && (
                <button onClick={() => onReveal(n)} className="btn h-9 mt-2 text-[13px]">
                  <Eye size={14} /> Open now · −{HINT_COST} XP
                </button>
              )}
            </li>
          );
        })}
      </ol>
      <p className="text-[12px] text-faint flex items-center gap-1.5 px-1">
        <Clock size={12} />
        {seconds > 0
          ? 'Hints open by themselves at 4, 8, 12 and 15 minutes. Try first, then take one step at a time.'
          : 'Start a fight: hints open by themselves at 4, 8, 12 and 15 minutes.'}
      </p>
    </div>
  );
}
