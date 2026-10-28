import { useCallback, useState } from 'react';

// Colours here only drive the picker previews; the real values live in index.css.
export const THEMES = [
  { id: 'system', name: 'The System', note: 'Solo Leveling blue', bg: '#04060c', panel: '#0e172d', accent: '#4cc2ff', ink: '#e6edf8', meta: '#04060c' },
  { id: 'gotham', name: 'Gotham', note: 'Batman · signal yellow', bg: '#08090a', panel: '#1a1b1f', accent: '#facc15', ink: '#e7e5e4', meta: '#08090a' },
  { id: 'sakura', name: 'Sakura', note: 'Light · cherry blossom', bg: '#fbf4f6', panel: '#ffffff', accent: '#c23a6c', ink: '#3d2531', meta: '#fbf4f6' },
  { id: 'minimal', name: 'Minimal', note: 'Light · monochrome', bg: '#f6f6f4', panel: '#ffffff', accent: '#1c1c1c', ink: '#1c1c1c', meta: '#f6f6f4' },
  { id: 'matrix', name: 'Matrix', note: 'Terminal green', bg: '#010401', panel: '#06170b', accent: '#22c55e', ink: '#c8f7d4', meta: '#010401' },
  { id: 'nord', name: 'Nord', note: 'Calm arctic slate', bg: '#242933', panel: '#363d4b', accent: '#88c0d0', ink: '#e5e9f0', meta: '#242933' },
];

const KEY = 'uiTheme';

export const applyTheme = (id) => {
  const theme = THEMES.find((t) => t.id === id) || THEMES[0];
  const root = document.documentElement;
  if (theme.id === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.meta);
  return theme.id;
};

export const storedTheme = () => {
  try {
    return localStorage.getItem(KEY) || 'system';
  } catch {
    return 'system';
  }
};

export function useTheme() {
  const [theme, setThemeState] = useState(storedTheme);
  const setTheme = useCallback((id) => {
    const applied = applyTheme(id);
    try { localStorage.setItem(KEY, applied); } catch { /* private mode */ }
    setThemeState(applied);
  }, []);
  return [theme, setTheme];
}

/** Fixed brand colours (ranks, guilds) are darkened toward the ink colour on light themes. */
export const tone = (hex) => `color-mix(in srgb, ${hex} var(--tone), var(--color-ink))`;
