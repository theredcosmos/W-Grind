import { useMemo } from 'react';
import { Compass, Eye, Footprints, Lightbulb, ListOrdered, Lock, ShieldAlert } from 'lucide-react';
import { PAID_RUNG, hintLadderFor } from '../data/hintGuides';
import { HINT_COST } from '../lib/game';
import { clock } from '../lib/fight';

/*
 * Hints revealed one rung at a time, so you only take as much help as you need:
 *   1 Nudge · 2 Approach · 3 Pseudocode · 4 Edge cases & complexity
 * The nudge is free. The first paid rung (Approach) costs HINT_COST once per problem; the
 * rest are free after that. Everything is open once the problem is solved.
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
 * level: rungs already revealed (0–4). paid: the XP cost was already taken for this problem.
 * gates/seconds: interview time locks (omit for no locks).
 */
export default function HintLadder({ q, level, paid, solved, gates, seconds = 0, onReveal, compact = false }) {
  const h = useMemo(() => hintLadderFor(q), [q]);
  const shown = solved ? HINT_RUNGS.length : level;
  const next = shown + 1;
  const text = compact ? 'text-[13px]' : 'text-[13.5px]';

  return (
    <ol className="space-y-2">
      {HINT_RUNGS.map(({ title, icon: Icon }, i) => {
        const n = i + 1;
        const open = n <= shown;
        const unlockAt = gates ? gates[i] : 0;
        const timeLocked = seconds < unlockAt;
        return (
          <li key={title} className={`rounded-xl border px-3.5 py-2.5 ${open ? 'border-line bg-ink/[0.02]' : 'border-dashed border-line'}`}>
            <div className="flex items-center gap-2">
              <Icon size={14} className={open ? 'text-gold' : 'text-faint'} />
              <span className={`text-[12px] font-semibold uppercase tracking-wider ${open ? 'text-gold' : 'text-faint'}`}>{n}. {title}</span>
              {!open && n > next && <Lock size={12} className="ml-auto text-faint" />}
            </div>
            {open && <div className={`${text} leading-relaxed mt-2`}><RungBody n={n} h={h} /></div>}
            {!open && n === next && (
              timeLocked ? (
                <p className="text-[12.5px] text-dim mt-1.5 flex items-center gap-2">
                  <Lock size={12} /> Unlocks at {clock(unlockAt)}
                  <span className="ml-auto font-mono text-faint tabular">{clock(unlockAt - seconds)}</span>
                </p>
              ) : (
                <button onClick={() => onReveal(n)} className="btn h-9 mt-2 text-[13px]">
                  <Eye size={14} /> Show {title.toLowerCase()}
                  {n === PAID_RUNG && !paid ? ` · −${HINT_COST} XP` : n === 1 ? ' · free' : ''}
                </button>
              )
            )}
          </li>
        );
      })}
      {!solved && shown === 0 && (
        <p className="text-[12px] text-faint flex items-center gap-1.5 px-1">
          <Footprints size={12} /> Stuck? Take one rung, try again for 5 minutes, then take the next.
        </p>
      )}
    </ol>
  );
}
