import { getTimer, subscribe } from './timer';

/*
 * Focus sounds, ported from Stillpoint's offscreen.js. Everything is synthesized live with
 * WebAudio, so nothing is downloaded, nothing loops audibly, and it works offline.
 *
 * The AudioContext is created on the first user gesture (`unlock`), never on page load:
 * browsers keep a context made without a gesture suspended. The mixer lives at module level,
 * so sound keeps playing while you move to other pages.
 */

export const SOUNDS = [
  ['Noise', [
    ['white', 'White noise', 'Bright, masks chatter'],
    ['pink', 'Pink noise', 'Softer, balanced'],
    ['brown', 'Brown noise', 'Deep and warm, a favourite for ADHD'],
  ]],
  ['Nature', [
    ['rain', 'Rain'],
    ['stream', 'Mountain stream'],
    ['waves', 'Ocean waves'],
    ['birds', 'Forest birds'],
    ['fire', 'Fireplace'],
  ]],
  ['Music', [['piano', 'Ambient piano', 'Generated live, never repeats']]],
  ['Focus tone', [['gamma', '40 Hz binaural', 'Use headphones']]],
];

export const DEFAULT_MIX = { enabled: false, withTimer: true, levels: { brown: 0.35 } }; // = the Deep brown soundscape

// One-tap soundscapes: [id, name, levels]. Picking one replaces the whole mix.
export const SCAPES = [
  ['brown', 'Deep brown', { brown: 0.35 }],
  ['rain', 'Rain', { rain: 0.5, brown: 0.12 }],
  ['ocean', 'Ocean', { waves: 0.5, pink: 0.1 }],
  ['forest', 'Forest', { stream: 0.35, birds: 0.3 }],
  ['cozy', 'Cozy cabin', { fire: 0.45, rain: 0.25, piano: 0.2 }],
  ['piano', 'Soft piano', { piano: 0.45, pink: 0.08 }],
  ['deep', 'Deep focus', { brown: 0.25, gamma: 0.3 }],
];

/** The soundscape a mix matches, or null for a custom mix. */
export const scapeOf = (levels) => {
  const on = Object.entries(levels).filter(([, v]) => v > 0);
  return SCAPES.find(([, , l]) => on.length === Object.keys(l).length
    && on.every(([id, v]) => Math.abs((l[id] || 0) - v) < 0.01))?.[0] || null;
};

let ac = null;
let master;
let revIn;
const layers = {};
let mix = DEFAULT_MIX;
const rnd = (a, b) => a + Math.random() * (b - a);

export const audioReady = () => !!ac;

/** Create (or wake) the AudioContext. Call only from a click or key press. */
export function unlock() {
  if (!ac) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    ac = new Ctx();
    master = ac.createGain();
    master.gain.value = 0;
    // A gentle limiter so stacking several layers never clips.
    const lim = ac.createDynamicsCompressor();
    lim.threshold.value = -10; lim.ratio.value = 12; lim.attack.value = 0.003; lim.release.value = 0.25;
    master.connect(lim).connect(ac.destination);
    const conv = ac.createConvolver();
    conv.buffer = impulse(3.2, 2.6);
    revIn = ac.createGain();
    revIn.connect(conv);
    conv.connect(master);
  }
  if (ac.state === 'suspended') ac.resume();
  apply();
  return true;
}

function impulse(sec, decay) {
  const len = ac.sampleRate * sec;
  const b = ac.createBuffer(2, len, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = b.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}

// Seamlessly looping noise buffers: the tail is cross-faded into the head.
function noise(kind, sec = 12) {
  const sr = ac.sampleRate;
  const len = sr * sec;
  const fade = Math.floor(sr * 0.6);
  const b = ac.createBuffer(2, len - fade, sr);
  for (let c = 0; c < 2; c++) {
    const raw = new Float32Array(len);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0, peak = 0;
    for (let i = 0; i < len; i++) {
      const wht = Math.random() * 2 - 1;
      let v;
      if (kind === 'white') v = wht;
      else if (kind === 'pink') {
        // Paul Kellet's pink noise filter
        b0 = 0.99886 * b0 + wht * 0.0555179; b1 = 0.99332 * b1 + wht * 0.0750759; b2 = 0.969 * b2 + wht * 0.153852;
        b3 = 0.8665 * b3 + wht * 0.3104856; b4 = 0.55 * b4 + wht * 0.5329522; b5 = -0.7616 * b5 - wht * 0.016898;
        v = b0 + b1 + b2 + b3 + b4 + b5 + b6 + wht * 0.5362;
        b6 = wht * 0.115926;
      } else {
        last = (last + 0.02 * wht) / 1.02; // brown: integrated white noise
        v = last;
      }
      raw[i] = v;
      peak = Math.max(peak, Math.abs(v));
    }
    const d = b.getChannelData(c);
    const n = len - fade;
    for (let i = 0; i < n; i++) {
      let v = raw[i];
      if (i < fade) { const k = i / fade; v = raw[i] * k + raw[n + i] * (1 - k); }
      d[i] = (v / peak) * 0.9;
    }
  }
  return b;
}
const bufCache = {};
const buf = (k) => bufCache[k] || (bufCache[k] = noise(k));
function loopSrc(kind) {
  const s = ac.createBufferSource();
  s.buffer = buf(kind);
  s.loop = true;
  s.start(ac.currentTime + rnd(0, 0.05), rnd(0, 10));
  return s;
}
function gainOf(v, to) {
  const g = ac.createGain();
  g.gain.value = v;
  g.connect(to);
  return g;
}
function lfo(f, depth, target) {
  const o = ac.createOscillator();
  const d = ac.createGain();
  o.frequency.value = f;
  d.gain.value = depth;
  o.connect(d).connect(target);
  o.start();
}

// A 12 ms click of decaying noise: one raindrop or one crackle.
let dropBuf = null;
function burst(out, { rate = 1, gain = 0.3, pan = 0, at = ac.currentTime }) {
  if (!dropBuf) {
    const n = Math.floor(ac.sampleRate * 0.012);
    dropBuf = ac.createBuffer(1, n, ac.sampleRate);
    const d = dropBuf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (n / 5));
  }
  const s = ac.createBufferSource();
  const g = ac.createGain();
  const p = ac.createStereoPanner();
  s.buffer = dropBuf; s.playbackRate.value = rate; g.gain.value = gain; p.pan.value = pan;
  s.connect(g).connect(p).connect(out);
  s.start(at);
}

// A short preview plays even when sound is set to "only while a session runs", so you can hear
// what you're picking before you press Start.
let previewUntil = 0;
let previewTimer = 0;
const isOn = () => mix.enabled && (!mix.withTimer || getTimer().status === 'running' || Date.now() < previewUntil);

/** Play the current mix for a few seconds, whatever the timer is doing. Call from a click. */
export function preview(ms = 6000) {
  previewUntil = Date.now() + ms;
  clearTimeout(previewTimer);
  previewTimer = setTimeout(apply, ms + 50);
  apply();
}
export const previewing = () => Date.now() < previewUntil;

// Scheduler for event-based layers: it only does work while the layer is audible.
function every(layer, fn, minMs, maxMs) {
  const go = () => {
    if (isOn() && (mix.levels[layer.id] || 0) > 0) fn();
    layer.timer = setTimeout(go, rnd(minMs, maxMs));
  };
  layer.timer = setTimeout(go, rnd(minMs, maxMs));
}

const MAKERS = {
  white(out) { loopSrc('white').connect(gainOf(0.22, out)); },
  pink(out) { loopSrc('pink').connect(gainOf(0.45, out)); },
  brown(out) { loopSrc('brown').connect(gainOf(0.9, out)); },
  rain(out, L) {
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 450;
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7500;
    loopSrc('pink').connect(hp).connect(lp).connect(gainOf(0.55, out));
    const patter = ac.createBiquadFilter(); patter.type = 'bandpass'; patter.frequency.value = 3200; patter.Q.value = 0.7;
    patter.connect(gainOf(0.5, out));
    every(L, () => {
      const t = ac.currentTime;
      for (let i = 0; i < 6; i++) burst(patter, { rate: rnd(0.5, 1.6), gain: rnd(0.05, 0.25), pan: rnd(-0.9, 0.9), at: t + rnd(0, 0.1) });
    }, 60, 110);
  },
  stream(out) {
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 0.6;
    const g = ac.createGain(); g.gain.value = 0.6;
    loopSrc('pink').connect(bp).connect(g).connect(gainOf(0.9, out));
    lfo(3.1, 0.12, g.gain); lfo(5.7, 0.08, g.gain); lfo(0.37, 500, bp.frequency); lfo(1.3, 250, bp.frequency);
  },
  waves(out) {
    // Brown noise through a low-pass whose level and cutoff swell on a ~14 s cycle.
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = 0.4;
    const g = ac.createGain(); g.gain.value = 0.5;
    loopSrc('brown').connect(lp).connect(g).connect(gainOf(1, out));
    lfo(0.071, 0.42, g.gain); lfo(0.071, 480, lp.frequency); lfo(0.043, 0.12, g.gain);
  },
  birds(out, L) {
    const send = gainOf(0.55, revIn);
    const dry = gainOf(0.6, out);
    every(L, () => {
      const t0 = ac.currentTime + 0.05, n = Math.floor(rnd(2, 7)), f0 = rnd(2300, 4600), pan = rnd(-0.8, 0.8), gap = rnd(0.07, 0.16), up = Math.random() < 0.5;
      for (let i = 0; i < n; i++) {
        const t = t0 + i * gap, d = rnd(0.05, 0.12), f = f0 * rnd(0.9, 1.1);
        const o = ac.createOscillator(), g = ac.createGain(), p = ac.createStereoPanner();
        o.frequency.setValueAtTime(up ? f : f * 1.3, t);
        o.frequency.exponentialRampToValueAtTime(up ? f * 1.35 : f * 0.75, t + d);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(rnd(0.05, 0.12), t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        p.pan.value = pan;
        o.connect(g).connect(p); p.connect(dry); p.connect(send);
        o.start(t); o.stop(t + d + 0.02);
      }
    }, 1500, 6500);
  },
  fire(out, L) {
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
    loopSrc('brown').connect(lp).connect(gainOf(0.7, out));
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1400;
    hp.connect(gainOf(0.9, out));
    every(L, () => {
      const t = ac.currentTime, n = Math.random() < 0.15 ? 5 : 1;
      for (let i = 0; i < n; i++) burst(hp, { rate: rnd(0.25, 1.1), gain: Math.random() < 0.08 ? rnd(0.5, 0.8) : rnd(0.04, 0.22), pan: rnd(-0.5, 0.5), at: t + i * rnd(0.01, 0.04) });
    }, 30, 260);
  },
  piano(out, L) {
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const bus = ac.createGain(); bus.gain.value = 0.5;
    bus.connect(lp); lp.connect(out); lp.connect(gainOf(0.7, revIn));
    const prog = [[57, 60, 64, 67, 71], [53, 57, 60, 64, 69], [48, 55, 60, 62, 64, 67], [55, 59, 62, 64, 67, 69]];
    let ci = 0;
    let count = 0;
    // A soft additive piano voice: a few partials with their own decays.
    const note = (midi, at, vel) => {
      const f = 440 * Math.pow(2, (midi - 69) / 12);
      [[1, 1, 3.2], [2, 0.35, 1.6], [3, 0.12, 0.9], [4.01, 0.05, 0.5]].forEach(([m, a, dec]) => {
        const o = ac.createOscillator(), g = ac.createGain();
        o.frequency.value = f * m; o.detune.value = rnd(-4, 4);
        g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(a * vel, at + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dec * (midi < 50 ? 1.8 : 1.2));
        o.connect(g).connect(bus); o.start(at); o.stop(at + 6);
      });
    };
    every(L, () => {
      const t = ac.currentTime + 0.05, ch = prog[ci];
      if (count % 6 === 0) note(ch[0] - 12, t, 0.22);
      const pick = () => ch[Math.floor(Math.random() * ch.length)] + (Math.random() < 0.6 ? 12 : 0);
      note(pick(), t, rnd(0.1, 0.18));
      if (Math.random() < 0.3) note(pick(), t + rnd(0.08, 0.3), rnd(0.06, 0.12));
      if (++count % 8 === 0) ci = (ci + 1) % prog.length;
    }, 1100, 3200);
  },
  gamma(out) {
    // 200 Hz left, 240 Hz right: the brain hears a 40 Hz beat (headphones only).
    [[200, -1], [240, 1]].forEach(([f, pan]) => {
      const o = ac.createOscillator(), p = ac.createStereoPanner();
      o.frequency.value = f; p.pan.value = pan;
      o.connect(p).connect(gainOf(0.12, out));
      o.start();
    });
  },
};

function ensureLayer(id) {
  if (layers[id] || !MAKERS[id]) return layers[id];
  const out = ac.createGain();
  out.gain.value = 0;
  out.connect(master);
  const L = { id, out };
  MAKERS[id](out, L);
  return (layers[id] = L);
}

// Push the current mix to the audio graph: layers fade to their level, the master fades in or out.
function apply() {
  if (!ac) return;
  const t = ac.currentTime;
  const ids = new Set([...Object.keys(mix.levels), ...Object.keys(layers)]);
  for (const id of ids) {
    const v = mix.levels[id] || 0;
    if (v > 0) ensureLayer(id);
    layers[id]?.out.gain.setTargetAtTime(Math.pow(v, 1.5) * 1.3, t, 0.25);
  }
  const on = isOn();
  master.gain.setTargetAtTime(on ? 1 : 0, t, on ? 0.8 : 0.4);
}

/** Update the mix ({ enabled, withTimer, levels }). Silent until `unlock` has run once. */
export function setMix(next) {
  mix = next;
  apply();
}

// Start, pause and the end of a session fade the sound in and out (for "only while a session runs").
subscribe(apply);

/** Soft sine chime (Stillpoint's end bell). Needs `unlock` to have run at some point. */
export function chime(freqs = [880], gap = 0.18, vol = 0.18) {
  if (!ac) return;
  if (ac.state === 'suspended') ac.resume();
  const t0 = ac.currentTime + 0.05;
  freqs.forEach((fq, i) => {
    const o = ac.createOscillator(), g = ac.createGain(), t = t0 + i * gap;
    o.type = 'sine';
    o.frequency.value = fq;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    o.connect(g).connect(ac.destination);
    o.start(t); o.stop(t + 1.9);
  });
}

export const endChime = () => chime([660, 880, 1046], 0.32, 0.2);
export const halfChime = () => chime([880], 0, 0.08);
