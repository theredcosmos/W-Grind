import { Check, Lock } from 'lucide-react';
import { ACHIEVEMENT_ICONS } from '../lib/theme';
import { Bar, PageHeader } from './ui';

const GROUPS = [
  { name: 'Clears', metrics: ['solved', 'hard'] },
  { name: 'Discipline', metrics: ['bestStreak', 'questDays', 'reviewsDone'] },
  { name: 'Conquest', metrics: ['gatesCleared', 'list:blind75', 'list:neetcode150', 'list:top150', 'list:striver'] },
];

const Tile = ({ a, equipped, onEquip }) => {
  const Icon = ACHIEVEMENT_ICONS[a.icon] || Lock;
  return (
    <div className={`card p-4 flex flex-col ${a.unlocked ? 'border-sys/30' : 'opacity-80'}`}>
      <div className="flex items-start gap-3">
        <div className={`grid place-items-center w-10 h-10 shrink-0 rounded-xl ${a.unlocked ? 'bg-sys/15 text-sys glow-sm' : 'bg-ink/[0.05] text-faint'}`}>
          {a.unlocked ? <Icon size={18} /> : <Lock size={15} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className={`sys-heading text-[15px] leading-tight ${a.unlocked ? 'text-hi' : 'text-dim'}`}>{a.name}</div>
          <div className="text-[12px] text-faint mt-0.5 leading-snug">{a.desc}</div>
        </div>
        <span className="text-[11px] font-semibold text-sys shrink-0">+{a.xp}</span>
      </div>
      <div className="mt-auto pt-3 flex items-center gap-3">
        <Bar value={a.value} total={a.target} className="flex-1 h-1.5" />
        {a.unlocked ? (
          <button
            onClick={() => onEquip(a.id)}
            disabled={equipped}
            className={`text-[11.5px] font-semibold h-7 px-2.5 rounded-lg border transition-colors ${equipped ? 'border-sys/50 text-sys' : 'border-line text-dim hover:text-ink hover:border-line-strong'}`}
          >
            {equipped ? <span className="flex items-center gap-1"><Check size={12} /> Equipped</span> : 'Equip'}
          </button>
        ) : (
          <span className="text-[11px] text-faint tabular">{a.value}/{a.target}</span>
        )}
      </div>
    </div>
  );
};

export default function TitlesPage({ achievements, equippedId, title, onEquip }) {
  const unlocked = achievements.filter((a) => a.unlocked).length;
  return (
    <div className="flex flex-col md:h-full min-h-0">
      <PageHeader kicker="Hall of Titles" title="Titles & Achievements">
        <div className="text-sm text-dim"><span className="text-ink font-semibold tabular">{unlocked}</span> / {achievements.length} earned</div>
      </PageHeader>

      <div className="sys-window p-5 mb-5 flex items-center gap-4 shrink-0 anim-rise">
        <div className="sys-label">Equipped</div>
        <div className="sys-heading text-2xl text-hi glow-text truncate">{title}</div>
        <div className="ml-auto text-xs text-faint hidden sm:block">Shown on your Status window. Equip any earned title.</div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto scroll-thin -mx-1 px-1 pb-2 space-y-6">
        {GROUPS.map((g) => (
          <section key={g.name}>
            <h2 className="sys-label mb-3">{g.name}</h2>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {achievements.filter((a) => g.metrics.includes(a.metric)).map((a) => (
                <Tile key={a.id} a={a} equipped={a.id === equippedId} onEquip={onEquip} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
