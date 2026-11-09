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
        <path fillRule="evenodd" d="M0 0 H400 V480 H0 Z M24 24 V440 H376 V24 Z" fill="#2b2340" />
        <rect x="194" y="24" width="12" height="416" fill="#2b2340" />
        <rect x="24" y="226" width="352" height="12" fill="#2b2340" />
        <path d="M24 24 H376 M24 24 V440" stroke="#f2a7c3" strokeOpacity="0.16" strokeWidth="2" fill="none" />
        <rect x="0" y="452" width="400" height="28" fill="#352b4c" />
        <rect x="0" y="452" width="400" height="2" fill="#f2a7c3" fillOpacity="0.18" />
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
          <ellipse cx="96" cy="274" rx="44" ry="7" fill="#3a3152" />
          <path d="M96 270 L136 160 L222 102" stroke="#3a3152" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="136" cy="160" r="7" fill="#4a3f66" />
          <path d="M204 90 L250 70 L292 150 L232 168 Z" fill="#4a3f66" />
          <ellipse cx="262" cy="159" rx="31" ry="7" transform="rotate(-17 262 159)" fill="#ffd9a0" fillOpacity="0.85" />
          {/* mug */}
          <path d="M378 232 a14 14 0 0 1 0 28" stroke="#c97a9a" strokeWidth="6" fill="none" />
          <path d="M330 216 h48 v52 a10 10 0 0 1 -10 10 h-28 a10 10 0 0 1 -10 -10 Z" fill="#c97a9a" />
          <ellipse cx="354" cy="216" rx="24" ry="4" fill="#3b2131" />
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


const SCENES = {
  system: Monarch, sakura: Sakura, space: Space, anime: Anime, lofi: Lofi, nighttrain: NightTrain, lanterns: Lanterns, holo: Holo,
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
