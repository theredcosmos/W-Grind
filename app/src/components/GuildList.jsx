import { memo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { gateName } from '../lib/lore';
import { RANK_COLOR } from '../lib/theme';
import { tone } from '../lib/themes';
import QuestionRow from './QuestionRow';
import { Bar } from './ui';

// Every problem in a guild on one page: pattern (gate) → subpattern (floor) → problems.
const GuildList = memo(function GuildList({ deck, completed, dueIds, notes, onToggle, onOpen }) {
  const [collapsed, setCollapsed] = useState(() => new Set());
  const toggle = (name) => setCollapsed((prev) => {
    const next = new Set(prev);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    return next;
  });

  return (
    <div className="space-y-3">
      {deck.map((p) => {
        const done = p.questions.filter((q) => completed[q.id]).length;
        const open = !collapsed.has(p.name);
        const rc = RANK_COLOR[p.rank];
        return (
          <section key={p.name} className="card overflow-hidden cv-auto">
            <button onClick={() => toggle(p.name)} aria-expanded={open} className="w-full flex items-center gap-3 px-4 h-14 text-left hover:bg-ink/[0.02]">
              <ChevronDown size={16} className={`text-faint shrink-0 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
              <span className="pill sys-heading shrink-0" style={{ color: tone(rc), background: `${rc}1a` }}>{p.rank}</span>
              <span className="min-w-0">
                <span className="block font-semibold text-[14.5px] truncate">{p.name}</span>
                <span className="block text-[11px] text-faint truncate">{gateName(p.name)}</span>
              </span>
              <span className="ml-auto flex items-center gap-3 shrink-0">
                <Bar value={done} total={p.questions.length} color={rc} className="w-24 hidden sm:block" />
                <span className="text-xs text-dim tabular w-12 text-right">{done}/{p.questions.length}</span>
              </span>
            </button>
            {open && p.topics.map((t, i) => (
              <div key={t.name} className="border-t border-line">
                <div className="flex items-baseline gap-2 px-4 pt-3 pb-1.5">
                  <span className="sys-label text-[10px]">Floor {i + 1}</span>
                  <span className="text-[13px] font-semibold text-hi">{t.name}</span>
                  <span className="ml-auto text-[11px] text-faint tabular">
                    {t.questions.filter((q) => completed[q.id]).length}/{t.questions.length}
                  </span>
                </div>
                {t.questions.map((q) => (
                  <QuestionRow key={q.id} q={q} solved={completed[q.id]} hasNote={!!notes[q.id]} due={dueIds.has(q.id)} onToggle={onToggle} onOpen={onOpen} />
                ))}
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
});

export default GuildList;
