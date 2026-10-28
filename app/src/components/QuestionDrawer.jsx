import { useEffect, useState } from 'react';
import { CalendarClock, ExternalLink, Lightbulb, Link2, X } from 'lucide-react';
import { BY_ID, DIFF_XP, LISTS } from '../lib/data';
import { reviewState } from '../lib/game';
import { prettyDate } from '../lib/date';
import { LIST_STYLE } from '../lib/theme';
import { Check, DiffPill } from './ui';
import { tone } from '../lib/themes';

// Group label of a problem inside each curated list, e.g. "Day 7: Linked List and Arrays".
const groupIndex = Object.fromEntries(
  Object.entries(LISTS).map(([k, l]) => [k, new Map(l.items.map((i) => [i.id, i.group]))]),
);

export default function QuestionDrawer({ id, solvedOn, review, note, onToggle, onNote, onClose }) {
  const q = BY_ID.get(id);
  const [draft, setDraft] = useState(note || '');

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-void/60 anim-fade" onClick={onClose} />
      <aside data-drawer className="relative anim-slide h-full w-full max-w-[520px] bg-panel border-l border-line-strong overflow-y-auto scroll-thin">
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
            <div className="mt-2 text-sm text-dim">{q.section} · {q.topic}</div>
          </div>

          <div className="flex gap-2">
            <a href={q.url} target="_blank" rel="noopener noreferrer" className="btn btn-sys flex-1 h-11">
              Enter Dungeon <ExternalLink size={15} />
            </a>
            <button onClick={() => onToggle(q.id)} className="btn h-11 group">
              <Check on={!!solvedOn} /> {solvedOn ? 'Cleared' : 'Mark cleared'}
            </button>
          </div>

          <section className="card p-4">
            <div className="flex items-center gap-2 text-gold text-xs font-semibold uppercase tracking-wider mb-2">
              <Lightbulb size={14} /> Spot this in the prompt
            </div>
            <p className="text-[14px] leading-relaxed text-ink/90">{q.trigger || '—'}</p>
          </section>

          <section className="card p-4">
            <div className="flex items-center gap-2 text-sys text-xs font-semibold uppercase tracking-wider mb-2">
              <Link2 size={14} /> DSA elements & how they link
            </div>
            <p className="text-[14px] leading-relaxed text-ink/90">{q.linker || '—'}</p>
            <div className="mt-3 text-xs text-faint">Core pattern: <span className="text-dim">{q.pattern}</span></div>
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
                    ? `${next.stage === 'r7' ? '7-day' : '14-day'} review due ${prettyDate(next.due)}`
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
