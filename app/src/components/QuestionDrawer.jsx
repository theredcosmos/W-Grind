import { useEffect, useRef, useState } from 'react';
import { useDialog } from '../lib/useDialog';
import { CalendarClock, ExternalLink, Mic, Swords, Timer, X } from 'lucide-react';
import { BY_ID, DIFF_XP, LISTS } from '../lib/data';
import { REVIEW_XP, STAGE_LABEL, reviewState } from '../lib/game';
import { clock } from '../lib/fight';
import { prettyDate, ymd } from '../lib/date';
import { LIST_STYLE } from '../lib/theme';
import { Check, DiffPill } from './ui';
import HintLadder from './HintLadder';
import { PAID_RUNG } from '../data/hintGuides';
import { floorOf, gateName, monsterOf } from '../lib/lore';
import { tone } from '../lib/themes';

// Group label of a problem inside each curated list, e.g. "Day 7: Linked List and Arrays".
const groupIndex = Object.fromEntries(
  Object.entries(LISTS).map(([k, l]) => [k, new Map(l.items.map((i) => [i.id, i.group]))]),
);

export default function QuestionDrawer({
  id, solvedOn, review, note, hintLevel, hintPaid, timeSpent, interview, fightId,
  onToggle, onReview, onNote, onClose, onRevealHint, onStartFight, onStartInterview,
}) {
  const q = BY_ID.get(id);
  const [draft, setDraft] = useState(note || '');
  const dialogRef = useDialog();
  // Save an unsaved note however the drawer closes (Escape, backdrop, navigation), not only on blur.
  const pending = useRef({ draft: note || '', note: note || '', id, onNote });
  useEffect(() => { pending.current = { draft, note: note || '', id, onNote }; });
  useEffect(() => () => {
    const p = pending.current;
    if (p.draft !== p.note) p.onNote(p.id, p.draft);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    window.addEventListener('hashchange', onClose);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('hashchange', onClose);
    };
  }, [onClose]);

  if (!q) return null;
  const next = solvedOn ? reviewState(solvedOn, review) : null;
  const reviewDue = next && next.due <= ymd();
  // The pattern name is part of the paid hint rung, so keep it hidden until then (or until solved).
  const showHints = !!solvedOn || hintLevel >= PAID_RUNG;
  const fighting = fightId === q.id;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-void/60 anim-fade" onClick={onClose} />
      <aside data-drawer ref={dialogRef} role="dialog" aria-modal="true" aria-label={q.title} tabIndex={-1} className="relative anim-slide h-full w-full max-w-[520px] bg-panel border-l border-line-strong overflow-y-auto scroll-thin">
        <div className="sticky top-0 z-10 bg-panel/95 border-b border-line px-6 py-4 flex items-center gap-3">
          <span className="sys-label">Quest Info</span>
          <span className="text-faint text-xs font-mono">#{q.n}</span>
          <button onClick={onClose} className="ml-auto grid place-items-center w-8 h-8 rounded-lg text-dim hover:text-ink hover:bg-ink/5" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <DiffPill difficulty={q.difficulty} />
              <span className="text-xs text-sys font-semibold">+{DIFF_XP[q.difficulty]} XP</span>
            </div>
            <h2 className="sys-heading text-2xl leading-tight">{q.title}</h2>
            <div className="mt-2 text-sm text-dim">{showHints ? `${q.section} · ${q.topic}` : `${q.section} · pattern hidden`}</div>
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-[12.5px]">
              <span className="text-hi font-semibold">{monsterOf(q.id).name}</span>
              <span className="text-dim">{monsterOf(q.id).kind}</span>
              <span className="text-faint">· {gateName(q.section)}, Floor {floorOf(q.section, q.topic)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <a href={q.url} target="_blank" rel="noopener noreferrer" className="btn btn-sys flex-1 h-11">
              Enter Gate <ExternalLink size={15} />
            </a>
            {/* A due review is finished here, not by toggling "Cleared" (that would un-solve it). */}
            {reviewDue ? (
              <button onClick={() => onReview(q.id, next.stage)} className="btn h-11">
                <Check on={false} /> Review done · +{REVIEW_XP} XP
              </button>
            ) : (
              <button onClick={() => onToggle(q.id)} className="btn h-11 group">
                <Check on={!!solvedOn} /> {solvedOn ? 'Cleared' : 'Mark cleared'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => onStartFight(q.id)} disabled={fighting} className="btn h-10">
              <Swords size={15} /> {fighting ? 'Fight running' : 'Start fight'}
            </button>
            <button onClick={() => onStartInterview(q.id)} className="btn h-10">
              <Mic size={15} /> Interview mode
            </button>
          </div>
          {(timeSpent > 0 || interview) && (
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px] text-dim -mt-3">
              {timeSpent > 0 && <span className="flex items-center gap-1.5"><Timer size={13} /> Fought for {clock(timeSpent)}</span>}
              {interview && (
                <span className={interview.solved ? 'text-easy' : ''}>
                  Interview: {interview.solved ? `passed in ${clock(interview.seconds)}` : 'not passed yet'}
                </span>
              )}
            </div>
          )}

          <section>
            <div className="sys-label mb-2">Hints</div>
            <HintLadder
              q={q}
              level={hintLevel}
              paid={hintPaid}
              solved={!!solvedOn}
              onReveal={(n) => onRevealHint(q.id, n)}
            />
          </section>

          {q.lists.length > 0 && (
            <section>
              <div className="sys-label mb-2">Appears in</div>
              <div className="space-y-1.5">
                {q.lists.map((l) => (
                  <div key={l} className="flex items-center justify-between text-sm card px-3 py-2">
                    <span className="font-semibold" style={{ color: tone(LIST_STYLE[l].color) }}>{LISTS[l].name}</span>
                    <span className="text-dim text-xs">{groupIndex[l].get(q.id)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <div className="sys-label mb-2">My 1-line Aha! note</div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => draft !== (note || '') && onNote(q.id, draft)}
              rows={3}
              placeholder="The one thing that unlocked it… (saved when you click away)"
              className="input h-auto py-2.5 resize-y leading-relaxed"
            />
          </section>

          {solvedOn && (
            <section className="card p-4 flex items-start gap-3">
              <CalendarClock size={18} className="text-sys mt-0.5" />
              <div className="text-sm">
                <div>Cleared on <span className="text-ink font-medium">{prettyDate(solvedOn)}</span></div>
                <div className="text-dim mt-0.5">
                  {next
                    ? `${STAGE_LABEL[next.stage]} review ${reviewDue ? 'due now' : `due ${prettyDate(next.due)}`}`
                    : 'Both spaced reviews done — locked into long-term memory.'}
                </div>
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
