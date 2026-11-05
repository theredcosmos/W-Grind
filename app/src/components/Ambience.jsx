import { memo, useMemo } from 'react';

/*
 * Background scenery for each theme. All art is original inline SVG (no image files,
 * nothing to license). Motion is transform/opacity only and stops when the user turns
 * ambient motion off in Settings (html[data-still]).
 */

// Small deterministic RNG so the scenery is identical on every load.
const rng = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

// Particles that drift up (motes, bubbles) or down (petals).
const Drifters = ({ count, seed, className, size: [min, max], dur: [dMin, dMax] }) => {
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({
      left: `${(r() * 100).toFixed(1)}%`,
      size: min + r() * (max - min),
      dur: dMin + r() * (dMax - dMin),
      delay: -r() * dMax,
      drift: `${((r() - 0.5) * 30).toFixed(1)}vw`,
    }));
  }, [count, seed, min, max, dMin, dMax]);
  return items.map((p, i) => (
    <span
      key={i}
      className={className}
      style={{ left: p.left, width: p.size, height: p.size, '--d': `${p.dur}s`, '--delay': `${p.delay}s`, '--drift': p.drift }}
    />
  ));
};

// Particles that stay in place and pulse (twinkling stars, sparkles).
const Scatter = ({ count, seed, className, size: [min, max], top = 100 }) => {
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({
      left: `${(r() * 100).toFixed(1)}%`,
      top: `${(r() * top).toFixed(1)}%`,
      size: min + r() * (max - min),
      dur: 3 + r() * 4,
      delay: -r() * 7,
    }));
  }, [count, seed, min, max, top]);
  return items.map((p, i) => (
    <span
      key={i}
      className={className}
      style={{ left: p.left, top: p.top, width: p.size, height: p.size, '--d': `${p.dur}s`, '--delay': `${p.delay}s` }}
    />
  ));
};

// ---------------------------------------------------------------- Abyssal Gate
function Monarch() {
  return (
    <>
      <svg className="amb-portal" viewBox="-300 -300 600 600" aria-hidden="true">
        <defs>
          <radialGradient id="portal-core">
            <stop offset="0" stopColor="#4cc2ff" stopOpacity="0.32" />
            <stop offset="0.45" stopColor="#1d7cf2" stopOpacity="0.12" />
            <stop offset="1" stopColor="#1d7cf2" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle r="290" fill="url(#portal-core)" />
        <circle r="250" fill="none" stroke="#4cc2ff" strokeOpacity="0.09" />
        <circle r="212" fill="none" stroke="#4cc2ff" strokeOpacity="0.22" strokeDasharray="1 9" strokeWidth="2" />
        <circle r="170" fill="none" stroke="#8b5cf6" strokeOpacity="0.16" strokeWidth="1.5" strokeDasharray="40 14" />
        <circle r="128" fill="none" stroke="#4cc2ff" strokeOpacity="0.2" />
        <circle r="84" fill="none" stroke="#4cc2ff" strokeOpacity="0.12" strokeWidth="6" />
      </svg>
      <svg className="amb-portal amb-spin" viewBox="-300 -300 600 600" aria-hidden="true">
        <path d="M-212 0 A212 212 0 0 1 0 -212" fill="none" stroke="#7dd6ff" strokeOpacity="0.45" strokeWidth="2" />
      </svg>
      <Drifters count={6} seed={7} className="amb-mote" size={[3, 5]} dur={[20, 34]} />
    </>
  );
}

// ---------------------------------------------------------------- Noir City
const RAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cg stroke='%23c8d2e6' stroke-opacity='.18' stroke-width='1'%3E%3Cpath d='M12 4l-4 22M58 40l-4 22M104 10l-4 22M150 52l-4 22M30 90l-4 22M80 112l-4 22M130 96l-4 22M44 140l-4 18'/%3E%3C/g%3E%3C/svg%3E\")";

// A background image is rasterised once, so the sway is a pure GPU rotation instead of a per-frame SVG repaint.
const BEAM = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cdefs%3E%3ClinearGradient id='b' x1='0' y1='1' x2='0' y2='0'%3E%3Cstop offset='0' stop-color='%23fff3b0' stop-opacity='0'/%3E%3Cstop offset='.35' stop-color='%23fff3b0' stop-opacity='.07'/%3E%3Cstop offset='1' stop-color='%23fff3b0' stop-opacity='.015'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpolygon points='49.2,100 50.8,100 64,0 36,0' fill='url(%23b)'/%3E%3C/svg%3E\")";

function Skyline() {
  const { back, front, windows } = useMemo(() => {
    const r = rng(42);
    const build = (minH, maxH) => {
      const out = [];
      for (let x = -20; x < 1620;) {
        const w = 38 + r() * 80;
        const h = minH + r() * (maxH - minH);
        out.push({ x, w, h, spire: r() < 0.14, antenna: r() < 0.2 });
        x += w + r() * 6;
      }
      return out;
    };
    const backRow = build(120, 300);
    const frontRow = build(50, 190);
    const lit = [];
    for (const b of frontRow) {
      for (let wy = 360 - b.h + 14; wy < 350; wy += 14) {
        for (let wx = b.x + 8; wx < b.x + b.w - 10; wx += 12) {
          if (r() < 0.09) lit.push({ x: wx, y: wy });
        }
      }
    }
    return { back: backRow, front: frontRow, windows: lit };
  }, []);
  const shape = (b) => (
    <g key={b.x}>
      <rect x={b.x} y={360 - b.h} width={b.w} height={b.h} />
      {b.spire && <path d={`M${b.x + b.w * 0.3} ${360 - b.h} L${b.x + b.w / 2} ${360 - b.h - 40} L${b.x + b.w * 0.7} ${360 - b.h} Z`} />}
      {b.antenna && <rect x={b.x + b.w / 2 - 1} y={360 - b.h - 26} width="2" height="26" />}
    </g>
  );
  return (
    <svg className="amb-skyline" viewBox="0 0 1600 360" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g fill="#14161b">{back.map(shape)}</g>
      <g fill="#0a0b0e">{front.map(shape)}</g>
      <g fill="#ffd60a" fillOpacity="0.32">
        {windows.map((w, i) => <rect key={i} x={w.x} y={w.y} width="4" height="6" />)}
      </g>
    </svg>
  );
}

function Noir() {
  return (
    <>
      <div className="amb-beam" style={{ backgroundImage: BEAM }} aria-hidden="true" />
      <div className="amb-cloudglow" aria-hidden="true" />
      <Skyline />
      <div className="amb-rain" style={{ backgroundImage: RAIN }} aria-hidden="true" />
    </>
  );
}

// ---------------------------------------------------------------- Sakura
const Blossom = ({ x, y, s, rot }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    {[0, 72, 144, 216, 288].map((a) => (
      <path key={a} transform={`rotate(${a})`} d="M0 0 C -9 -6 -10 -18 -4 -22 L0 -18 L4 -22 C 10 -18 9 -6 0 0 Z" fill="url(#petal)" />
    ))}
    <circle r="3.2" fill="#e0607e" />
    {[20, 92, 164, 236, 308].map((a) => (
      <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 6} cy={Math.sin((a * Math.PI) / 180) * 6} r="1.1" fill="#b8325a" />
    ))}
  </g>
);

function SakuraBranch() {
  const blossoms = [
    [452, 92, 1.1, 10], [418, 72, 0.8, 40], [384, 128, 1, -20], [330, 150, 0.9, 15], [300, 128, 0.7, 60],
    [262, 186, 1.05, -10], [226, 168, 0.8, 30], [198, 214, 0.95, 5], [168, 236, 0.75, -35], [520, 60, 0.85, 25],
    [560, 44, 1, -15], [486, 128, 0.7, 45], [404, 34, 0.9, 0], [338, 206, 0.8, 20], [600, 70, 0.7, 50],
  ];
  return (
    <svg className="amb-branch" viewBox="0 0 640 420" aria-hidden="true">
      <defs>
        <radialGradient id="petal" cx="0.5" cy="0.15" r="0.9">
          <stop offset="0" stopColor="#fff5f8" />
          <stop offset="0.55" stopColor="#ffc6d6" />
          <stop offset="1" stopColor="#f39ab8" />
        </radialGradient>
      </defs>
      <g fill="none" stroke="#5d3b33" strokeLinecap="round">
        <path d="M660 24 C 580 34 520 60 460 96" strokeWidth="13" />
        <path d="M460 96 C 400 130 340 150 290 178" strokeWidth="9" />
        <path d="M290 178 C 240 204 200 222 150 246" strokeWidth="5" />
        <path d="M478 84 C 456 58 436 44 400 32" strokeWidth="4" />
        <path d="M360 142 C 348 176 330 196 304 210" strokeWidth="3.5" />
        <path d="M262 190 C 240 166 218 158 186 160" strokeWidth="3" />
        <path d="M540 52 C 560 40 580 38 606 48" strokeWidth="3" />
      </g>
      {blossoms.map(([x, y, s, rot]) => <Blossom key={`${x}-${y}`} x={x} y={y} s={s} rot={rot} />)}
      <g fill="#f7a8c0">
        <circle cx="430" cy="110" r="3.5" /><circle cx="372" cy="98" r="3" /><circle cx="248" cy="204" r="3" /><circle cx="520" cy="94" r="3" />
      </g>
    </svg>
  );
}

function Sakura() {
  return (
    <>
      <SakuraBranch />
      <Drifters count={8} seed={11} className="amb-petal" size={[10, 15]} dur={[16, 26]} />
    </>
  );
}

// ---------------------------------------------------------------- Shared helpers
const wavePath = (amp, length, base) => {
  // Two full screen-widths of a smooth sine so a -50% translate loops seamlessly.
  let d = `M0 ${base}`;
  for (let x = 0; x < 2880; x += length) {
    d += ` Q ${x + length / 4} ${base - amp} ${x + length / 2} ${base} T ${x + length} ${base}`;
  }
  return `${d} V 200 H 0 Z`;
};

function Stars({ seed = 99, count = 110, className = 'amb-stars' }) {
  const stars = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({ x: r() * 100, y: r() * 62, s: 0.06 + r() * 0.16, o: 0.25 + r() * 0.6 }));
  }, [seed, count]);
  return (
    <svg className={className} viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {stars.map((st, i) => (
        <circle key={i} cx={st.x} cy={st.y} r={st.s} fill="#fff" opacity={st.o} />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------- Deep Space
function Planet() {
  return (
    <svg className="amb-planet" viewBox="-200 -200 400 400" aria-hidden="true">
      <defs>
        <radialGradient id="planet-body" cx="0.34" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#f7c98f" />
          <stop offset="0.45" stopColor="#c8644a" />
          <stop offset="1" stopColor="#2a0f2e" />
        </radialGradient>
        <radialGradient id="planet-haze">
          <stop offset="0.78" stopColor="#ff9ec7" stopOpacity="0.22" />
          <stop offset="1" stopColor="#ff9ec7" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle r="128" fill="url(#planet-haze)" />
      <g transform="rotate(-18)">
        <ellipse rx="176" ry="38" fill="none" stroke="#e9c9a0" strokeOpacity="0.28" strokeWidth="12" />
        <circle r="100" fill="url(#planet-body)" />
        <path d="M-100 8 C -60 18 60 18 100 8" fill="none" stroke="#2a0f2e" strokeOpacity="0.25" strokeWidth="8" />
        <path d="M-176 0 A176 38 0 0 0 176 0" fill="none" stroke="#f3dcb8" strokeOpacity="0.55" strokeWidth="12" />
      </g>
      <circle cx="150" cy="-130" r="14" fill="#b8b2d8" />
      <circle cx="146" cy="-134" r="14" fill="#05030f" fillOpacity="0.45" />
    </svg>
  );
}

function Space() {
  return (
    <>
      <div className="amb-nebula" aria-hidden="true" />
      <Stars seed={5} count={170} className="amb-stars amb-stars-full" />
      <Scatter count={12} seed={21} className="amb-twinkle" size={[2, 4]} />
      <Planet />
      <span className="amb-comet amb-comet-1" aria-hidden="true" />
      <span className="amb-comet amb-comet-2" aria-hidden="true" />
    </>
  );
}

// ---------------------------------------------------------------- Anime Sky
const Cloud = ({ style }) => (
  <svg className="amb-cloud" viewBox="0 0 320 140" style={style} aria-hidden="true">
    <path d="M30 118 C 4 118 0 86 26 80 C 22 52 58 40 78 58 C 86 22 140 10 160 44 C 176 18 230 22 232 62 C 262 50 300 70 290 100 C 312 104 312 120 294 120 Z" fill="#eef3f9" />
    <path d="M30 118 C 70 108 250 108 294 120 Z" fill="#b6cbe2" fillOpacity="0.8" />
  </svg>
);

function PowerLines() {
  const pole = (x, h, s) => (
    <g key={x} fill="#26314f">
      <rect x={x - 5 * s} y={400 - h} width={10 * s} height={h} />
      <rect x={x - 46 * s} y={400 - h + 22 * s} width={92 * s} height={6 * s} />
      <rect x={x - 34 * s} y={400 - h + 50 * s} width={68 * s} height={5 * s} />
    </g>
  );
  const wire = (x1, y1, x2, y2, sag) => `M${x1} ${y1} Q ${(x1 + x2) / 2} ${Math.max(y1, y2) + sag} ${x2} ${y2}`;
  return (
    <svg className="amb-powerlines" viewBox="0 0 1600 400" preserveAspectRatio="xMinYMax slice" aria-hidden="true">
      <path d="M0 400 L0 330 C 220 300 420 318 640 306 C 900 292 1160 318 1600 300 L1600 400 Z" fill="#9fc0e4" fillOpacity="0.55" />
      {pole(170, 330, 1)}
      {pole(1240, 200, 0.62)}
      <g fill="none" stroke="#26314f" strokeWidth="1.6">
        {[-40, -14, 14, 40].map((dx) => <path key={dx} d={wire(170 + dx, 92, 1240 + dx * 0.62, 213, 70)} />)}
        {[-40, 40].map((dx) => <path key={dx} d={wire(-60, 60, 170 + dx, 92, 40)} />)}
        {[-26, 26].map((dx) => <path key={dx} d={wire(1240 + dx * 0.62, 213, 1700, 190, 30)} />)}
      </g>
    </svg>
  );
}

function Anime() {
  return (
    <>
      <div className="amb-sun" aria-hidden="true" />
      <Cloud style={{ top: '6vh', width: 'min(420px, 48vw)', '--d': '150s', '--delay': '-40s' }} />
      <Cloud style={{ top: '22vh', width: 'min(300px, 36vw)', '--d': '190s', '--delay': '-120s', opacity: 0.85 }} />
      <Cloud style={{ top: '38vh', width: 'min(220px, 28vw)', '--d': '240s', '--delay': '-70s', opacity: 0.7 }} />
      <PowerLines />
      <Scatter count={9} seed={31} className="amb-sparkle" size={[8, 14]} top={70} />
    </>
  );
}

// ---------------------------------------------------------------- Lofi Café
// Thin rain streaks, clipped to the window glass.
function RainStreaks({ count, seed }) {
  const items = useMemo(() => {
    const r = rng(seed);
    return Array.from({ length: count }, () => ({
      left: `${(r() * 100).toFixed(1)}%`,
      h: 14 + r() * 26,
      dur: 1.1 + r() * 0.9,
      delay: -r() * 2,
      o: 0.25 + r() * 0.4,
    }));
  }, [count, seed]);
  return items.map((p, i) => (
    <span
      key={i}
      className="amb-streak"
      style={{ left: p.left, height: p.h, opacity: p.o, '--d': `${p.dur}s`, '--delay': `${p.delay}s` }}
    />
  ));
}

function LofiWindow() {
  const { lights, drops } = useMemo(() => {
    const r = rng(57);
    const tints = ['#ffcf8a', '#ff9f6b', '#9fb8ff', '#ffb37a'];
    return {
      lights: Array.from({ length: 16 }, () => ({
        x: 40 + r() * 320, y: 330 + r() * 100, r: 3 + r() * 7, c: tints[Math.floor(r() * tints.length)], o: 0.12 + r() * 0.28,
      })),
      drops: Array.from({ length: 22 }, () => ({ x: 30 + r() * 340, y: 30 + r() * 400, r: 0.8 + r() * 1.8 })),
    };
  }, []);
  return (
    <div className="amb-lofi-window" aria-hidden="true">
      <svg viewBox="0 0 400 480">
        <defs>
          <linearGradient id="lofi-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#141a33" />
            <stop offset="0.62" stopColor="#2b2442" />
            <stop offset="1" stopColor="#4a3046" />
          </linearGradient>
          <radialGradient id="lofi-moon">
            <stop offset="0" stopColor="#fff1d6" stopOpacity="0.45" />
            <stop offset="1" stopColor="#fff1d6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect x="24" y="24" width="352" height="416" fill="url(#lofi-sky)" />
        <circle cx="290" cy="104" r="62" fill="url(#lofi-moon)" />
        <circle cx="290" cy="104" r="15" fill="#f6e6c8" fillOpacity="0.5" />
        <path d="M24 440 V362 h40 v-30 h30 v48 h36 v-72 h44 v60 h30 v-42 h50 v56 h40 v-84 h36 v68 h46 V440 Z" fill="#1a1528" />
        {lights.map((l, i) => <circle key={i} cx={l.x} cy={l.y} r={l.r} fill={l.c} fillOpacity={l.o} />)}
        <g fill="#cfd8ff" fillOpacity="0.22">
          {drops.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={d.r} />)}
        </g>
        <path fillRule="evenodd" d="M0 0 H400 V480 H0 Z M24 24 V440 H376 V24 Z" fill="#2a1e17" />
        <rect x="194" y="24" width="12" height="416" fill="#2a1e17" />
        <rect x="24" y="226" width="352" height="12" fill="#2a1e17" />
        <path d="M24 24 H376 M24 24 V440" stroke="#ffb37a" strokeOpacity="0.14" strokeWidth="2" fill="none" />
        <rect x="0" y="452" width="400" height="28" fill="#3a2a1f" />
        <rect x="0" y="452" width="400" height="2" fill="#ffc890" fillOpacity="0.18" />
      </svg>
      <div className="amb-lofi-glass">
        <RainStreaks count={18} seed={58} />
      </div>
    </div>
  );
}

function LofiDesk() {
  // Mug rim centre sits at x=354 of the 560-wide drawing; the steam starts there.
  const steam = [0, -2, -4];
  return (
    <>
      <div className="amb-lofi-desk" aria-hidden="true" />
      <div className="amb-lofi-props" aria-hidden="true">
        <div className="amb-lamp-glow" />
        <svg viewBox="0 0 560 280">
          <defs>
            <linearGradient id="lofi-cone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffcf8a" stopOpacity="0.2" />
              <stop offset="1" stopColor="#ffcf8a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M232 168 L292 150 L390 280 L150 280 Z" fill="url(#lofi-cone)" />
          {/* lamp */}
          <ellipse cx="96" cy="274" rx="44" ry="7" fill="#3b2a20" />
          <path d="M96 270 L136 160 L222 102" stroke="#3b2a20" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="136" cy="160" r="7" fill="#4a3426" />
          <path d="M204 90 L250 70 L292 150 L232 168 Z" fill="#4a3426" />
          <ellipse cx="262" cy="159" rx="31" ry="7" transform="rotate(-17 262 159)" fill="#ffd9a0" fillOpacity="0.85" />
          {/* mug */}
          <path d="M378 232 a14 14 0 0 1 0 28" stroke="#b86a50" strokeWidth="6" fill="none" />
          <path d="M330 216 h48 v52 a10 10 0 0 1 -10 10 h-28 a10 10 0 0 1 -10 -10 Z" fill="#b86a50" />
          <ellipse cx="354" cy="216" rx="24" ry="4" fill="#3b2116" />
          <rect x="336" y="226" width="4" height="40" rx="2" fill="#ffd9a0" fillOpacity="0.25" />
          {/* books and a plant */}
          <rect x="410" y="254" width="122" height="26" rx="2" fill="#4a2f3b" />
          <rect x="420" y="232" width="104" height="22" rx="2" fill="#33405a" />
          <rect x="414" y="212" width="112" height="20" rx="2" fill="#6a4c30" />
          <path d="M410 262 h122 M420 240 h104 M414 220 h112" stroke="#ffd9a0" strokeOpacity="0.12" strokeWidth="2" />
          <g fill="#3d5639">
            <path d="M478 180 C 468 140 440 130 424 124 C 452 124 476 140 478 180 Z" />
            <path d="M478 180 C 482 130 500 112 520 104 C 506 124 490 148 478 180 Z" />
            <path d="M478 180 C 470 150 474 110 482 90 C 488 116 486 150 478 180 Z" />
          </g>
          <g fill="#4f6b4a">
            <path d="M478 180 C 460 160 446 160 432 162 C 452 152 470 160 478 180 Z" />
            <path d="M478 180 C 492 156 512 150 530 152 C 510 160 494 166 478 180 Z" />
          </g>
          <path d="M450 178 h56 l-8 34 h-40 Z" fill="#9a5a42" />
        </svg>
        {steam.map((d, i) => (
          <span key={i} className="amb-steam" style={{ left: `calc(${63.2 + (i - 1) * 1.6}% - 7px)`, '--delay': `${d}s` }} />
        ))}
      </div>
    </>
  );
}

function Lofi() {
  return (
    <>
      <LofiWindow />
      <LofiDesk />
    </>
  );
}

// ---------------------------------------------------------------- Neon Grid
const NEON_LINES = 14; // one per 1s of the 14s loop (see amb-grid in index.css)
const NEON_STILL = [100, 61.9, 42.86, 31.43, 23.81, 18.37, 14.29, 11.11, 8.57, 6.49, 4.76, 3.3, 2.04, 0.95];
// Stripes cut across the lower half of the sun: bands thin out and gaps widen toward the horizon.
const SUN_BANDS = [[0, 12], [16, 26], [31, 39], [45, 51], [58, 62], [70, 73], [83, 85]];

function NeonCity() {
  const { blocks, lights } = useMemo(() => {
    const r = rng(73);
    const out = [];
    const lit = [];
    for (let x = -10; x < 1610;) {
      const w = 30 + r() * 60;
      const mid = x > 560 && x < 1040; // keep the middle low so the sun shows
      const h = mid ? 14 + r() * 36 : 50 + r() * 130;
      out.push({ x, w, h });
      for (let wy = 200 - h + 10; wy < 194; wy += 12) {
        for (let wx = x + 6; wx < x + w - 8; wx += 10) {
          if (r() < 0.07) lit.push({ x: wx, y: wy, c: r() < 0.5 ? '#3ee8ff' : '#ff5cd0' });
        }
      }
      x += w + r() * 4;
    }
    return { blocks: out, lights: lit };
  }, []);
  return (
    <svg className="amb-neon-city" viewBox="0 0 1600 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <g fill="#150a2b">{blocks.map((b) => <rect key={b.x} x={b.x} y={200 - b.h} width={b.w} height={b.h} />)}</g>
      <g fillOpacity="0.55">{lights.map((l, i) => <rect key={i} x={l.x} y={l.y} width="3" height="4" fill={l.c} />)}</g>
    </svg>
  );
}

function Neon() {
  // Floor lines converge on the horizon centre: world x / depth, depth 8 at the horizon and 1 at the bottom.
  const verticals = Array.from({ length: 41 }, (_, i) => (i - 20) * 60);
  return (
    <>
      <Stars seed={61} count={80} />
      <div className="amb-neon-glow" aria-hidden="true" />
      <svg className="amb-neon-sun" viewBox="-100 -100 200 200" aria-hidden="true">
        <defs>
          <linearGradient id="neon-sun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffe66d" />
            <stop offset="0.5" stopColor="#ff8a5c" />
            <stop offset="1" stopColor="#ff3fa4" />
          </linearGradient>
          <clipPath id="neon-sun-cut">
            <rect x="-100" y="-100" width="200" height="100" />
            {SUN_BANDS.map(([a, b]) => <rect key={a} x="-100" y={a} width="200" height={b - a} />)}
          </clipPath>
        </defs>
        <circle r="100" fill="url(#neon-sun)" clipPath="url(#neon-sun-cut)" />
      </svg>
      <NeonCity />
      <div className="amb-neon-floor" aria-hidden="true">
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none">
          <g stroke="#ff5cd0" strokeOpacity="0.4" strokeWidth="1.2">
            {verticals.map((d) => <line key={d} x1={500 + d / 8} y1="0" x2={500 + d} y2="100" vectorEffect="non-scaling-stroke" />)}
          </g>
        </svg>
        <svg className="amb-neon-still" viewBox="0 0 1000 100" preserveAspectRatio="none">
          <g stroke="#ff5cd0" strokeOpacity="0.55" strokeWidth="1.5">
            {NEON_STILL.map((y) => <line key={y} x1="0" y1={y} x2="1000" y2={y} vectorEffect="non-scaling-stroke" />)}
          </g>
        </svg>
        {Array.from({ length: NEON_LINES }, (_, i) => (
          <span key={i} className="amb-gridline" style={{ '--delay': `${-i}s` }} />
        ))}
      </div>
      <div className="amb-scanlines" aria-hidden="true" />
    </>
  );
}

// ---------------------------------------------------------------- Desert Dunes
// A small camel facing left, feet at y=28.
const CAMEL = 'M2 4 L6 2 L10 4 L12 10 Q16 6 20 4 Q26 -2 30 6 Q34 8 35 12 L34 16 L33 28 L31 28 L31 17 L27 17 L27 28 L25 28 L24 17 L17 17 L16 28 L14 28 L14 17 L12 17 L12 28 L10 28 L10 14 L5 7 L2 6 Z';
const Saguaro = ({ x, y, s }) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 0 V-64 M0 -26 H-12 V-44 M0 -34 H11 V-52"
    stroke="#6d6442" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none"
  />
);

function DuneLayers() {
  return (
    <svg className="amb-dunes" viewBox="0 0 1600 420" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="dunes-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e2cba5" />
          <stop offset="1" stopColor="#d6ba8f" />
        </linearGradient>
        <linearGradient id="dunes-mid" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d8b282" />
          <stop offset="0.5" stopColor="#c99e6d" />
          <stop offset="1" stopColor="#d4ab79" />
        </linearGradient>
        <linearGradient id="dunes-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c8996a" />
          <stop offset="1" stopColor="#b5875a" />
        </linearGradient>
      </defs>
      <path d="M0 420 V250 C 200 210 340 200 520 232 C 700 262 820 214 1000 206 C 1160 200 1300 236 1600 222 V420 Z" fill="url(#dunes-far)" />
      <g fill="#8a6a4a" fillOpacity="0.6">
        {[0, 26, 52].map((dx) => <path key={dx} d={CAMEL} transform={`translate(${1010 + dx} ${188 - dx * 0.03}) scale(0.6)`} />)}
        <path d="M1000 206 v-12 a2.5 2.5 0 0 1 5 0 v12 Z" />
      </g>
      <path d="M0 420 V300 C 160 270 300 250 420 262 C 560 276 640 320 820 316 C 1000 312 1120 262 1280 258 C 1420 254 1520 280 1600 290 V420 Z" fill="url(#dunes-mid)" />
      <path d="M420 262 C 560 276 640 320 820 316 C 700 300 560 286 420 262 Z" fill="#b88c5e" fillOpacity="0.45" />
      <Saguaro x={1380} y={292} s={0.7} />
      <Saguaro x={1440} y={300} s={0.45} />
      <path d="M0 420 V352 C 220 330 420 344 600 368 C 760 388 960 356 1160 340 C 1340 326 1480 340 1600 350 V420 Z" fill="url(#dunes-near)" />
      <g fill="none" stroke="#9c7149" strokeOpacity="0.3" strokeWidth="2" strokeLinecap="round">
        <path d="M120 380 C 220 370 320 374 420 386" />
        <path d="M200 398 C 320 388 440 392 540 404" />
        <path d="M900 378 C 1000 366 1100 360 1220 362" />
        <path d="M1000 396 C 1120 384 1240 380 1360 384" />
      </g>
      <Saguaro x={230} y={356} s={1} />
    </svg>
  );
}

function Dunes() {
  return (
    <>
      <div className="amb-dune-sun" aria-hidden="true" />
      <div className="amb-dune-haze" aria-hidden="true" />
      <DuneLayers />
      <Scatter count={14} seed={47} className="amb-sand" size={[2, 4]} top={95} />
    </>
  );
}

// ---------------------------------------------------------------- Flight Deck
// Flat rounded cloud strips laid out over one screen-width and repeated once, so a -50% slide loops.
const cloudStrips = (seed, count, h) => {
  const r = rng(seed);
  const one = Array.from({ length: count }, () => ({ x: r() * 1300, w: 120 + r() * 260, y: r() * (100 - h), h }));
  return [...one, ...one.map((c) => ({ ...c, x: c.x + 1440 }))];
};

function FlightHud() {
  const ladder = [-80, -40, 40, 80];
  const bank = [-45, -30, -15, 0, 15, 30, 45];
  return (
    <svg className="amb-hud" viewBox="-150 -150 300 300" aria-hidden="true">
      <g fill="none" stroke="#6ae3a4" strokeWidth="1.2" strokeLinecap="round">
        <path d="M-130 0 H-28 M28 0 H130" strokeWidth="1.5" />
        {ladder.map((y) => (
          <path key={y} d={`M-60 ${y} H-20 M20 ${y} H60`} strokeDasharray={y > 0 ? '6 5' : undefined} />
        ))}
        <path d="M-34 0 H-12 L-6 8 L0 0 L6 8 L12 0 H34" strokeWidth="2" strokeLinejoin="round" />
        <path d="M-104.6 -60.4 A120.8 120.8 0 0 1 104.6 -60.4" />
        {bank.map((a) => {
          const t = ((a - 90) * Math.PI) / 180;
          const k = a % 30 === 0 ? 10 : 6;
          return <path key={a} d={`M${120 * Math.cos(t)} ${120 * Math.sin(t)} L${(120 + k) * Math.cos(t)} ${(120 + k) * Math.sin(t)}`} />;
        })}
        <path d="M0 -114 L-5 -104 H5 Z" fill="#6ae3a4" />
      </g>
      <circle r="2" fill="#6ae3a4" />
      <g fill="#6ae3a4" fontSize="9" fontFamily="'Rajdhani', sans-serif" textAnchor="end">
        {ladder.map((y) => <text key={y} x="-66" y={y + 3}>{Math.abs(y) / 8}</text>)}
      </g>
    </svg>
  );
}

function Flight() {
  const bands = useMemo(() => [
    { cls: 'amb-cloudband amb-cloudband-1', strips: cloudStrips(81, 7, 34), fill: '#2a3a62' },
    { cls: 'amb-cloudband amb-cloudband-2', strips: cloudStrips(82, 6, 40), fill: '#22314f' },
  ], []);
  return (
    <>
      <Stars seed={83} count={60} />
      <div className="amb-flight-below" aria-hidden="true" />
      {bands.map((b) => (
        <svg key={b.cls} className={b.cls} viewBox="0 0 2880 100" preserveAspectRatio="none" aria-hidden="true">
          {b.strips.map((c, i) => <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} rx={c.h / 2} fill={b.fill} />)}
        </svg>
      ))}
      <FlightHud />
      <div className="amb-tape amb-tape-l" aria-hidden="true"><span className="amb-tape-strip" /></div>
      <div className="amb-tape amb-tape-r" aria-hidden="true"><span className="amb-tape-strip" /></div>
    </>
  );
}

// ---------------------------------------------------------------- Night Train
// Three cars heading right; track level is y=55, the reflection sits below it.
const TRAIN_CARS = [0, 172, 344];

function TrainSilhouette() {
  const cars = TRAIN_CARS;
  const windows = useMemo(() => {
    const r = rng(91);
    return TRAIN_CARS.flatMap((cx) => Array.from({ length: 8 }, (_, i) => ({ x: cx + 14 + i * 18, lit: r() < 0.8 })));
  }, []);
  return (
    <svg className="amb-train" viewBox="0 0 520 90" aria-hidden="true">
      <g fill="#17132f">
        {cars.map((cx, i) => (
          <path
            key={cx}
            d={i === 2
              ? `M${cx} 18 H${cx + 150} Q ${cx + 172} 18 ${cx + 174} 40 V50 H${cx} Z`
              : `M${cx} 18 H${cx + 164} V50 H${cx} Z`}
          />
        ))}
        <rect x="0" y="50" width="518" height="4" />
        <path d="M164 34 H172 M336 34 H344" stroke="#17132f" strokeWidth="3" />
      </g>
      <path d="M60 18 L70 8 L80 18 M232 18 L242 8 L252 18" fill="none" stroke="#17132f" strokeWidth="1.5" />
      <g>
        {windows.map((w) => (
          <rect key={w.x} x={w.x} y="26" width="11" height="9" rx="1.5" fill={w.lit ? '#ffd59a' : '#2b2552'} />
        ))}
        <rect x="500" y="28" width="9" height="7" rx="2" fill="#ffe7c2" />
      </g>
      {/* Reflection: the lit windows smeared into thin flat bars on the water. */}
      <g opacity="0.28">
        {windows.filter((w) => w.lit).map((w) => (
          <g key={w.x} fill="#ffd59a">
            <rect x={w.x} y="62" width="11" height="2" />
            <rect x={w.x + 2} y="68" width="8" height="1.5" />
            <rect x={w.x + 3} y="74" width="5" height="1" />
          </g>
        ))}
      </g>
      <rect x="0" y="58" width="518" height="1.5" fill="#17132f" opacity="0.6" />
    </svg>
  );
}

function NightTrain() {
  return (
    <>
      <Stars seed={93} count={50} />
      <Scatter count={8} seed={94} className="amb-twinkle" size={[2, 3]} top={40} />
      <div className="amb-train-moon" aria-hidden="true" />
      <div className="amb-train-sea" aria-hidden="true" />
      <svg className="amb-train-glint" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <g stroke="#f6eee0" strokeLinecap="round" vectorEffect="non-scaling-stroke">
          {[[10, 30, 70], [22, 38, 62], [36, 26, 74], [52, 42, 58], [68, 34, 66], [84, 44, 56]].map(([y, a, b]) => (
            <line key={y} x1={a} y1={y} x2={b} y2={y} strokeOpacity={0.35 - y / 400} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </svg>
      <svg className="amb-train-track" viewBox="0 0 1600 40" preserveAspectRatio="none" aria-hidden="true">
        <g stroke="#4a4180">
          <line x1="0" y1="1" x2="1600" y2="1" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {Array.from({ length: 17 }, (_, i) => (
            <line key={i} x1={i * 100} y1="1" x2={i * 100} y2="40" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
          ))}
        </g>
      </svg>
      <TrainSilhouette />
    </>
  );
}

// ---------------------------------------------------------------- Starry Night
// Constellation lines (index pairs into each point list) — faint, never near the centre column.
const CONSTELLATIONS = [
  { pts: [[1080, 140], [1140, 160], [1190, 192], [1240, 202], [1256, 262], [1330, 266], [1344, 208]], links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
  { pts: [[250, 150], [300, 200], [352, 166], [404, 214], [456, 172]], links: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { pts: [[1380, 420], [1450, 380], [1500, 450]], links: [[0, 1], [1, 2], [2, 0]] },
];

function MilkyWay() {
  const band = useMemo(() => {
    const r = rng(111);
    // Stars scattered around the band's axis, denser near the middle (sum of uniforms ≈ bell curve).
    return Array.from({ length: 320 }, () => {
      const t = r();
      const off = (r() + r() + r() - 1.5) * 120;
      return { x: t * 1600 + off * 0.39, y: 760 - t * 680 + off * 0.92, s: 0.5 + r() * 1.1, o: 0.2 + r() * 0.6 };
    });
  }, []);
  return (
    <svg className="amb-milkyway" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="starry-band">
          <stop offset="0" stopColor="#c6ceff" stopOpacity="0.2" />
          <stop offset="0.55" stopColor="#8f9ce0" stopOpacity="0.08" />
          <stop offset="1" stopColor="#8f9ce0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="starry-core">
          <stop offset="0" stopColor="#ffe8cc" stopOpacity="0.14" />
          <stop offset="1" stopColor="#ffe8cc" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="starry-dust">
          <stop offset="0" stopColor="#04060f" stopOpacity="0.55" />
          <stop offset="1" stopColor="#04060f" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform="translate(800 420) rotate(-23)">
        <ellipse rx="1050" ry="150" fill="url(#starry-band)" />
        <ellipse cx="80" rx="560" ry="70" fill="url(#starry-core)" />
        <ellipse cx="40" cy="8" rx="760" ry="22" fill="url(#starry-dust)" />
      </g>
      <g fill="#fff">
        {band.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} opacity={s.o} />)}
      </g>
      {CONSTELLATIONS.map((c, k) => (
        <g key={k}>
          <g stroke="#c8d7ff" strokeOpacity="0.16" strokeWidth="1">
            {c.links.map(([a, b]) => <line key={`${a}-${b}`} x1={c.pts[a][0]} y1={c.pts[a][1]} x2={c.pts[b][0]} y2={c.pts[b][1]} />)}
          </g>
          <g fill="#fff" fillOpacity="0.85">
            {c.pts.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="2" />)}
          </g>
        </g>
      ))}
    </svg>
  );
}

function StarryHills() {
  const pines = useMemo(() => {
    const r = rng(113);
    let d = '';
    for (let x = 30; x < 330; x += 26 + r() * 30) {
      const h = 40 + r() * 46;
      const base = 214 + r() * 8;
      d += ` M${x - h * 0.22} ${base} L${x} ${base - h} L${x + h * 0.22} ${base} Z`;
    }
    return d;
  }, []);
  return (
    <svg className="amb-starry-hills" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <radialGradient id="starry-tent">
          <stop offset="0" stopColor="#ffcf7a" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffcf7a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M0 300 V190 C 180 150 380 170 560 196 C 760 224 920 170 1120 160 C 1320 150 1460 178 1600 170 V300 Z" fill="#080c1c" />
      <g fill="#03050c">
        <path d="M0 300 V220 C 200 190 420 200 620 230 C 820 258 1000 214 1200 200 C 1380 188 1500 206 1600 214 V300 Z" />
        <path d={pines} />
        <circle cx="430" cy="196" r="20" /><rect x="428" y="200" width="4" height="22" />
        <circle cx="462" cy="204" r="14" /><rect x="460" y="208" width="3" height="16" />
        <path d="M1150 204 L1178 168 L1206 204 Z" />
        <path d="M1240 199 L1250 172 L1260 199 M1250 172 V199" stroke="#03050c" strokeWidth="2.5" />
        <rect x="1236" y="164" width="36" height="7" rx="2" transform="rotate(-32 1250 172)" />
      </g>
      <circle cx="1178" cy="198" r="36" fill="url(#starry-tent)" />
      <path d="M1172 204 L1178 186 L1184 204 Z" fill="#ffcf7a" fillOpacity="0.85" />
    </svg>
  );
}

function Starry() {
  return (
    <>
      <Stars seed={7} count={200} className="amb-stars amb-stars-full" />
      <MilkyWay />
      <Scatter count={14} seed={112} className="amb-twinkle" size={[2, 4]} top={60} />
      <span className="amb-comet amb-comet-1" aria-hidden="true" />
      <span className="amb-comet amb-comet-2" aria-hidden="true" />
      <div className="amb-starry-glow" aria-hidden="true" />
      <StarryHills />
    </>
  );
}

// ---------------------------------------------------------------- Glow Bay
function GlowBay() {
  // Glowing crests: a wide faint stroke under a thin bright one reads as a soft glow without any filter.
  const waves = [
    { cls: 'amb-bay-wave amb-bay-wave-1', amp: 6, len: 720, base: 50, fill: '#05202d', glow: 0.08, line: 0.45 },
    { cls: 'amb-bay-wave amb-bay-wave-2', amp: 9, len: 480, base: 60, fill: '#041a26', glow: 0.12, line: 0.65 },
    { cls: 'amb-bay-wave amb-bay-wave-3', amp: 10, len: 360, base: 70, fill: '#03141e', glow: 0.18, line: 0.9 },
  ];
  return (
    <>
      <Stars seed={121} count={70} />
      <svg className="amb-bay-moon" viewBox="0 0 120 120" aria-hidden="true">
        <defs>
          <radialGradient id="glowbay-halo">
            <stop offset="0.3" stopColor="#bff7ee" stopOpacity="0.18" />
            <stop offset="1" stopColor="#bff7ee" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="60" r="60" fill="url(#glowbay-halo)" />
        <path d="M66 26 A34 34 0 1 0 66 94 A40 40 0 0 1 66 26 Z" fill="#e6f6f2" />
      </svg>
      <div className="amb-bay-sea" aria-hidden="true" />
      <svg className="amb-bay-glint" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {[[8, 34, 66], [20, 40, 60], [34, 30, 70], [50, 44, 56], [64, 38, 62]].map(([y, a, b]) => (
          <line key={y} x1={a} y1={y} x2={b} y2={y} stroke="#cffaf3" strokeOpacity={0.3 - y / 400} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {waves.map((w) => {
        const crest = wavePath(w.amp, w.len, w.base).replace(/ V 200 H 0 Z$/, '');
        return (
          <svg key={w.cls} className={w.cls} viewBox="0 0 2880 200" preserveAspectRatio="none" aria-hidden="true">
            <path d={wavePath(w.amp, w.len, w.base)} fill={w.fill} />
            <path d={crest} fill="none" stroke="#4ff0e0" strokeOpacity={w.glow} strokeWidth="7" vectorEffect="non-scaling-stroke" />
            <path d={crest} fill="none" stroke="#9ffcf2" strokeOpacity={w.line} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
          </svg>
        );
      })}
      <svg className="amb-bay-palm" viewBox="0 0 400 500" aria-hidden="true">
        <g fill="#02080d">
          <path d="M150 500 C 140 470 170 444 214 446 C 250 432 300 440 320 462 C 360 458 400 470 400 500 Z" />
          <path d="M290 456 C 280 360 262 240 226 128 L236 126 C 276 240 300 356 306 456 Z" />
          <path d="M230 124 C 272 92 324 96 356 126 C 318 112 276 114 232 132 Z" />
          <path d="M230 124 C 260 76 300 60 340 64 C 300 80 268 100 236 130 Z" />
          <path d="M230 124 C 220 76 196 52 160 44 C 196 70 214 96 226 130 Z" />
          <path d="M230 124 C 190 100 140 104 108 134 C 146 120 188 120 228 132 Z" />
          <path d="M230 124 C 196 132 166 160 154 196 C 180 166 204 146 232 132 Z" />
          <path d="M230 124 C 266 132 296 160 304 198 C 282 168 258 148 228 134 Z" />
        </g>
        <path d="M150 500 C 140 470 170 444 214 446 C 250 432 300 440 320 462 C 360 458 400 470 400 500" fill="none" stroke="#4ff0e0" strokeOpacity="0.22" strokeWidth="1.5" />
      </svg>
      <div className="amb-bay-water" aria-hidden="true">
        <Scatter count={18} seed={122} className="amb-plankton" size={[2, 4]} />
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Lantern Festival
function LanternField() {
  const far = useMemo(() => {
    const r = rng(131);
    return Array.from({ length: 54 }, () => ({ x: r() * 1600, y: 120 + r() * 460, s: 1.2 + r() * 1.6, o: 0.35 + r() * 0.45 }));
  }, []);
  return (
    <svg className="amb-lan-far" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {far.map((l, i) => (
        <g key={i} opacity={l.o}>
          <circle cx={l.x} cy={l.y} r={l.s * 3.2} fill="#ffb066" fillOpacity="0.14" />
          <circle cx={l.x} cy={l.y} r={l.s} fill="#ffcf8a" />
        </g>
      ))}
    </svg>
  );
}

function LanternShore() {
  const { shimmer, floats } = useMemo(() => {
    const r = rng(132);
    return {
      shimmer: Array.from({ length: 40 }, () => {
        const y = 4 + r() * r() * 200;
        return { x: r() * 1600, y, w: 20 + r() * 80, o: 0.08 + (1 - y / 200) * 0.22 };
      }),
      floats: [[260, 46], [520, 70], [700, 34], [980, 58], [1150, 90], [1380, 42]].map(([x, y]) => ({ x, y, s: 0.7 + y / 120 })),
    };
  }, []);
  return (
    <svg className="amb-lan-reflect" viewBox="0 0 1600 340" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      <g fill="#ffb066">
        {shimmer.map((s, i) => <rect key={i} x={s.x} y={s.y} width={s.w} height="1.5" opacity={s.o} />)}
      </g>
      {floats.map((f) => (
        <g key={f.x} transform={`translate(${f.x} ${f.y}) scale(${f.s})`}>
          <rect x="-2" y="4" width="4" height="26" fill="#ffb066" opacity="0.18" />
          <rect x="-1" y="34" width="2" height="12" fill="#ffb066" opacity="0.1" />
          <circle r="12" fill="#ffb066" fillOpacity="0.16" />
          <rect x="-5" y="-6" width="10" height="9" rx="3" fill="#ffc36f" />
        </g>
      ))}
    </svg>
  );
}

function Lanterns() {
  return (
    <>
      <LanternField />
      <div className="amb-lan-glow" aria-hidden="true" />
      <svg className="amb-lan-hills" viewBox="0 0 1600 160" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path d="M0 160 V110 C 160 70 320 64 480 92 C 640 120 760 70 940 62 C 1120 54 1280 96 1440 84 C 1520 78 1570 86 1600 90 V160 Z" fill="#3b2a45" />
        <g fill="#1f1629">
          <path d="M0 160 V130 C 200 112 380 120 560 136 C 760 152 980 122 1180 118 C 1360 114 1500 128 1600 132 V160 Z" />
          {/* a small tiered pavilion on the far shore */}
          <path d="M1252 120 V100 H1288 V120 Z M1242 102 L1270 90 L1298 102 Z M1256 90 V80 H1284 V90 Z M1248 82 L1270 70 L1292 82 Z M1269 70 V62 H1271 V70 Z" />
        </g>
        <rect x="1264" y="106" width="12" height="8" fill="#ffc36f" fillOpacity="0.8" />
      </svg>
      <div className="amb-lan-water" aria-hidden="true" />
      <LanternShore />
      <Drifters count={22} seed={133} className="amb-lantern" size={[6, 14]} dur={[40, 70]} />
    </>
  );
}

// ---------------------------------------------------------------- Snowfall
// Three-tier pines with a snow cap on the top tier only.
const snowPines = (r, base, minH, maxH, gap, x0, x1) => {
  let body = '';
  let snow = '';
  for (let x = x0; x < x1; x += gap * (0.6 + r() * 0.8)) {
    const h = minH + r() * (maxH - minH);
    body += ` M${x - 3} ${base} h6 v${-h * 0.14} h-6 Z`;
    for (let t = 0; t < 3; t++) {
      const foot = base - h * (0.1 + t * 0.28);
      const w = h * 0.34 * (1 - t * 0.25);
      const tip = foot - h * 0.42;
      body += ` M${x - w} ${foot} L${x} ${tip} L${x + w} ${foot} Z`;
      if (t === 2) snow += ` M${x - w * 0.4} ${tip + h * 0.17} L${x} ${tip} L${x + w * 0.4} ${tip + h * 0.17} Z`;
    }
  }
  return { body, snow };
};

function SnowScene() {
  const rows = useMemo(() => {
    const r = rng(141);
    return {
      back: snowPines(r, 402, 46, 86, 34, -40, 1640),
      left: snowPines(r, 486, 120, 200, 70, -40, 300),
      right: snowPines(r, 486, 120, 200, 70, 1320, 1640),
    };
  }, []);
  return (
    <svg className="amb-snow-scene" viewBox="0 0 1600 500" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="snowfall-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c3d0dd" />
          <stop offset="1" stopColor="#d6dfe8" />
        </linearGradient>
        <radialGradient id="snowfall-glow">
          <stop offset="0" stopColor="#ffcf7a" stopOpacity="0.4" />
          <stop offset="1" stopColor="#ffcf7a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M0 330 L120 250 L210 290 L360 170 L470 250 L560 220 L700 120 L840 230 L960 190 L1100 100 L1240 210 L1360 170 L1480 230 L1600 200 V500 H0 Z" fill="url(#snowfall-far)" />
      <path d="M360 170 L332 196 L348 192 L362 204 L378 192 L392 198 Z M700 120 L666 152 L684 147 L700 160 L716 147 L736 154 Z M1100 100 L1064 134 L1082 129 L1100 142 L1118 129 L1138 136 Z" fill="#f3f6f9" />
      <path d="M0 380 L160 300 L300 350 L460 280 L620 360 L800 300 L980 370 L1160 290 L1320 350 L1480 300 L1600 340 V500 H0 Z" fill="#aebfd0" />
      <path d="M460 280 L440 296 L462 292 L480 298 Z M1160 290 L1138 307 L1160 302 L1180 308 Z M800 300 L782 314 L802 310 L818 316 Z" fill="#eef3f7" />
      <path d="M0 420 C 300 380 600 372 900 392 C 1150 408 1380 380 1600 392 V500 H0 Z" fill="#e9eef3" />
      <path d={rows.back.body} fill="#9fb1c4" />
      <path d={rows.back.snow} fill="#f3f6f9" />
      <circle cx="1180" cy="384" r="26" fill="url(#snowfall-glow)" />
      <g fill="#6e5d55">
        <rect x="1166" y="378" width="30" height="18" />
        <rect x="1189" y="362" width="4" height="10" />
      </g>
      <path d="M1160 380 L1181 363 L1202 380 Z" fill="#f6f8fa" stroke="#9aaabb" strokeWidth="1" />
      <rect x="1173" y="384" width="7" height="6" fill="#ffc76b" />
      <path d={rows.left.body + rows.right.body} fill="#6f86a0" />
      <path d={rows.left.snow + rows.right.snow} fill="#f3f6f9" />
      <path d="M0 470 C 260 444 520 450 800 466 C 1080 482 1340 452 1600 460 V500 H0 Z" fill="#f2f5f8" />
      <path d="M0 470 C 260 444 520 450 800 466 C 1080 482 1340 452 1600 460" fill="none" stroke="#c9d6e2" strokeWidth="1.5" />
    </svg>
  );
}

function Snowfall() {
  return (
    <>
      <div className="amb-snow-sun" aria-hidden="true" />
      <SnowScene />
      <Drifters count={22} seed={101} className="amb-snow" size={[2, 4]} dur={[18, 30]} />
      <Drifters count={10} seed={102} className="amb-snow amb-snow-near" size={[5, 8]} dur={[12, 20]} />
    </>
  );
}

// ---------------------------------------------------------------- Groovy
// Parallel ribbons sharing one long wave, back (top) to front (bottom); the whole sheet slides as one layer.
const GROOVY_STRIPES = [
  [40, '#e9b23c'], [68, '#de8a2c'], [96, '#c4581c'], [124, '#9a3a17'], [152, '#5e2c14'], [176, '#f1dfb8'],
];

const Daisy = ({ style }) => (
  <svg className="amb-daisy" viewBox="-30 -30 60 60" style={style} aria-hidden="true">
    <g fill="#fff6e0" stroke="#5e2c14" strokeWidth="2">
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <ellipse key={a} cx="0" cy="-15" rx="6.5" ry="12" transform={`rotate(${a})`} />
      ))}
    </g>
    <circle r="8" fill="#e9b23c" stroke="#5e2c14" strokeWidth="2" />
  </svg>
);

function Groovy() {
  const rays = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
  return (
    <>
      <svg className="amb-groovy-sun" viewBox="-300 -300 600 600" aria-hidden="true">
        <g fill="#e9b23c" fillOpacity="0.28">
          {rays.map((a) => <path key={a} d="M0 0 L-26 -300 L26 -300 Z" transform={`rotate(${a})`} />)}
        </g>
        <circle r="150" fill="#e9b23c" />
        <circle r="118" fill="#de8a2c" />
        <circle r="86" fill="#c4581c" />
        <circle r="54" fill="#9a3a17" />
      </svg>
      <svg className="amb-groovy-star" viewBox="-10 -10 20 20" style={{ top: '30vh', left: '42vw' }} aria-hidden="true">
        <path d="M0 -10 Q 1.5 -1.5 10 0 Q 1.5 1.5 0 10 Q -1.5 1.5 -10 0 Q -1.5 -1.5 0 -10 Z" fill="#9a3a17" />
      </svg>
      <svg className="amb-groovy-star" viewBox="-10 -10 20 20" style={{ top: '14vh', left: '58vw', width: 14 }} aria-hidden="true">
        <path d="M0 -10 Q 1.5 -1.5 10 0 Q 1.5 1.5 0 10 Q -1.5 1.5 -10 0 Q -1.5 -1.5 0 -10 Z" fill="#c4581c" />
      </svg>
      <Daisy style={{ top: '22vh', left: '24vw', width: 44, '--d': '60s' }} />
      <Daisy style={{ top: '40vh', left: '70vw', width: 30, '--d': '80s' }} />
      <Daisy style={{ top: '9vh', left: '40vw', width: 24, '--d': '70s' }} />
      <svg className="amb-groovy-waves" viewBox="0 0 2880 200" preserveAspectRatio="none" aria-hidden="true">
        {GROOVY_STRIPES.map(([base, fill]) => <path key={base} d={wavePath(26, 1440, base)} fill={fill} />)}
      </svg>
    </>
  );
}

// ---------------------------------------------------------------- Holo
function Holo() {
  return (
    <>
      <div className="amb-holo-blob amb-holo-cyan" aria-hidden="true" />
      <div className="amb-holo-blob amb-holo-violet" aria-hidden="true" />
      <div className="amb-holo-blob amb-holo-pink" aria-hidden="true" />
      <div className="amb-holo-blob amb-holo-lime" aria-hidden="true" />
      <svg className="amb-holo-ring" viewBox="-200 -200 400 400" aria-hidden="true">
        <defs>
          <linearGradient id="holo-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7ff0ff" />
            <stop offset="0.35" stopColor="#c59bff" />
            <stop offset="0.7" stopColor="#ff8fd8" />
            <stop offset="1" stopColor="#c8ff8a" />
          </linearGradient>
        </defs>
        <circle r="180" fill="none" stroke="url(#holo-ring)" strokeOpacity="0.45" strokeWidth="1.2" />
        <circle r="150" fill="none" stroke="url(#holo-ring)" strokeOpacity="0.18" strokeWidth="1" />
      </svg>
      <div className="amb-holo-grid" aria-hidden="true" />
    </>
  );
}

// ---------------------------------------------------------------- Pixel Quest
// Turns a height function into a stepped skyline on a 4-unit grid, so every edge is a crisp pixel step.
const pixelRidge = (f, step = 4) => {
  let d = 'M0 180';
  for (let x = 0; x <= 320; x += step) d += ` V${Math.round(f(x) / step) * step} H${x + step}`;
  return `${d} V180 Z`;
};

const PixelCloud = ({ style }) => (
  <svg className="amb-pixel-cloud" viewBox="0 0 40 16" shapeRendering="crispEdges" style={style} aria-hidden="true">
    <path d="M8 4 h8 v-4 h12 v4 h4 v4 h8 v8 h-40 v-8 h8 Z" fill="#cfc6f2" />
    <path d="M0 12 h40 v4 h-40 Z" fill="#9d92d6" />
  </svg>
);

function PixelWorld() {
  const { far, near, trees } = useMemo(() => {
    const peaks = [[30, 70], [92, 52], [150, 78], [214, 48], [290, 66]];
    const far = (x) => Math.min(...peaks.map(([px, py]) => py + Math.abs(x - px) * 0.9), 120);
    const near = (x) => 128 - 18 * Math.sin((x / 320) * Math.PI * 2.2 + 0.6);
    const r = rng(151);
    const trees = [];
    for (let x = 12; x < 200; x += 18 + Math.floor(r() * 3) * 4) trees.push(x);
    return { far: pixelRidge(far), near: pixelRidge(near), trees };
  }, []);
  const tree = (x) => {
    const base = Math.round((128 - 18 * Math.sin((x / 320) * Math.PI * 2.2 + 0.6)) / 4) * 4 + 4;
    return (
      <g key={x}>
        <rect x={x + 3} y={base - 4} width="2" height="4" fill="#4a2e1e" />
        <rect x={x} y={base - 8} width="8" height="4" fill="#1f5a34" />
        <rect x={x + 1} y={base - 12} width="6" height="4" fill="#26703f" />
        <rect x={x + 2} y={base - 16} width="4" height="4" fill="#2f8a4c" />
      </g>
    );
  };
  return (
    <svg className="amb-pixel-world" viewBox="0 0 320 180" preserveAspectRatio="xMidYMax slice" shapeRendering="crispEdges" aria-hidden="true">
      {[['#120f2a', 0, 40], ['#1a1640', 40, 28], ['#261d52', 68, 20], ['#3a2862', 88, 14], ['#5a336c', 102, 10], ['#83416c', 112, 8]].map(([c, y, h]) => (
        <rect key={y} x="0" y={y} width="320" height={h} fill={c} />
      ))}
      <rect x="252" y="20" width="16" height="16" fill="#f6e7b0" />
      <rect x="248" y="24" width="24" height="8" fill="#f6e7b0" />
      <rect x="256" y="16" width="8" height="24" fill="#f6e7b0" />
      <path d={far} fill="#3b2c6a" />
      <path d="M92 52 h4 v4 h4 v4 h-16 v-4 h4 Z M214 48 h4 v4 h4 v4 h-16 v-4 h4 Z" fill="#cfc6f2" />
      <path d={near} fill="#1d4a32" />
      {trees.map(tree)}
      {/* castle on the right hill */}
      <g fill="#4b4a6e">
        <rect x="236" y="96" width="44" height="20" />
        <rect x="232" y="80" width="12" height="36" />
        <rect x="272" y="80" width="12" height="36" />
        <rect x="252" y="72" width="12" height="44" />
        <rect x="232" y="76" width="4" height="4" /><rect x="240" y="76" width="4" height="4" />
        <rect x="272" y="76" width="4" height="4" /><rect x="280" y="76" width="4" height="4" />
        <rect x="252" y="68" width="4" height="4" /><rect x="260" y="68" width="4" height="4" />
      </g>
      <rect x="257" y="56" width="1" height="12" fill="#cfc6f2" />
      <rect x="258" y="56" width="6" height="4" fill="#ff7a7a" />
      <g fill="#ffd65a">
        <rect x="236" y="88" width="4" height="4" /><rect x="276" y="88" width="4" height="4" />
        <rect x="256" y="80" width="4" height="4" /><rect x="248" y="104" width="4" height="4" />
      </g>
      <rect x="254" y="104" width="8" height="12" fill="#1a1638" />
      <rect x="0" y="152" width="320" height="28" fill="#2a1e14" />
      <rect x="0" y="148" width="320" height="4" fill="#3f9a4a" />
      <rect x="0" y="152" width="320" height="4" fill="#4a3220" />
      {/* a tiny hero */}
      <g transform="translate(60 132)">
        <rect x="2" y="0" width="6" height="4" fill="#ff7a7a" />
        <rect x="2" y="4" width="6" height="4" fill="#f2c9a0" />
        <rect x="0" y="8" width="10" height="4" fill="#3f6fd8" />
        <rect x="2" y="12" width="2" height="4" fill="#4a2e1e" /><rect x="6" y="12" width="2" height="4" fill="#4a2e1e" />
      </g>
    </svg>
  );
}

function Pixel() {
  return (
    <>
      <PixelWorld />
      <Scatter count={14} seed={152} className="amb-pixel-star" size={[3, 5]} top={40} />
      <PixelCloud style={{ top: '10vh', width: 'min(200px, 26vw)', '--d': '160s', '--delay': '-30s' }} />
      <PixelCloud style={{ top: '24vh', width: 'min(140px, 18vw)', '--d': '210s', '--delay': '-120s' }} />
      <span className="amb-pixel-coin" aria-hidden="true" />
    </>
  );
}

const SCENES = {
  system: Monarch, noir: Noir, sakura: Sakura, space: Space, anime: Anime, lofi: Lofi, neon: Neon, dunes: Dunes,
  flight: Flight, nighttrain: NightTrain, starry: Starry, glowbay: GlowBay, lanterns: Lanterns, snowfall: Snowfall,
  groovy: Groovy, holo: Holo, pixel: Pixel,
};

const Ambience = memo(function Ambience({ theme }) {
  const Scene = SCENES[theme] || Monarch;
  return (
    <div className="amb" aria-hidden="true">
      <Scene />
    </div>
  );
});

export default Ambience;
