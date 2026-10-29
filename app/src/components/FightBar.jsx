import { Check, Maximize2, Pause, PictureInPicture2, Play, Swords, X } from 'lucide-react';
import { BY_ID } from '../lib/data';
import { INTERVIEW_SECONDS, clock, elapsedOf, useTick } from '../lib/fight';
import { monsterOf } from '../lib/lore';

// Floating timer for the problem you're fighting; follows you across pages.
export default function FightBar({ fight, onPause, onResume, onDefeated, onRetreat, onExpand, onPopOut }) {
  useTick(!!fight?.since);
  if (!fight) return null;
  const q = BY_ID.get(fight.id);
  if (!q) return null;
  const m = monsterOf(q.id);
  const seconds = elapsedOf(fight);
  const interview = fight.mode === 'interview';
  const shown = interview ? INTERVIEW_SECONDS - seconds : seconds;

  return (
    <div className="fixed z-40 right-4 bottom-24 md:bottom-6 md:right-6 anim-drop">
      <div className="sys-window flex items-center gap-3 pl-3.5 pr-2 py-2 max-w-[calc(100vw-32px)]">
        <Swords size={16} className="text-sys shrink-0" />
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold truncate max-w-[180px]">{m.name} <span className="text-faint font-normal">· {q.title}</span></div>
          <div className={`font-mono text-[13px] tabular ${interview && shown < 0 ? 'text-hard' : 'text-dim'}`}>
            {interview ? (shown >= 0 ? `${clock(shown)} left` : `${clock(-shown)} over`) : clock(shown)}
            {!fight.since && <span className="ml-1.5 text-faint">paused</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-1">
          {onPopOut && (
            <button onClick={onPopOut} className="grid place-items-center w-8 h-8 rounded-lg text-dim hover:text-ink hover:bg-ink/5" aria-label="Pop out" title="Pop out a floating window that stays on top of LeetCode">
              <PictureInPicture2 size={15} />
            </button>
          )}
          {interview && (
            <button onClick={onExpand} className="grid place-items-center w-8 h-8 rounded-lg text-dim hover:text-ink hover:bg-ink/5" aria-label="Open interview mode" title="Open interview mode">
              <Maximize2 size={15} />
            </button>
          )}
          <button
            onClick={fight.since ? onPause : onResume}
            className="grid place-items-center w-8 h-8 rounded-lg text-dim hover:text-ink hover:bg-ink/5"
            aria-label={fight.since ? 'Pause' : 'Resume'}
            title={fight.since ? 'Pause' : 'Resume'}
          >
            {fight.since ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button onClick={onDefeated} className="grid place-items-center w-8 h-8 rounded-lg text-easy hover:bg-easy/10" aria-label="Defeated: mark solved" title="Defeated (mark solved)">
            <Check size={16} />
          </button>
          <button onClick={onRetreat} className="grid place-items-center w-8 h-8 rounded-lg text-faint hover:text-hard hover:bg-hard/10" aria-label="Retreat: stop without solving" title="Retreat (keep the time, not solved)">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
