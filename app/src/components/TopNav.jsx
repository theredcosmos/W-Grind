import React from 'react';
import { Bell, Settings, Moon, Sun, LogOut } from 'lucide-react';

const TopNav = ({ theme, toggleTheme, username, level, onOpenSettings, onSignOut }) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-glass-text flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
            <span className="text-white font-black text-sm">LT</span>
          </div>
          LeetTracker
        </h1>
        <div className="hidden md:flex ml-4 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-accent-success shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          <span className="text-xs font-medium text-glass-muted">Sync Active</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button onClick={toggleTheme} className="p-2 rounded-full text-glass-muted hover:text-glass-text hover:bg-white/10 transition-colors">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button className="p-2 rounded-full text-glass-muted hover:text-glass-text hover:bg-white/10 transition-colors">
          <Bell size={20} />
        </button>
        <button 
          onClick={onOpenSettings}
          className="p-2 rounded-full text-glass-muted hover:text-glass-text hover:bg-white/10 transition-colors"
        >
          <Settings size={20} />
        </button>
        <button 
          onClick={onSignOut}
          className="p-2 rounded-full text-glass-muted hover:text-accent-danger hover:bg-accent-danger/10 transition-colors mr-2"
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-glass-border">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-glass-text">{username || "User"}</div>
            <div className="text-xs text-brand-primary-light font-medium">Level {level || 1}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-secondary p-[2px]">
            <div className="w-full h-full rounded-full bg-glass-bg flex items-center justify-center overflow-hidden border border-transparent">
              <span className="text-sm">👤</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
