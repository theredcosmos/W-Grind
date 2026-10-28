import { memo } from 'react';
import { ExternalLink, NotebookPen, RotateCcw } from 'lucide-react';
import { Check, DiffPill, ListBadge } from './ui';
import { monsterOf } from '../lib/lore';

// One problem row. Memoised on primitive props so ticking a box re-renders only that row.
const QuestionRow = memo(function QuestionRow({ q, solved, hasNote, due, onToggle, onOpen }) {
  return (
    <div
      className={`group flex items-center gap-3 px-3 sm:px-4 h-[52px] border-t border-line/70 first:border-t-0 transition-colors duration-100 hover:bg-ink/[0.025] ${
        solved ? 'bg-sys/[0.03]' : ''
      }`}
    >
      <button onClick={() => onToggle(q.id)} aria-label={solved ? 'Mark unsolved' : 'Mark solved'} className="shrink-0 p-1 -m-1">
        <Check on={!!solved} />
      </button>
      <span className="hidden sm:block w-9 shrink-0 text-[11px] text-faint font-mono tabular">{q.n}</span>
      <button onClick={() => onOpen(q.id)} className="min-w-0 flex-1 text-left">
        <div className={`truncate text-[14px] font-medium transition-colors ${solved ? 'text-dim' : 'text-ink group-hover:text-hi'}`}>
          {q.title}
        </div>
        <div className="truncate text-[11.5px] text-faint">{monsterOf(q.id).name} · {monsterOf(q.id).kind}</div>
      </button>
      <div className="hidden lg:flex items-center gap-1.5 shrink-0">
        {q.lists.map((l) => <ListBadge key={l} list={l} />)}
      </div>
      {due && <RotateCcw size={14} className="shrink-0 text-gold" title="Review due" />}
      {hasNote && <NotebookPen size={14} className="shrink-0 text-sys/80" />}
      <div className="w-[64px] shrink-0 flex justify-end"><DiffPill difficulty={q.difficulty} /></div>
      <a
        href={q.url}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 grid place-items-center w-8 h-8 rounded-lg text-faint hover:text-sys hover:bg-sys/10 transition-colors"
        aria-label={`Open ${q.title} on LeetCode`}
      >
        <ExternalLink size={15} />
      </a>
    </div>
  );
});

export default QuestionRow;
