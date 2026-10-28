import { memo } from 'react';
import { ArrowRight, BadgeCheck } from 'lucide-react';
import { GUILDS, GUILD_QUESTIONS, DECKS } from '../lib/guilds';
import { Bar } from './ui';
import { tone } from '../lib/themes';

const GuildCard = memo(function GuildCard({ guild, done, total }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  const c = guild.color;
  return (
    <a
      href={`#/guilds/${guild.key}`}
      className="guild-card group relative flex flex-col h-[380px] rounded-2xl overflow-hidden"
      style={{ '--accent': c }}
    >
      <div className="absolute inset-0 card-art" style={{ background: `radial-gradient(120% 70% at 50% 0%, ${c}33, transparent 60%), linear-gradient(180deg, var(--color-panel-2), var(--color-void))` }} />
      <div className="absolute inset-0 card-grid opacity-60" />

      {guild.unique && (
        <div className="absolute top-4 right-4 flex items-center gap-1 pill" style={{ color: tone(c), background: `${c}1a` }}>
          <BadgeCheck size={12} /> UNIQUE
        </div>
      )}

      <div className="relative flex-1 flex flex-col items-center justify-center pt-6">
        <div
          className="crest grid place-items-center w-24 h-24 sys-heading text-2xl"
          style={{ color: tone(c), background: `${c}14`, boxShadow: `inset 0 0 0 1.5px ${c}88, 0 0 40px -8px ${c}` }}
        >
          {guild.crest}
        </div>
        <div className="mt-5 text-[10.5px] tracking-[0.22em] uppercase font-semibold" style={{ color: tone(c) }}>{guild.tag}</div>
        <h3 className="sys-heading text-[22px] mt-1 text-hi text-center px-4">{guild.name}</h3>
        <p className="text-[13px] text-dim text-center mt-2 px-6 leading-snug">{guild.motto}</p>
      </div>

      <div className="relative px-5 pb-5">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-dim tabular">{DECKS[guild.key].length} patterns · {total} problems</span>
          <span className="text-ink font-semibold tabular">{pct}%</span>
        </div>
        <Bar value={done} total={total} color={c} />
        <div className="mt-4 flex items-center justify-center gap-2 h-10 rounded-xl border text-sm font-semibold transition-colors"
          style={{ borderColor: `${c}55`, color: tone(c) }}>
          {done ? 'Enter guild' : 'Join guild'} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </a>
  );
});

export default function GuildsPage({ completed }) {
  return (
    <div>
      <header className="mb-8 anim-rise">
        <div className="sys-label mb-1.5">Guild Hall</div>
        <h1 className="sys-heading text-2xl md:text-[28px]">Choose your guild</h1>
        <p className="text-dim text-sm mt-1.5">Every guild has its own deck of patterns. Progress is shared across all of them.</p>
      </header>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 stagger">
        {GUILDS.map((g) => {
          const qs = GUILD_QUESTIONS[g.key];
          return <GuildCard key={g.key} guild={g} total={qs.length} done={qs.filter((q) => completed[q.id]).length} />;
        })}
      </div>
    </div>
  );
}
