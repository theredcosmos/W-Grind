import { useCallback, useState } from 'react';

// Colours here only drive the picker previews; the real values live in index.css.
export const THEMES = [
  { id: 'system', name: 'Abyssal Gate', note: 'Gate portal · mana motes', bg: '#04060c', panel: '#0e172d', accent: '#4cc2ff', ink: '#e6edf8', meta: '#04060c', font: "'Chakra Petch'" },
  { id: 'noir', name: 'Noir City', note: 'Skyline · searchlight · grain', bg: '#07080a', panel: '#18191d', accent: '#ffd60a', ink: '#e8e6e3', meta: '#07080a', font: "'Bebas Neue'" },
  { id: 'sakura', name: 'Sakura', note: 'Blossoms · drifting petals', bg: '#e6cfd6', panel: '#f8f0f3', accent: '#c23a6c', ink: '#3a2430', meta: '#e6cfd6', font: "'Shippori Mincho B1'" },
  { id: 'tide', name: 'Tide', note: 'Rolling ocean waves', bg: '#031a26', panel: '#0a3349', accent: '#3ee0d0', ink: '#dff6fb', meta: '#031a26', font: "'Sora'" },
  { id: 'aurora', name: 'Aurora', note: 'Northern lights · mountains', bg: '#060912', panel: '#121a30', accent: '#6ef2b4', ink: '#e7eefc', meta: '#060912', font: "'Space Grotesk'" },
  { id: 'zen', name: 'Zen Paper', note: 'Still · ink on paper', bg: '#e0d9cb', panel: '#f5f1e8', accent: '#22201c', ink: '#22201c', meta: '#e0d9cb', font: "'Instrument Serif'" },
];

// Themes from earlier builds that no longer exist.
const RENAMED = { minimal: 'zen', nord: 'aurora', matrix: 'system', gotham: 'noir' };

const KEY = 'uiTheme';
const MOTION_KEY = 'ambientMotion';

const read = (key, fallback) => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};

const resolve = (id) => THEMES.find((t) => t.id === (RENAMED[id] || id)) || THEMES[0];

export const applyTheme = (id) => {
  const theme = resolve(id);
  const root = document.documentElement;
  if (theme.id === 'system') delete root.dataset.theme;
  else root.dataset.theme = theme.id;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme.meta);
  return theme.id;
};

export const applyMotion = (on) => {
  if (on) delete document.documentElement.dataset.still;
  else document.documentElement.dataset.still = '';
};

export const storedTheme = () => read(KEY, 'system');
export const storedMotion = () => read(MOTION_KEY, 'on') !== 'off';

export function useTheme() {
  const [theme, setThemeState] = useState(() => resolve(storedTheme()).id);
  const setTheme = useCallback((id) => {
    const applied = applyTheme(id);
    try { localStorage.setItem(KEY, applied); } catch { /* private mode */ }
    setThemeState(applied);
  }, []);
  return [theme, setTheme];
}

export function useMotion() {
  const [motion, setMotionState] = useState(storedMotion);
  const setMotion = useCallback((on) => {
    applyMotion(on);
    try { localStorage.setItem(MOTION_KEY, on ? 'on' : 'off'); } catch { /* private mode */ }
    setMotionState(on);
  }, []);
  return [motion, setMotion];
}

/** Fixed brand colours (ranks, guilds) are darkened toward the ink colour on light themes. */
export const tone = (hex) => `color-mix(in srgb, ${hex} var(--tone), var(--color-ink))`;
