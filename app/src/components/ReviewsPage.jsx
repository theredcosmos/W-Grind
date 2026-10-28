import { CalendarCheck, ExternalLink, Lightbulb } from 'lucide-react';
import { REVIEW_XP } from '../lib/game';
import { prettyDate } from '../lib/date';
import { DiffPill, Empty, PageHeader } from './ui';

function ReviewCard({ item, note, onReview, onOpen }) {
  const { q } = item;
  return (
    <div className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="pill bg-gold/10 text-gold">{item.stage === 'r7' ? '7-DAY' : '14-DAY'}</span>
          <DiffPill difficulty={q.difficulty} />
          {item.overdue > 0 && <span className="text-[11px] text-hard">{item.overdue}d overdue</span>}
        </div>
        <button onClick={() => onOpen(q.id)} className="text-[15px] font-semibold hover:text-hi text-left">{q.title}</button>
        <div className="mt-1.5 text-[12.5px] text-dim flex gap-1.5">
          <Lightbulb size={13} className="text-gold/80 mt-0.5 shrink-0" />
          <span className="line-clamp-2">{note || q.trigger}</span>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <a href={q.url} target="_blank" rel="noopener noreferrer" className="btn"><ExternalLink size={14} /> Re-solve</a>
        <button onClick={() => onReview(q.id, item.stage)} className="btn btn-sys">Done · +{REVIEW_XP} XP</button>
      </div>
    </div>
  );
}

export default function ReviewsPage({ due, upcoming, notes, onReview, onOpen }) {
  return (
    <div>
      <PageHeader kicker="Re-entry Queue" title="Spaced Reviews" />
      <p className="text-dim text-sm max-w-2xl -mt-3 mb-6 anim-rise">
        Solving once builds episodic memory. Re-entering a cleared dungeon 7 and 14 days later builds trigger memory,
        the part that fires in an interview. Re-solve from scratch, then mark it done.
      </p>

      <h2 className="sys-label mb-3">Due now · {due.length}</h2>
      {due.length === 0 ? (
        <Empty icon={CalendarCheck} title="Queue clear">Nothing to review today. Clear new problems and they will come back here in 7 days.</Empty>
      ) : (
        <div className="space-y-2.5 stagger">
          {due.map((item) => (
            <ReviewCard key={item.id + item.stage} item={item} note={notes[item.id]} onReview={onReview} onOpen={onOpen} />
          ))}
        </div>
      )}

      {upcoming.length > 0 && (
        <>
          <h2 className="sys-label mt-8 mb-3">Next 7 days · {upcoming.length}</h2>
          <div className="card divide-y divide-line">
            {upcoming.map((item) => (
              <button key={item.id + item.stage} onClick={() => onOpen(item.id)} className="w-full flex items-center gap-3 px-4 h-12 text-left hover:bg-ink/[0.02]">
                <span className="text-xs text-dim w-16 tabular">{prettyDate(item.due)}</span>
                <span className="text-sm flex-1 truncate">{item.q.title}</span>
                <span className="text-[11px] text-faint">{item.stage === 'r7' ? '7-day' : '14-day'}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
