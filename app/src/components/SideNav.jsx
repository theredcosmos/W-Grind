import React from 'react';
import { LayoutDashboard, Network, Layers, BarChart2, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

const SideNav = ({ theme, toggleTheme, username, level, onOpenSettings, onSignOut, activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'skillTree', label: 'Skill Tree', icon: Network },
    { id: 'problemBoard', label: 'Problem Board', icon: Layers },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <div className="w-64 h-screen bg-glass-panel backdrop-blur-xl border-r border-glass-border flex flex-col fixed left-0 top-0 z-40 transition-all duration-300">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-tight text-glass-text flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <span className="text-white font-black text-xs">LC</span>
          </div>
          TrackerPro
        </h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative
                ${isActive 
                  ? 'text-white' 
                  : 'text-glass-muted hover:text-glass-text hover:bg-white/5'
                }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute left-0 top-2 bottom-2 w-1.5 bg-brand-primary rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.8)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon size={20} className="relative z-10" />
              <span className="font-medium relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-6">
        <div className="flex items-center justify-between px-2">
          <span className="text-sm font-medium text-glass-muted">Theme</span>
          <button onClick={toggleTheme} className="text-glass-muted hover:text-brand-secondary transition-colors">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-[2px] flex-shrink-0">
            <div className="w-full h-full rounded-full bg-glass-bg flex items-center justify-center overflow-hidden">
              <span className="text-xs font-bold text-white">
                {username ? username.slice(0, 2).toUpperCase() : 'US'}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-glass-text truncate">{username || "User"}</div>
            <div className="text-xs text-brand-primary-light font-medium">Level {level || 1} Pro</div>
          </div>
        </div>
        
        <div className="flex justify-around pt-2">
          <button 
            onClick={onOpenSettings}
            className="flex flex-col items-center justify-center gap-1 text-glass-muted hover:text-brand-primary transition-colors text-xs font-medium"
          >
            <Settings size={20} />
            Settings
          </button>
          <button 
            onClick={onSignOut}
            className="flex flex-col items-center justify-center gap-1 text-glass-muted hover:text-accent-danger transition-colors text-xs font-medium"
            title="Log Out"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default SideNav;
