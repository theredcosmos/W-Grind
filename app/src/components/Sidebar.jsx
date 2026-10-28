import { memo } from 'react';
import { BookOpenText, CloudOff, LayoutGrid, Palette, RotateCcw, Shield, Trophy } from 'lucide-react';
import { tone } from '../lib/themes';

const NAV = [
  { id: 'status', label: 'Status', icon: LayoutGrid },
  { id: 'guilds', label: 'Guilds', icon: Shield },
  { id: 'reviews', label: 'Reviews', icon: RotateCcw },
  { id: 'codex', label: 'Codex', icon: BookOpenText },
];

const Sidebar = memo(function Sidebar({ page, username, offline, level, rank, dueCount, onSettings }) {
  return (
    <>
      <aside className="hidden md:flex flex-col shrink-0 w-[76px] xl:w-[232px] h-full border-r border-line bg-abyss/80 px-3 py-5">
        <a href="#/status" className="flex items-center gap-3 px-2 mb-8">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-sys-deep to-mana glow-md">
            <span className="sys-heading text-on-accent text-sm">W</span>
          </div>
          <div className="hidden xl:block leading-tight">
            <div className="sys-heading text-[15px]">W-Grind</div>
            <div className="text-[11px] text-faint tracking-wide">Gate Tracker</div>
          </div>
        </a>

        <nav className="flex flex-col gap-1">
          {NAV.map(({ id, label, icon: Icon }) => {
            const on = page === id;
            return (
              <a
                key={id}
                href={`#/${id}`}
                title={label}
                className={`relative flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  on ? 'text-hi bg-sys/12' : 'text-dim hover:text-ink hover:bg-ink/[0.04]'
                }`}
              >
                {on && <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r bg-sys glow-sm" />}
                <Icon size={19} className={on ? 'text-sys' : ''} />
                <span className="hidden xl:inline">{label}</span>
                {id === 'reviews' && dueCount > 0 && (
                  <span className="absolute xl:static right-1.5 top-1.5 xl:ml-auto grid place-items-center min-w-5 h-5 px-1.5 rounded-full bg-hard text-[10px] font-bold text-white tabular">
                    {dueCount}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        <div className="mt-auto mb-2 flex flex-col gap-1">
          <a
            href="#/titles"
            title="Titles & achievements"
            className={`relative flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
              page === 'titles' ? 'text-hi bg-sys/12' : 'text-dim hover:text-ink hover:bg-ink/[0.04]'
            }`}
          >
            {page === 'titles' && <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r bg-sys glow-sm" />}
            <Trophy size={19} className={page === 'titles' ? 'text-sys' : ''} />
            <span className="hidden xl:inline">Titles</span>
          </a>
          <button
            onClick={onSettings}
            title="Themes & settings"
            className="flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-dim hover:text-ink hover:bg-ink/[0.04] transition-colors"
          >
            <Palette size={19} />
            <span className="hidden xl:inline">Themes</span>
          </button>
        </div>

        <button onClick={onSettings} className="card p-2.5 flex items-center gap-3 text-left hover:border-line-strong">
          <div
            className="grid place-items-center w-9 h-9 shrink-0 rounded-lg sys-heading text-sm"
            style={{ color: tone(rank.color), background: `${rank.color}1f`, boxShadow: `inset 0 0 0 1px ${rank.color}55` }}
          >
            {rank.id}
          </div>
          <div className="hidden xl:block min-w-0 flex-1">
            <div className="text-[13px] font-semibold truncate">{username}</div>
            <div className="text-[11px] text-dim">Lv. {level} · {rank.name}</div>
          </div>
          {offline && <CloudOff size={15} className="hidden xl:block text-gold shrink-0" title="Offline profile" />}
        </button>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around border-t border-line bg-abyss/95 px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#/${id}`}
            className={`relative flex flex-col items-center gap-1 py-2.5 px-2 text-[10.5px] font-medium ${page === id ? 'text-sys' : 'text-dim'}`}
          >
            <Icon size={20} />
            {label}
            {id === 'reviews' && dueCount > 0 && <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-hard" />}
          </a>
        ))}
        <a href="#/titles" className={`flex flex-col items-center gap-1 py-2.5 px-2 text-[10.5px] font-medium ${page === 'titles' ? 'text-sys' : 'text-dim'}`}>
          <Trophy size={20} />
          Titles
        </a>
        <button onClick={onSettings} className="flex flex-col items-center gap-1 py-2.5 px-2 text-[10.5px] font-medium text-dim">
          <Palette size={20} />
          Themes
        </button>
      </nav>
    </>
  );
});

export default Sidebar;
