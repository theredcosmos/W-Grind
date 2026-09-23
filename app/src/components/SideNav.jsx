import React from 'react';
import { LayoutDashboard, Network, Layers, BarChart2, Settings, LogOut, Sun, Moon } from 'lucide-react';

const SideNav = ({ theme, toggleTheme, username, level, onOpenSettings, onSignOut, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'skillTree', label: 'Skill Tree', icon: Network },
    { id: 'problemBoard', label: 'Problem Board', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const bottomActions = [
    { id: 'theme', label: theme === 'dark' ? 'Light Mode' : 'Dark Mode', icon: theme === 'dark' ? Sun : Moon, onClick: toggleTheme },
    { id: 'settings', label: 'Settings', icon: Settings, onClick: onOpenSettings },
  ];

  return (
    <aside className="group relative h-full w-[72px] hover:w-[240px] flex-shrink-0 bg-glass-panel backdrop-blur-xl border border-glass-border flex flex-col py-5 px-3 rounded-2xl transition-[width] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden z-50 shadow-lg hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      
      {/* Brand */}
      <div className="flex items-center gap-4 px-1.5 mb-8">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
          <span className="text-white font-black text-sm">LC</span>
        </div>
        <h2 className="text-glass-text text-base font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          TrackerPro
        </h2>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 flex flex-col gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                  : 'text-glass-muted hover:text-glass-text hover:bg-white/5'
              }`}
            >
              <Icon size={22} className="flex-shrink-0" />
              <span className="font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions (Theme, Settings) */}
      <div className="flex flex-col gap-1.5 mb-4">
        {bottomActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex items-center gap-4 p-3 rounded-xl text-glass-muted hover:text-glass-text hover:bg-white/5 transition-all duration-200"
            >
              <Icon size={22} className="flex-shrink-0" />
              <span className="font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* User Profile Card */}
      <div className="flex items-center gap-0 group-hover:gap-3 p-1.5 rounded-xl bg-white/5 border border-white/5 mt-auto relative group/profile overflow-hidden transition-all duration-200">
        <div className="flex-shrink-0 w-9 h-9 rounded-full border border-white/10 overflow-hidden">
           <div className="w-full h-full bg-glass-bg flex items-center justify-center">
             <span className="text-xs font-bold text-glass-text">
               {username ? username.slice(0, 2).toUpperCase() : 'US'}
             </span>
           </div>
        </div>
        <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap flex items-center justify-between pr-1 w-0 group-hover:w-auto">
          <div className="flex flex-col text-left">
            <h3 className="text-[13px] font-semibold text-glass-text truncate">{username || "User"}</h3>
            <p className="text-[10px] text-glass-muted font-medium">Level {level || 1} Pro</p>
          </div>
          <button 
            onClick={onSignOut}
            className="p-1 text-glass-muted hover:text-accent-danger transition-colors"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

    </aside>
  );
};

export default SideNav;
