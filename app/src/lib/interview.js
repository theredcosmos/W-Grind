import manual from '../data/manual.json';

// Phases come from the Codex: "How to solve a question in a live 45-min interview".
export const PHASES = (() => {
  const rows = manual.antiBlank.rows.filter((r) => r[0].startsWith('3.'));
  const phases = rows.map((r) => {
    const m = r[1].match(/Min\s*(\d+)\s*[–-]\s*(\d+)\s*:?\s*(.*)/);
    return m ? { from: +m[1], to: +m[2], title: m[3], say: r[3] } : null;
  }).filter(Boolean);
  phases.push({ from: 40, to: 45, title: 'Edge cases & wrap-up', say: 'Walk through empty input, one element, duplicates and the largest N. Then state time and space complexity.' });
  return phases;
})();

/** Index of the phase you should be in after `seconds` (the last one once time is up). */
export const phaseAt = (seconds) => {
  const minute = seconds / 60;
  if (minute >= 45) return PHASES.length - 1;
  return Math.max(0, PHASES.findIndex((p) => minute >= p.from && minute < p.to));
};
