import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { DIFFICULTIES } from '../lib/data';
import { RANK_COLOR, SECTION_ICONS } from '../lib/theme';
import QuestionRow from './QuestionRow';
import { Bar } from './ui';
import { tone } from '../lib/themes';

const STATUS = [
  { key: 'all', label: 'Any status' },
  { key: 'todo', label: 'Unsolved' },
  { key: 'done', label: 'Cleared' },
];

// A pattern card opened up: its questions grouped by subpattern.
export default function PatternModal({ pattern, guild, completed, dueIds, notes, onToggle, onOpen, onClose }) {
  const [diff, setDiff] = useState('All');
  const [status, setStatus] = useState('all');
  const Icon = SECTION_ICONS[pattern.name];
  const rc = RANK_COLOR[pattern.rank];

  useEffect(() => {
    const onKey = (e) => {
      // Let an open question drawer take Escape first.
      if (e.key === 'Escape' && !document.querySelector('[data-drawer]')) onClose();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const keep = (q) =>
    (diff === 'All' || q.difficulty === diff) &&
    (status === 'all' || (status === 'done' ? !!completed[q.id] : !completed[q.id]));

  const done = pattern.questions.filter((q) => completed[q.id]).length;
  const topics = pattern.topics.map((t) => ({ ...t, rows: t.questions.filter(keep), done: t.questions.filter((q) => completed[q.id]).length }));

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-6">
      <div className="absolute inset-0 bg-void/75 anim-fade" onClick={onClose} />
      <div className="sys-window relative anim-drop w-full max-w-4xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden rounded-b-none sm:rounded-b-[14px]">
        <div className="flex items-center gap-4 px-5 sm:px-6 py-5 border-b border-line">
          {Icon && (
            <div className="crest grid place-items-center w-12 h-12 shrink-0" style={{ color: tone(rc), background: `${rc}12`, boxShadow: `inset 0 0 0 1.5px ${rc}77` }}>
              <Icon size={22} strokeWidth={1.7} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[10.5px] tracking-[0.2em] uppercase font-semibold" style={{ color: tone(guild.color) }}>
              {guild.name} · {pattern.rank}-Rank
            </div>
            <h2 className="sys-heading text-xl sm:text-2xl truncate">{pattern.name}</h2>
            <div className="flex items-center gap-3 mt-1.5 max-w-xs">
              <Bar value={done} total={pattern.questions.length} color={rc} className="flex-1" />
              <span className="text-xs text-dim tabular whitespace-nowrap">{done}/{pattern.questions.length}</span>
            </div>
          </div>
          <button onClick={onClose} className="self-start grid place-items-center w-9 h-9 rounded-lg text-dim hover:text-ink hover:bg-ink/5" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 px-5 sm:px-6 py-3 border-b border-line">
          {['All', ...DIFFICULTIES].map((d) => (
            <button key={d} className="chip h-8" data-on={diff === d} onClick={() => setDiff(d)}>{d === 'All' ? 'All levels' : d}</button>
          ))}
          <span className="w-px bg-line mx-1" />
          {STATUS.map((s) => (
            <button key={s.key} className="chip h-8" data-on={status === s.key} onClick={() => setStatus(s.key)}>{s.label}</button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin px-3 sm:px-6 py-5 space-y-7">
          {topics.every((t) => t.rows.length === 0) && (
            <p className="text-center text-dim text-sm py-10">No problems match these filters.</p>
          )}
          {topics.filter((t) => t.rows.length).map((t) => (
            <section key={t.name}>
              <div className="flex items-center gap-3 mb-2.5 px-1">
                <h3 className="text-[15px] font-semibold" style={{ color: 'var(--color-hi)' }}>{t.name}</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-line-strong to-transparent" />
                <span className="text-xs text-dim tabular">{t.done}/{t.questions.length}</span>
              </div>
              <div className="card overflow-hidden">
                {t.rows.map((q) => (
                  <QuestionRow key={q.id} q={q} solved={completed[q.id]} hasNote={!!notes[q.id]} due={dueIds.has(q.id)} onToggle={onToggle} onOpen={onOpen} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
