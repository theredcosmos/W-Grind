import { useCallback, useState } from 'react';

// Colours here only drive the picker previews; the real values live in index.css.
export const THEMES = [
  { id: 'system', name: 'Abyssal Gate', note: 'Gate portal · mana motes', bg: '#04060c', panel: '#0e172d', accent: '#4cc2ff', ink: '#e6edf8', meta: '#04060c', font: "'Chakra Petch'" },
  { id: 'noir', name: 'Noir City', note: 'Skyline · searchlight · grain', bg: '#07080a', panel: '#18191d', accent: '#ffd60a', ink: '#e8e6e3', meta: '#07080a', font: "'Bebas Neue'" },
  { id: 'sakura', name: 'Sakura', note: 'Blossoms · drifting petals', bg: '#e6cfd6', panel: '#f8f0f3', accent: '#c23a6c', ink: '#3a2430', meta: '#e6cfd6', font: "'Shippori Mincho B1'" },
  { id: 'space', name: 'Deep Space', note: 'Ringed planet · shooting stars', bg: '#05030f', panel: '#151034', accent: '#c4a3ff', ink: '#ece8ff', meta: '#05030f', font: "'Exo 2'" },
  { id: 'anime', name: 'Anime Sky', note: 'Summer clouds · power lines', bg: '#8db6dc', panel: '#e9f0f7', accent: '#bf2c50', ink: '#1b2440', meta: '#5d93c6', font: "'M PLUS Rounded 1c'" },
  { id: 'lofi', name: 'Lofi Café', note: 'Rainy window · lamp · steaming mug', bg: '#15100d', panel: '#271e18', accent: '#ffb37a', ink: '#f2e6da', meta: '#15100d', font: "'Nunito'" },
  { id: 'neon', name: 'Neon Grid', note: 'Synthwave sun · scrolling grid', bg: '#0a0614', panel: '#1a1033', accent: '#ff5cd0', ink: '#ece9ff', meta: '#0a0614', font: "'Oxanium'" },
  { id: 'dunes', name: 'Desert Dunes', note: 'Sand dunes · caravan · drifting sand', bg: '#e2d0b2', panel: '#f2e8d6', accent: '#9a3b17', ink: '#2b1f14', meta: '#e2d0b2', font: "'Marcellus'" },
  { id: 'flight', name: 'Flight Deck', note: 'Dusk HUD · cloud deck below', bg: '#070d1a', panel: '#121e34', accent: '#6ae3a4', ink: '#e4ecf7', meta: '#070d1a', font: "'Rajdhani'" },
  { id: 'nighttrain', name: 'Night Train', note: 'Moonlit sea · passing train', bg: '#0d0b22', panel: '#1d1940', accent: '#c3b0ff', ink: '#eeeaff', meta: '#0d0b22', font: "'Zen Maru Gothic'" },
  { id: 'holo', name: 'Holo', note: 'Iridescent glow · frosted glass', bg: '#06060b', panel: '#161625', accent: '#7ff0ff', ink: '#eef0ff', meta: '#06060b', font: "'Syne'" },
  { id: 'pixel', name: 'Pixel Quest', note: '8-bit castle · blocky clouds', bg: '#120f2a', panel: '#231e48', accent: '#7ae582', ink: '#f1eeff', meta: '#120f2a', font: "'Silkscreen'" },
  { id: 'starry', name: 'Starry Night', note: 'Milky Way · constellations · shooting stars', bg: '#04060f', panel: '#111833', accent: '#f2cf7a', ink: '#e9edfb', meta: '#04060f', font: "'Cinzel'" },
  { id: 'glowbay', name: 'Glow Bay', note: 'Glowing surf · crescent moon', bg: '#020b14', panel: '#0a2131', accent: '#4ff0e0', ink: '#e2f6f8', meta: '#020b14', font: "'Lexend'" },
  { id: 'lanterns', name: 'Lantern Festival', note: 'Rising lanterns · still water', bg: '#0e0a14', panel: '#211627', accent: '#ffae5c', ink: '#f6ebe0', meta: '#0e0a14', font: "'Alegreya'" },
  { id: 'groovy', name: 'Groovy', note: '70s sunburst · wavy stripes · daisies', bg: '#f1dfb8', panel: '#fbf1dc', accent: '#a8400f', ink: '#2e1a0e', meta: '#f1dfb8', font: "'Shrikhand'" },
  { id: 'snowfall', name: 'Snowfall', note: 'Snowy peaks · lit cabin · falling snow', bg: '#d3dde6', panel: '#eaf0f4', accent: '#1f4f8a', ink: '#182638', meta: '#b9c8d8', font: "'Quicksand'" },
];

// Themes from earlier builds that no longer exist.
const RENAMED = {
  minimal: 'snowfall', nord: 'starry', matrix: 'system', gotham: 'noir',
  tide: 'glowbay', aurora: 'starry', zen: 'snowfall', shore: 'snowfall', forest: 'lanterns',
  marble: 'groovy',
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
