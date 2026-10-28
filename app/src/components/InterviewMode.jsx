import { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Check, ExternalLink, Eye, Lightbulb, Lock, Minimize2, Pause, Play, X } from 'lucide-react';
import manual from '../data/manual.json';
import { BY_ID } from '../lib/data';
import { HINT_COST, INTERVIEW_XP } from '../lib/game';
import { HINT_UNLOCK_SECONDS, INTERVIEW_SECONDS, clock, elapsedOf, useTick } from '../lib/fight';
import { monsterOf } from '../lib/lore';
import { useDialog } from '../lib/useDialog';
import { DiffPill, Ring } from './ui';

// Phases come from the Codex: "How to solve a question in a live 45-min interview".
const PHASES = (() => {
  const rows = manual.antiBlank.rows.filter((r) => r[0].startsWith('3.'));
  const phases = rows.map((r) => {
    const m = r[1].match(/Min\s*(\d+)\s*[–-]\s*(\d+)\s*:?\s*(.*)/);
    return m ? { from: +m[1], to: +m[2], title: m[3], say: r[3] } : null;
  }).filter(Boolean);
  phases.push({ from: 40, to: 45, title: 'Edge cases & wrap-up', say: 'Walk through empty input, one element, duplicates and the largest N. Then state time and space complexity.' });
  return phases;
})();

export default function InterviewMode({ fight, solvedOn, hintRevealed, onRevealHint, onPause, onResume, onMinimize, onFinish }) {
  const dialogRef = useDialog();
  useTick(!!fight.since);
  const q = BY_ID.get(fight.id);
  const m = monsterOf(fight.id);
  const seconds = elapsedOf(fight);
  const left = INTERVIEW_SECONDS - seconds;
  const minute = seconds / 60;
  const phaseIndex = Math.max(0, PHASES.findIndex((p) => minute >= p.from && minute < p.to));
  const current = minute >= 45 ? PHASES.length - 1 : phaseIndex;
  const hintUnlocked = seconds >= HINT_UNLOCK_SECONDS;
  const showHint = hintRevealed || !!solvedOn;
  const ringColor = left < 0 ? 'var(--color-hard)' : left < 5 * 60 ? 'var(--color-medium)' : 'var(--color-sys)';
  const phases = useMemo(() => PHASES, []);

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-void/80 anim-fade" />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Interview: ${q.title}`} tabIndex={-1}
        className="sys-window anim-drop relative w-full max-w-4xl max-h-[94dvh] overflow-y-auto scroll-thin p-5 sm:p-7">
        <div className="flex items-start gap-4 mb-5">
          <div className="min-w-0 flex-1">
            <div className="sys-label mb-1">Interview mode · 45 minutes</div>
            <h2 className="sys-heading text-xl sm:text-2xl leading-tight">{q.title}</h2>
            <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-dim">
              <DiffPill difficulty={q.difficulty} /> {m.name} · {m.kind}
            </div>
          </div>
          <button onClick={onMinimize} className="grid place-items-center w-9 h-9 rounded-lg text-dim hover:text-ink hover:bg-ink/5" aria-label="Minimise" title="Minimise (timer keeps running)">
            <Minimize2 size={17} />
          </button>
        </div>

        <div className="grid md:grid-cols-[220px_1fr] gap-6">
          <div className="flex flex-col items-center gap-4">
            <Ring value={Math.min(seconds, INTERVIEW_SECONDS)} total={INTERVIEW_SECONDS} size={180} stroke={10} color={ringColor}>
              <div className="text-center">
                <div className={`font-mono text-3xl tabular ${left < 0 ? 'text-hard' : 'text-hi'}`}>{clock(Math.abs(left))}</div>
                <div className="text-[11px] text-faint mt-0.5">{left < 0 ? 'over time' : fight.since ? 'remaining' : 'paused'}</div>
              </div>
            </Ring>
            <div className="flex gap-2 w-full">
              <a href={q.url} target="_blank" rel="noopener noreferrer" className="btn btn-sys flex-1"><ExternalLink size={15} /> Open</a>
              <button onClick={fight.since ? onPause : onResume} className="btn" aria-label={fight.since ? 'Pause' : 'Resume'}>
                {fight.since ? <Pause size={15} /> : <Play size={15} />}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <button onClick={() => onFinish(true)} className="btn border-easy/50 text-easy"><Check size={15} /> Solved</button>
              <button onClick={() => onFinish(false)} className="btn"><X size={15} /> Give up</button>
            </div>
            <p className="text-[11.5px] text-faint text-center leading-snug">
              Solve within 45:00 for +{INTERVIEW_XP} XP. Talk out loud the whole time.
            </p>
          </div>

          <div className="min-w-0 space-y-4">
            <ol className="space-y-2">
              {phases.map((p, i) => {
                const state = i < current ? 'done' : i === current ? 'now' : 'next';
                return (
                  <li key={p.title} className={`rounded-xl border px-4 py-3 transition-colors ${state === 'now' ? 'border-sys/60 bg-sys/[0.07]' : 'border-line'} ${state === 'done' ? 'opacity-55' : ''}`}>
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-[11px] text-faint tabular w-14 shrink-0">{p.from}–{p.to}m</span>
                      <span className={`text-[13.5px] font-semibold ${state === 'now' ? 'text-hi' : ''}`}>{p.title}</span>
                    </div>
                    {state === 'now' && <p className="text-[12.5px] text-dim leading-relaxed mt-1.5 pl-16 whitespace-pre-line">{p.say}</p>}
                  </li>
                );
              })}
            </ol>

            <div className="card p-4">
              <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wider mb-2">
                <Lightbulb size={14} /> Hint
              </div>
              {showHint ? (
                <p className="text-[13.5px] leading-relaxed">{q.trigger || '—'}</p>
              ) : hintUnlocked ? (
                <button onClick={() => onRevealHint(q.id)} className="btn"><Eye size={15} /> Reveal hint · −{HINT_COST} XP</button>
              ) : (
                <p className="text-[13px] text-dim flex items-center gap-2">
                  <Lock size={14} /> Locked until 20:00. Strip the costume first: input, constraint, goal.
                  <span className="ml-auto font-mono text-faint tabular">{clock(HINT_UNLOCK_SECONDS - seconds)}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
