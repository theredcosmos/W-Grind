import React from 'react';
import './ThemeToggle.css';

function ThemeToggle({ theme, toggleTheme }) {
  const isDark = theme === 'dark';
  
  return (
    <button 
      className={`theme-toggle ${isDark ? 'dark' : 'light'}`}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <div className="toggle-thumb">
        {isDark ? '🌙' : '☀️'}
      </div>
    </button>
  );
}

export default ThemeToggle;
