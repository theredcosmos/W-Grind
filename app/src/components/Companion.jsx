import { useState } from 'react';
import { Check, ExternalLink, Mic, Pause, Play, Swords, X } from 'lucide-react';
import { BY_ID } from '../lib/data';
import { INTERVIEW_SECONDS, clock, elapsedOf, useTick } from '../lib/fight';
import { PHASES, phaseAt } from '../lib/interview';
import { DiffPill } from './ui';
import HintLadder from './HintLadder';
import { INTERVIEW_GATES } from '../data/hintGuides';

/*
 * Contents of the floating fight companion (lib/companion.js). Built for focus: one big clock,
 * one thing to do right now, the problem link first, hints below, and the finish buttons last.
 */
export default function Companion({ fight, solvedOn, hintLevel, hintPaid, onRevealHint, onPause, onResume, onFinish }) {
  useTick(!!fight.since);
  const [opened, setOpened] = useState(false);
  const q = BY_ID.get(fight.id);
  if (!q) return null;
  const interview = fight.mode === 'interview';
  const seconds = elapsedOf(fight);
  const left = INTERVIEW_SECONDS - seconds;
  const phase = interview ? PHASES[phaseAt(seconds)] : null;
  const phaseNo = interview ? phaseAt(seconds) + 1 : 0;
  const clockTone = !interview ? 'text-hi' : left < 0 ? 'text-hard' : left < 5 * 60 ? 'text-medium' : 'text-hi';

  return (
    <div className="min-h-screen p-4 flex flex-col gap-3 text-ink">
      <div className="flex items-center gap-2">
        {interview ? <Mic size={15} className="text-sys" /> : <Swords size={15} className="text-sys" />}
        <span className="sys-label">{interview ? 'Interview · 45 min' : 'Fight'}</span>
        <span className="ml-auto"><DiffPill difficulty={q.difficulty} /></span>
      </div>
      <h1 className="sys-heading text-lg leading-tight -mt-1">{q.title}</h1>

      <div className="flex items-center gap-3">
        <div className={`font-mono text-4xl tabular ${clockTone}`}>
          {interview ? clock(Math.abs(left)) : clock(seconds)}
        </div>
        <div className="text-[11px] text-faint leading-tight">
          {interview ? (left < 0 ? 'over time' : 'left') : 'fighting'}
          {!fight.since && <div className="text-medium">paused</div>}
        </div>
        <button onClick={fight.since ? onPause : onResume} className="btn ml-auto" aria-label={fight.since ? 'Pause' : 'Resume'}>
          {fight.since ? <Pause size={15} /> : <Play size={15} />}
        </button>
      </div>

      <a
        href={q.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setOpened(true)}
        className={`btn h-11 ${opened ? '' : 'btn-sys'}`}
      >
        <ExternalLink size={15} /> {opened ? 'Open the problem again' : 'Open the problem on LeetCode'}
      </a>

      {interview && (
        <section className="rounded-xl border border-sys/50 bg-sys/[0.07] px-3.5 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-sys">Now · step {phaseNo}/{PHASES.length}</span>
            <span className="ml-auto font-mono text-[11px] text-faint">{phase.from}–{phase.to} min</span>
          </div>
          <div className="text-[14px] font-semibold text-hi mt-1">{phase.title}</div>
          <p className="text-[12.5px] text-dim leading-relaxed mt-1 whitespace-pre-line">{phase.say}</p>
        </section>
      )}

      <section>
        <div className="sys-label mb-2">Hints</div>
        <HintLadder
          q={q}
          level={hintLevel}
          paid={hintPaid}
          solved={!!solvedOn}
          gates={interview ? INTERVIEW_GATES : null}
          seconds={seconds}
          onReveal={(n) => onRevealHint(q.id, n)}
          compact
        />
      </section>

      <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
        <button onClick={() => onFinish(true)} className="btn h-11 border-easy/50 text-easy"><Check size={15} /> {interview ? 'Solved' : 'Defeated'}</button>
        <button onClick={() => onFinish(false)} className="btn h-11"><X size={15} /> {interview ? 'Give up' : 'Retreat'}</button>
      </div>
    </div>
  );
}
