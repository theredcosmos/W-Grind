import { memo, useCallback, useDeferredValue, useEffect, useState } from 'react';
import { ArrowLeft, Search, SearchX } from 'lucide-react';
import { DECKS, GUILD_BY_KEY, GUILD_QUESTIONS } from '../lib/guilds';
import { RANK_COLOR, SECTION_ICONS } from '../lib/theme';
import { go } from '../lib/useHashRoute';
import { gateName } from '../lib/lore';
import { tone } from '../lib/themes';
import CardDeck from './CardDeck';
import PatternModal from './PatternModal';
import QuestionRow from './QuestionRow';
import { Bar, Empty } from './ui';

const statusFor = (pct) => {
  if (pct === 100) return { label: 'Cleared', color: 'var(--color-sys)' };
  if (pct >= 60) return { label: 'Mastering', color: 'var(--color-easy)' };
  if (pct >= 25) return { label: 'Practicing', color: 'var(--color-medium)' };
  if (pct > 0) return { label: 'Learning', color: '#c4b5fd' };
  return { label: 'Unexplored', color: 'var(--color-faint)' };
};

const PatternCard = memo(function PatternCard({ pattern, done, guildColor }) {
  const Icon = SECTION_ICONS[pattern.name];
  const rc = RANK_COLOR[pattern.rank];
  const total = pattern.questions.length;
  const pct = Math.round((done / total) * 100);
  const status = statusFor(pct);
  return (
    <>
      <div className="absolute inset-0" style={{ background: `radial-gradient(110% 60% at 50% 0%, ${rc}30, transparent 65%), linear-gradient(180deg, var(--color-panel-2), var(--color-void))` }} />
      <div className="absolute inset-0 card-grid opacity-50" />
      {Icon && <Icon className="absolute -right-10 top-16 opacity-[0.07] rotate-12" size={240} strokeWidth={1} style={{ color: tone(rc) }} />}

      <div className="relative h-full flex flex-col p-6 text-left">
        <div className="flex items-center justify-between">
          <span className="pill sys-heading tracking-wider" style={{ color: tone(rc), background: `${rc}1a` }}>{pattern.rank}-RANK</span>
          <span className="text-[11px] text-dim tabular">{total} monsters</span>
        </div>

        <div className="flex-1 grid place-items-center">
          {Icon && (
            <div className="crest grid place-items-center w-20 h-20" style={{ color: tone(rc), background: `${rc}12`, boxShadow: `inset 0 0 0 1.5px ${rc}77, 0 0 36px -10px ${rc}` }}>
              <Icon size={32} strokeWidth={1.6} />
            </div>
          )}
        </div>

        <div className="text-[10.5px] uppercase tracking-[0.18em] text-dim font-semibold">{pattern.name}</div>
        <h3 className="sys-heading text-[21px] leading-tight text-hi mt-0.5">{gateName(pattern.name)}</h3>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {pattern.topics.slice(0, 3).map((t) => (
            <span key={t.name} className="text-[10.5px] text-dim border border-line rounded-md px-1.5 py-0.5 truncate max-w-[140px]">{t.name}</span>
          ))}
          {pattern.topics.length > 3 && <span className="text-[10.5px] text-faint px-1 py-0.5">+{pattern.topics.length - 3}</span>}
        </div>

        <div className="mt-4 flex justify-between items-end text-sm mb-1.5">
          <span className="font-semibold" style={{ color: status.color }}>{status.label}</span>
          <span className="text-hi font-bold tabular">{pct}%</span>
        </div>
        <Bar value={done} total={total} color={rc} />
        <div className="mt-1.5 text-[11px] text-faint tabular">{done} of {total} defeated</div>

        <div className="deck-cta mt-4 pt-3 border-t border-line text-center text-[13px] font-semibold" style={{ color: tone(guildColor) }}>
          Enter gate · {pattern.topics.length} floors
        </div>
      </div>
    </>
  );
});

const nameOf = (p) => p.name;

export default function GuildDeck({ guildKey, openPattern, completed, dueIds, notes, onToggle, onOpen }) {
  const guild = GUILD_BY_KEY[guildKey];
  const deck = DECKS[guildKey];
  const len = deck.length;
  const [active, setActive] = useState(() => Math.max(0, deck.findIndex((p) => p.name === openPattern)));
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query.trim().toLowerCase());

  const openAt = useCallback((i) => go(`guilds/${guildKey}?p=${encodeURIComponent(deck[i].name)}`), [guildKey, deck]);

  useEffect(() => {
    const onKey = (e) => {
      if (openPattern || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') setActive((a) => (a + 1) % len);
      else if (e.key === 'ArrowLeft') setActive((a) => (a - 1 + len) % len);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openPattern, len]);

  const all = GUILD_QUESTIONS[guildKey];
  const done = all.filter((x) => completed[x.id]).length;
  const results = q ? all.filter((x) => x.title.toLowerCase().includes(q) || x.pattern.toLowerCase().includes(q) || x.topic.toLowerCase().includes(q)).slice(0, 60) : null;
  const current = openPattern ? deck.find((p) => p.name === openPattern) : null;

  const renderCard = useCallback(
    (p) => <PatternCard pattern={p} done={p.questions.filter((x) => completed[x.id]).length} guildColor={guild.color} />,
    [completed, guild.color],
  );

  return (
    <div className="flex flex-col md:h-full min-h-0">
      <header className="flex flex-wrap items-center gap-4 mb-4 shrink-0 anim-rise">
        <a href="#/guilds" className="grid place-items-center w-9 h-9 rounded-lg border border-line text-dim hover:text-ink hover:border-line-strong" aria-label="Back to guild hall">
          <ArrowLeft size={17} />
        </a>
        <div className="crest grid place-items-center w-11 h-11 sys-heading text-xs" style={{ color: tone(guild.color), background: `${guild.color}14`, boxShadow: `inset 0 0 0 1.5px ${guild.color}77` }}>
          {guild.crest}
        </div>
        <div className="min-w-0">
          <div className="text-[10.5px] tracking-[0.2em] uppercase font-semibold" style={{ color: tone(guild.color) }}>{guild.tag}</div>
          <h1 className="sys-heading text-2xl leading-tight">{guild.name}</h1>
        </div>
        <div className="ml-auto flex items-center gap-3 min-w-[200px]">
          <Bar value={done} total={all.length} color={guild.color} className="flex-1" />
          <span className="text-sm text-dim tabular whitespace-nowrap">{done} / {all.length}</span>
        </div>
      </header>

      <div className="relative w-full max-w-md mx-auto mb-1 shrink-0 anim-rise">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${guild.name}…`} className="input pl-9" />
      </div>

      {results ? (
        <div className="mt-4 flex-1 min-h-0 overflow-y-auto scroll-thin anim-fade">
          {results.length === 0 ? (
            <Empty icon={SearchX} title="Nothing found">No problem in this guild matches “{query}”.</Empty>
          ) : (
            <div className="card overflow-hidden">
              {results.map((x) => (
                <QuestionRow key={x.id} q={x} solved={completed[x.id]} hasNote={!!notes[x.id]} due={dueIds.has(x.id)} onToggle={onToggle} onOpen={onOpen} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <CardDeck
          items={deck}
          active={active}
          onActive={setActive}
          onOpen={openAt}
          accent={guild.color}
          labelOf={nameOf}
          renderCard={renderCard}
          itemName="gate"
        />
      )}

      {current && (
        <PatternModal
          pattern={current}
          guild={guild}
          completed={completed}
          dueIds={dueIds}
          notes={notes}
          onToggle={onToggle}
          onOpen={onOpen}
          onClose={() => go(`guilds/${guildKey}`)}
        />
      )}
    </div>
  );
}
