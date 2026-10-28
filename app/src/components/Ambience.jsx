import { memo, useMemo } from 'react';

/*
 * Background scenery for each theme. All art is original inline SVG (no image files,
 * nothing to license). Motion is transform/opacity only and stops when the user turns
 * ambient motion off (html[data-still]) or prefers reduced motion.
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
      <div className="amb-beam" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="beam" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="#fff3b0" stopOpacity="0" />
              <stop offset="0.35" stopColor="#fff3b0" stopOpacity="0.07" />
              <stop offset="1" stopColor="#fff3b0" stopOpacity="0.015" />
            </linearGradient>
          </defs>
          <polygon points="49.2,100 50.8,100 64,0 36,0" fill="url(#beam)" />
        </svg>
      </div>
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
function Stars() {
  const stars = useMemo(() => {
    const r = rng(99);
    return Array.from({ length: 110 }, () => ({ x: r() * 100, y: r() * 62, s: 0.06 + r() * 0.16, o: 0.25 + r() * 0.6 }));
  }, []);
  return (
    <svg className="amb-stars" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
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

const SCENES = { system: Monarch, noir: Noir, sakura: Sakura, tide: Tide, aurora: Aurora, zen: Zen };

const Ambience = memo(function Ambience({ theme }) {
  const Scene = SCENES[theme] || Monarch;
  return (
    <div className="amb" aria-hidden="true">
      <Scene />
    </div>
  );
});

export default Ambience;
