import { memo, useCallback, useEffect, useState } from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { GUILDS, GUILD_QUESTIONS, DECKS } from '../lib/guilds';
import { go } from '../lib/useHashRoute';
import { tone } from '../lib/themes';
import CardDeck from './CardDeck';
import { Bar } from './ui';

const GuildCard = memo(function GuildCard({ guild, done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const c = guild.color;
  return (
    <>
      <div className="absolute inset-0" style={{ background: `radial-gradient(120% 70% at 50% 0%, ${c}33, transparent 60%), linear-gradient(180deg, var(--color-panel-2), var(--color-void))` }} />
      <div className="absolute inset-0 card-grid opacity-60" />

      {guild.unique && (
        <div className="absolute top-4 right-4 flex items-center gap-1 pill" style={{ color: tone(c), background: `${c}1a` }}>
          <BadgeCheck size={12} /> UNIQUE
        </div>
      )}

      <div className="relative h-full flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center pt-6 px-5">
          <div
            className="crest grid place-items-center w-24 h-24 sys-heading text-2xl"
            style={{ color: tone(c), background: `${c}14`, boxShadow: `inset 0 0 0 1.5px ${c}88, 0 0 40px -8px ${c}` }}
          >
            {guild.crest}
          </div>
          <div className="mt-5 text-[10.5px] tracking-[0.22em] uppercase font-semibold" style={{ color: tone(c) }}>{guild.tag}</div>
          <h3 className="sys-heading text-[22px] leading-tight mt-1 text-hi text-center">{guild.name}</h3>
          <p className="text-[13px] text-dim text-center mt-2 leading-snug">{guild.motto}</p>
        </div>

        <div className="px-5 pb-5">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-dim tabular">{DECKS[guild.key].length} gates · {total} monsters</span>
            <span className="text-ink font-semibold tabular">{pct}%</span>
          </div>
          <Bar value={done} total={total} color={c} />
          <div
            className="deck-cta mt-4 flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-semibold"
            style={{ borderColor: `${c}55`, color: tone(c) }}
          >
            {done ? 'Enter guild' : 'Join guild'} <ArrowRight size={15} />
          </div>
        </div>
      </div>
    </>
  );
});

const keyOf = (g) => g.key;
const LAST_KEY = 'lastGuild';

export default function GuildsPage({ completed }) {
  const len = GUILDS.length;
  const [active, setActive] = useState(() => Math.max(0, GUILDS.findIndex((g) => g.key === localStorage.getItem(LAST_KEY))));

  const openAt = useCallback((i) => {
    localStorage.setItem(LAST_KEY, GUILDS[i].key);
    go(`guilds/${GUILDS[i].key}`);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') setActive((a) => (a + 1) % len);
      else if (e.key === 'ArrowLeft') setActive((a) => (a - 1 + len) % len);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [len]);

  const renderCard = useCallback((g) => {
    const qs = GUILD_QUESTIONS[g.key];
    return <GuildCard guild={g} total={qs.length} done={qs.filter((q) => completed[q.id]).length} />;
  }, [completed]);

  return (
    <div className="flex flex-col md:h-full min-h-0">
      <header className="mb-4 shrink-0 anim-rise">
        <div className="sys-label mb-1.5">Guild Hall</div>
        <h1 className="sys-heading text-2xl md:text-[28px]">Choose your guild</h1>
        <p className="text-dim text-sm mt-1.5">Every guild has its own deck of gates. A monster defeated anywhere counts in every guild.</p>
      </header>
      <CardDeck
        items={GUILDS}
        active={active}
        onActive={setActive}
        onOpen={openAt}
        accent={GUILDS[active].color}
        labelOf={keyOf}
        renderCard={renderCard}
        itemName="guild"
      />
    </div>
  );
}
