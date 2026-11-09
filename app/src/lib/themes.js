import { useCallback, useState } from 'react';

// Colours here only drive the picker previews; the real values live in index.css.
export const THEMES = [
  { id: 'system', name: 'Abyssal Gate', note: 'Gate portal · mana motes', bg: '#04060c', panel: '#0e172d', accent: '#4cc2ff', ink: '#e6edf8', meta: '#04060c', font: "'Chakra Petch'" },
  { id: 'sakura', name: 'Sakura', note: 'Blossoms · drifting petals', bg: '#e6cfd6', panel: '#f8f0f3', accent: '#c23a6c', ink: '#3a2430', meta: '#e6cfd6', font: "'Shippori Mincho B1'" },
  { id: 'space', name: 'Deep Space', note: 'Ringed planet · shooting stars', bg: '#05030f', panel: '#151034', accent: '#c4a3ff', ink: '#ece8ff', meta: '#05030f', font: "'Exo 2'" },
  { id: 'anime', name: 'Anime Sky', note: 'Summer clouds · power lines', bg: '#8db6dc', panel: '#e9f0f7', accent: '#bf2c50', ink: '#1b2440', meta: '#5d93c6', font: "'M PLUS Rounded 1c'" },
  { id: 'lofi', name: 'Lofi Café', note: 'Twilight rain · lamp · steaming mug', bg: '#13121e', panel: '#252339', accent: '#f2a7c3', ink: '#ece8f6', meta: '#13121e', font: "'Nunito'" },
  { id: 'nighttrain', name: 'Night Train', note: 'Moonlit sea · passing train', bg: '#0d0b22', panel: '#1d1940', accent: '#c3b0ff', ink: '#eeeaff', meta: '#0d0b22', font: "'Zen Maru Gothic'" },
  { id: 'holo', name: 'Holo', note: 'Iridescent glow · frosted glass', bg: '#06060b', panel: '#161625', accent: '#7ff0ff', ink: '#eef0ff', meta: '#06060b', font: "'Syne'" },
  { id: 'lanterns', name: 'Lantern Festival', note: 'Rising lanterns · still water', bg: '#0e0a14', panel: '#211627', accent: '#ffae5c', ink: '#f6ebe0', meta: '#0e0a14', font: "'Alegreya'" },
];

// Themes from earlier builds that no longer exist.
const RENAMED = {
  minimal: 'anime', nord: 'space', matrix: 'system', gotham: 'system', tide: 'nighttrain', aurora: 'space', zen: 'sakura',
  shore: 'anime', forest: 'lanterns', marble: 'sakura',
  // Retired in the theme trim: each maps to the closest kept theme.
  noir: 'system', neon: 'holo', dunes: 'sakura', flight: 'space', pixel: 'nighttrain', starry: 'space', glowbay: 'nighttrain',
  groovy: 'lofi', snowfall: 'anime',
};

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
