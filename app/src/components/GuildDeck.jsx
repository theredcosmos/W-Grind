import { memo, useDeferredValue, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, SearchX } from 'lucide-react';
import { DECKS, GUILD_BY_KEY, GUILD_QUESTIONS } from '../lib/guilds';
import { RANK_COLOR, SECTION_ICONS } from '../lib/theme';
import { go } from '../lib/useHashRoute';
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

// Signed distance from the active card, wrapping around the deck.
const offsetOf = (i, active, len) => {
  const half = Math.floor(len / 2);
  return ((((i - active) % len) + len + half) % len) - half;
};

const PatternCard = memo(function PatternCard({ pattern, done, offset, guildColor, onClick }) {
  const Icon = SECTION_ICONS[pattern.name];
  const rc = RANK_COLOR[pattern.rank];
  const total = pattern.questions.length;
  const pct = Math.round((done / total) * 100);
  const status = statusFor(pct);
  const center = offset === 0;
  const hidden = Math.abs(offset) > 2;
  return (
    <button
      type="button"
      onClick={onClick}
      tabIndex={center ? 0 : -1}
      aria-hidden={hidden}
      className={`deck-card ${center ? 'is-center' : ''} ${Math.abs(offset) === 2 ? 'far' : ''}`}
      style={{
        '--o': offset,
        '--abs': Math.abs(offset),
        '--accent': guildColor,
        zIndex: 10 - Math.abs(offset),
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? 'none' : 'auto',
      }}
    >
      <div className="absolute inset-0" style={{ background: `radial-gradient(110% 60% at 50% 0%, ${rc}30, transparent 65%), linear-gradient(180deg, #0d162c, #050911)` }} />
      <div className="absolute inset-0 card-grid opacity-50" />
      {Icon && <Icon className="absolute -right-10 top-16 opacity-[0.07] rotate-12" size={240} strokeWidth={1} style={{ color: rc }} />}

      <div className="relative h-full flex flex-col p-6 text-left">
        <div className="flex items-center justify-between">
          <span className="pill sys-heading tracking-wider" style={{ color: rc, background: `${rc}1a` }}>{pattern.rank}-RANK</span>
          <span className="text-[11px] text-dim tabular">{total} problems</span>
        </div>

        <div className="flex-1 grid place-items-center">
          {Icon && (
            <div className="crest grid place-items-center w-20 h-20" style={{ color: rc, background: `${rc}12`, boxShadow: `inset 0 0 0 1.5px ${rc}77, 0 0 36px -10px ${rc}` }}>
              <Icon size={32} strokeWidth={1.6} />
            </div>
          )}
        </div>

        <h3 className="sys-heading text-[22px] leading-tight text-white">{pattern.name}</h3>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {pattern.topics.slice(0, 3).map((t) => (
            <span key={t.name} className="text-[10.5px] text-dim border border-line rounded-md px-1.5 py-0.5 truncate max-w-[140px]">{t.name}</span>
          ))}
          {pattern.topics.length > 3 && <span className="text-[10.5px] text-faint px-1 py-0.5">+{pattern.topics.length - 3}</span>}
        </div>

        <div className="mt-4 flex justify-between items-end text-sm mb-1.5">
          <span className="font-semibold" style={{ color: status.color }}>{status.label}</span>
          <span className="text-white font-bold tabular">{pct}%</span>
        </div>
        <Bar value={done} total={total} color={rc} />
        <div className="mt-1.5 text-[11px] text-faint tabular">{done} of {total} cleared</div>

        <div className="deck-cta mt-4 pt-3 border-t border-white/10 text-center text-[13px] font-semibold" style={{ color: guildColor }}>
          Enter · view subpatterns
        </div>
      </div>
    </button>
  );
});

export default function GuildDeck({ guildKey, openPattern, completed, dueIds, notes, onToggle, onOpen }) {
  const guild = GUILD_BY_KEY[guildKey];
  const deck = DECKS[guildKey];
  const [active, setActive] = useState(() => Math.max(0, deck.findIndex((p) => p.name === openPattern)));
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query.trim().toLowerCase());
  const drag = useRef(null);
  const swipedAt = useRef(0);
  const len = deck.length;

  const step = (d) => setActive((a) => (a + d + len) % len);
  const open = (p) => go(`guilds/${guildKey}?p=${encodeURIComponent(p.name)}`);

  useEffect(() => {
    const onKey = (e) => {
      if (openPattern || ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Enter' && document.activeElement === document.body) open(deck[active]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const all = GUILD_QUESTIONS[guildKey];
  const done = all.filter((x) => completed[x.id]).length;
  const results = q ? all.filter((x) => x.title.toLowerCase().includes(q) || x.pattern.toLowerCase().includes(q) || x.topic.toLowerCase().includes(q)).slice(0, 60) : null;
  const current = openPattern ? deck.find((p) => p.name === openPattern) : null;

  return (
    <div>
      <header className="flex flex-wrap items-center gap-4 mb-6 anim-rise">
        <a href="#/guilds" className="grid place-items-center w-9 h-9 rounded-lg border border-line text-dim hover:text-ink hover:border-line-strong" aria-label="Back to guild hall">
          <ArrowLeft size={17} />
        </a>
        <div className="crest grid place-items-center w-11 h-11 sys-heading text-xs" style={{ color: guild.color, background: `${guild.color}14`, boxShadow: `inset 0 0 0 1.5px ${guild.color}77` }}>
          {guild.crest}
        </div>
        <div className="min-w-0">
          <div className="text-[10.5px] tracking-[0.2em] uppercase font-semibold" style={{ color: guild.color }}>{guild.tag}</div>
          <h1 className="sys-heading text-2xl leading-tight">{guild.name}</h1>
        </div>
        <div className="ml-auto flex items-center gap-3 min-w-[200px]">
          <Bar value={done} total={all.length} color={guild.color} className="flex-1" />
          <span className="text-sm text-dim tabular whitespace-nowrap">{done} / {all.length}</span>
        </div>
      </header>

      <div className="relative max-w-md mx-auto mb-2 anim-rise">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${guild.name}…`} className="input pl-9" />
      </div>

      {results ? (
        <div className="mt-6 anim-fade">
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
        <>
          <div
            className="deck"
            onPointerDown={(e) => { drag.current = e.clientX; }}
            onPointerUp={(e) => {
              if (drag.current == null) return;
              const dx = e.clientX - drag.current;
              drag.current = null;
              if (Math.abs(dx) > 40) {
                swipedAt.current = Date.now();
                step(dx < 0 ? 1 : -1);
              }
            }}
          >
            {deck.map((p, i) => {
              const offset = offsetOf(i, active, len);
              return (
                <PatternCard
                  key={p.name}
                  pattern={p}
                  done={p.questions.filter((x) => completed[x.id]).length}
                  offset={offset}
                  guildColor={guild.color}
                  onClick={() => {
                    if (Date.now() - swipedAt.current < 250) return;
                    if (offset === 0) open(p);
                    else setActive(i);
                  }}
                />
              );
            })}
            <button onClick={() => step(-1)} className="deck-nav left-0 md:left-4" aria-label="Previous pattern"><ChevronLeft size={22} /></button>
            <button onClick={() => step(1)} className="deck-nav right-0 md:right-4" aria-label="Next pattern"><ChevronRight size={22} /></button>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            {deck.map((p, i) => (
              <button
                key={p.name}
                onClick={() => setActive(i)}
                aria-label={p.name}
                title={p.name}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ width: i === active ? 22 : 6, background: i === active ? guild.color : 'rgb(255 255 255 / 0.15)' }}
              />
            ))}
          </div>
          <p className="text-center text-[11.5px] text-faint mt-3 hidden md:block">
            <span className="kbd">←</span> <span className="kbd">→</span> to browse · click the centre card to enter
          </p>
        </>
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
