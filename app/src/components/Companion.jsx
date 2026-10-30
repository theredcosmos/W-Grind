import { useState } from 'react';
import { Check, ExternalLink, Mic, Pause, Play, Swords, X } from 'lucide-react';
import { BY_ID } from '../lib/data';
import { INTERVIEW_SECONDS, clock, elapsedOf, useTick } from '../lib/fight';
import { PHASES, phaseAt } from '../lib/interview';
import { DiffPill } from './ui';
import HintLadder from './HintLadder';

/*
 * Contents of the floating fight companion (lib/companion.js). Built for focus: one big clock,
 * one thing to do right now, the problem link first, hints below, and the finish buttons last.
 * The bulb is the toggle. Open: a lit bulb in the header; click it and the window shrinks to a slim
 * pill (unlit bulb, timer, pause, quit). Opening LeetCode from here shrinks it automatically. Click
 * the pill's bulb to get the full panel back at its normal size.
 */
// Outer size, including the browser's title bar. Browsers enforce a minimum, so the pill fills the
// whole window rather than floating inside it.
const PILL = [200, 60];
const FULL = [380, 600]; // the size it opens at (lib/companion.js)

// Resize the floating window itself (allowed during a click). The in-page fallback ignores it.
const resize = (e, [w, h]) => {
  try { e.currentTarget.ownerDocument.defaultView.resizeTo(w, h); } catch { /* not resizable here */ }
};

// Bright yellow with light rays when on; a plain outline in the text colour when off.
const RAYS = ['M20 8h2.5', 'M4 8H1.5', 'M12 0v-2.5', 'M17.7 2.3l1.8-1.8', 'M6.3 2.3 4.5.5'];
function BulbIcon({ on, size }) {
  return (
    <svg width={size} height={size} viewBox="-4 -4 32 32" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {on && <g stroke="#facc15" strokeWidth="2.2">{RAYS.map((d) => <path key={d} d={d} />)}</g>}
      <g stroke={on ? '#ca8a04' : 'currentColor'} strokeWidth="2">
        <path
          d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5Z"
          fill={on ? '#fde047' : 'none'}
        />
        <path d="M9 18h6M10 22h4" />
      </g>
    </svg>
  );
}

const Bulb = ({ on, onClick, small = false }) => (
  <button
    onClick={onClick}
    aria-pressed={on}
    aria-label={on ? 'Hide help (minimise)' : 'Show help'}
    title={on ? 'Hide help (minimise)' : 'Show help'}
    className={`grid place-items-center shrink-0 rounded-full transition-colors ${small ? 'w-7 h-7' : 'w-9 h-9'} ${
      on ? 'bg-[#facc15]/15 hover:bg-[#facc15]/25' : 'text-dim hover:text-ink hover:bg-ink/10'
    }`}
  >
    <BulbIcon on={on} size={small ? 20 : 26} />
  </button>
);

const PillButton = ({ label, onClick, danger = false, children }) => (
  <button
    onClick={onClick}
    aria-label={label}
    title={label}
    className={`grid place-items-center w-7 h-7 shrink-0 rounded-full text-dim hover:bg-ink/10 ${danger ? 'hover:text-hard' : 'hover:text-ink'}`}
  >
    {children}
  </button>
);

export default function Companion({ fight, hintOpened, onRevealHint, onPause, onResume, onFinish }) {
  useTick(!!fight.since);
  const [opened, setOpened] = useState(false);
  const [mini, setMini] = useState(false);
  const q = BY_ID.get(fight.id);
  if (!q) return null;
  const interview = fight.mode === 'interview';
  const seconds = elapsedOf(fight);
  const left = INTERVIEW_SECONDS - seconds;
  const phase = interview ? PHASES[phaseAt(seconds)] : null;
  const phaseNo = interview ? phaseAt(seconds) + 1 : 0;
  const clockTone = !interview ? 'text-hi' : left < 0 ? 'text-hard' : left < 5 * 60 ? 'text-medium' : 'text-hi';
  const minimise = (e) => { resize(e, PILL); setMini(true); };
  const restore = (e) => { resize(e, FULL); setMini(false); };

  if (mini) {
    return (
      <div className="h-screen bg-panel text-ink flex items-center">
        <div className="w-full flex items-center gap-1 px-1.5">
          <Bulb on={false} onClick={restore} small />
          <span className={`font-mono text-[15px] leading-none tabular px-1 ${clockTone}`} title={interview ? 'Time left' : 'Time fighting'}>
            {interview ? clock(Math.abs(left)) : clock(seconds)}
          </span>
          <span className="ml-auto flex">
            <PillButton label={fight.since ? 'Pause' : 'Resume'} onClick={fight.since ? onPause : onResume}>
              {fight.since ? <Pause size={14} /> : <Play size={14} />}
            </PillButton>
            <PillButton label={interview ? 'Give up' : 'Retreat (keep the time, not solved)'} onClick={() => onFinish(false)} danger>
              <X size={15} />
            </PillButton>
          </span>
        </div>
      </div>
    );
  }

  return (
    // Scrolls inside its own box: if the whole page scrolled, the themed background (sized to the
    // window) would end and repeat below the fold once hints opened.
    <div className="h-screen overflow-y-auto scroll-thin p-4 flex flex-col gap-3 text-ink">
      <div className="flex items-center gap-2">
        {interview ? <Mic size={15} className="text-sys" /> : <Swords size={15} className="text-sys" />}
        <span className="sys-label">{interview ? 'Interview · 45 min' : 'Fight'}</span>
        <span className="ml-auto"><DiffPill difficulty={q.difficulty} /></span>
        <Bulb on onClick={minimise} />
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
        // LeetCode opens in a tab and this window steps aside as the small pill.
        onClick={(e) => { setOpened(true); minimise(e); }}
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
          opened={hintOpened}
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
