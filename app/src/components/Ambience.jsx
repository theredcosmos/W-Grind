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

// ---------------------------------------------------------------- Tide
const wavePath = (amp, length, base) => {
  // Two full screen-widths of a smooth sine so a -50% translate loops seamlessly.
  let d = `M0 ${base}`;
  for (let x = 0; x < 2880; x += length) {
    d += ` Q ${x + length / 4} ${base - amp} ${x + length / 2} ${base} T ${x + length} ${base}`;
  }
  return `${d} V 200 H 0 Z`;
};

function Tide() {
  const waves = [
    { cls: 'amb-wave amb-wave-1', d: wavePath(18, 480, 70), fill: 'rgb(62 224 208 / 0.08)' },
    { cls: 'amb-wave amb-wave-2', d: wavePath(14, 360, 96), fill: 'rgb(17 168 196 / 0.12)' },
    { cls: 'amb-wave amb-wave-3', d: wavePath(10, 720, 124), fill: 'rgb(2 22 34 / 0.85)' },
  ];
  return (
    <>
      <div className="amb-rays" aria-hidden="true" />
      <Drifters count={4} seed={3} className="amb-bubble" size={[4, 7]} dur={[22, 36]} />
      {waves.map((w) => (
        <svg key={w.cls} className={w.cls} viewBox="0 0 2880 200" preserveAspectRatio="none" aria-hidden="true">
          <path d={w.d} fill={w.fill} />
        </svg>
      ))}
    </>
  );
}

// ---------------------------------------------------------------- Aurora
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

function Aurora() {
  return (
    <>
      <Stars />
      <div className="amb-ribbon amb-ribbon-1" aria-hidden="true" />
      <div className="amb-ribbon amb-ribbon-2" aria-hidden="true" />
      <div className="amb-ribbon amb-ribbon-3" aria-hidden="true" />
      <svg className="amb-mountains" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path d="M0 300 L0 170 L140 90 L240 160 L380 60 L520 170 L640 120 L790 200 L930 80 L1080 180 L1210 110 L1360 190 L1480 120 L1600 170 L1600 300 Z" fill="#0b1124" />
        <path d="M380 60 L350 82 L372 78 L392 92 L410 80 Z M930 80 L902 102 L926 98 L946 110 L962 98 Z" fill="#c8d4ff" fillOpacity="0.12" />
        <path d="M0 300 L0 230 L180 170 L330 230 L470 180 L620 240 L780 190 L960 250 L1120 200 L1280 245 L1440 205 L1600 240 L1600 300 Z" fill="#060912" />
      </svg>
    </>
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

// ---------------------------------------------------------------- Forest
function Pines() {
  const rows = useMemo(() => {
    const r = rng(17);
    const row = (base, minH, maxH, gap) => {
      const trees = [];
      for (let x = -40; x < 1640; x += gap * (0.6 + r() * 0.8)) trees.push({ x, h: minH + r() * (maxH - minH) });
      // Each pine: a short trunk under three stacked tiers, widest at the bottom.
      return trees.map(({ x, h }) => {
        let d = `M${x - 3} ${base} h6 v${-h * 0.14} h-6 Z`;
        for (let t = 0; t < 3; t++) {
          const foot = base - h * (0.1 + t * 0.28);
          const w = h * 0.34 * (1 - t * 0.25);
          d += ` M${x - w} ${foot} L${x} ${foot - h * 0.42} L${x + w} ${foot} Z`;
        }
        return d;
      }).join(' ');
    };
    return [row(330, 120, 220, 70), row(370, 140, 250, 90), row(402, 170, 290, 120)];
  }, []);
  return (
    <svg className="amb-pines" viewBox="0 0 1600 400" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <path d={rows[0]} fill="#14352a" />
      <rect y="328" width="1600" height="72" fill="#14352a" />
      <path d={rows[1]} fill="#0b2219" />
      <rect y="368" width="1600" height="32" fill="#0b2219" />
      <path d={rows[2]} fill="#040b07" />
    </svg>
  );
}

function Forest() {
  return (
    <>
      <div className="amb-moon" aria-hidden="true" />
      <div className="amb-mist amb-mist-1" aria-hidden="true" />
      <Pines />
      <div className="amb-mist amb-mist-2" aria-hidden="true" />
      <Drifters count={10} seed={23} className="amb-firefly" size={[3, 5]} dur={[18, 30]} />
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

// ---------------------------------------------------------------- Zen Paper
function Zen() {
  return (
    <svg className="amb-enso" viewBox="0 0 400 400" aria-hidden="true">
      <path d="M206 46 C 300 50 360 130 350 214 C 340 302 262 360 182 352 C 96 344 40 270 50 186 C 58 122 100 78 150 60"
        fill="none" stroke="#22201c" strokeOpacity="0.07" strokeWidth="30" strokeLinecap="round" />
      <path d="M214 52 C 296 62 346 136 338 212 C 330 288 262 340 190 336"
        fill="none" stroke="#22201c" strokeOpacity="0.05" strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

const SCENES = { system: Monarch, noir: Noir, sakura: Sakura, tide: Tide, aurora: Aurora, zen: Zen, space: Space, forest: Forest, anime: Anime };

const Ambience = memo(function Ambience({ theme }) {
  const Scene = SCENES[theme] || Monarch;
  return (
    <div className="amb" aria-hidden="true">
      <Scene />
    </div>
  );
});

export default Ambience;
