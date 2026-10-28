import { memo } from 'react';
import { BookOpenText, LayoutGrid, LogOut, RotateCcw, Shield } from 'lucide-react';

const NAV = [
  { id: 'status', label: 'Status', icon: LayoutGrid },
  { id: 'guilds', label: 'Guilds', icon: Shield },
  { id: 'reviews', label: 'Reviews', icon: RotateCcw },
  { id: 'codex', label: 'Codex', icon: BookOpenText },
];

const Sidebar = memo(function Sidebar({ page, username, level, rank, dueCount, onSignOut }) {
  return (
    <>
      <aside className="hidden md:flex flex-col shrink-0 w-[76px] xl:w-[232px] h-full border-r border-line bg-abyss/80 px-3 py-5">
        <a href="#/status" className="flex items-center gap-3 px-2 mb-8">
          <div className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-sys-deep to-mana shadow-[0_0_24px_-6px_rgb(76_194_255/0.8)]">
            <span className="sys-heading text-white text-sm">W</span>
          </div>
          <div className="hidden xl:block leading-tight">
            <div className="sys-heading text-[15px]">W-Grind</div>
            <div className="text-[11px] text-faint tracking-wide">The System</div>
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
                  on ? 'text-white bg-sys/12' : 'text-dim hover:text-ink hover:bg-white/[0.04]'
                }`}
              >
                {on && <span className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r bg-sys shadow-[0_0_12px_rgb(76_194_255)]" />}
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

        <div className="mt-auto card p-2.5 flex items-center gap-3">
          <div
            className="grid place-items-center w-9 h-9 shrink-0 rounded-lg sys-heading text-sm"
            style={{ color: rank.color, background: `${rank.color}1f`, boxShadow: `inset 0 0 0 1px ${rank.color}55` }}
          >
            {rank.id}
          </div>
          <div className="hidden xl:block min-w-0 flex-1">
            <div className="text-[13px] font-semibold truncate">{username}</div>
            <div className="text-[11px] text-dim">Lv. {level} · {rank.name}</div>
          </div>
          <button onClick={onSignOut} title="Sign out" className="hidden xl:grid place-items-center w-8 h-8 rounded-lg text-faint hover:text-hard hover:bg-white/5">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex justify-around border-t border-line bg-abyss/95 px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV.map(({ id, label, icon: Icon }) => (
          <a
            key={id}
            href={`#/${id}`}
            className={`relative flex flex-col items-center gap-1 py-2.5 px-3 text-[10.5px] font-medium ${page === id ? 'text-sys' : 'text-dim'}`}
          >
            <Icon size={20} />
            {label}
            {id === 'reviews' && dueCount > 0 && <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-hard" />}
          </a>
        ))}
      </nav>
    </>
  );
});

export default Sidebar;
