import { memo } from 'react';
import { LIST_STYLE } from '../lib/theme';
import { tone } from '../lib/themes';

const LIST_SHORT = { blind75: 'B75', neetcode150: 'NC150', striver: 'SDE', top150: 'TI150' };

export const ListBadge = ({ list }) => (
  <span className="pill font-mono" style={{ color: tone(LIST_STYLE[list].color), background: LIST_STYLE[list].bg }}>
    {LIST_SHORT[list]}
  </span>
);

export const DiffPill = ({ difficulty }) => <span className={`pill pill-${difficulty}`}>{difficulty}</span>;

export const Bar = ({ value, total, color, className = '' }) => {
  const pct = total ? Math.min(100, (value / total) * 100) : 0;
  return (
    <div className={`bar ${className}`}>
      <span style={{ width: `${pct}%`, ...(color ? { background: color } : null) }} />
    </div>
  );
};

export const Ring = memo(function Ring({ value, total, size = 64, stroke = 6, color = 'var(--color-sys)', children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? Math.min(1, value / total) : 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="color-mix(in srgb, var(--color-ink) 8%, transparent)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 600ms var(--ease-snap)' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
});

export const PageHeader = ({ kicker, title, children }) => (
  <header className="flex flex-wrap items-end justify-between gap-4 mb-6 anim-rise">
    <div>
      <div className="sys-label mb-1.5">{kicker}</div>
      <h1 className="sys-heading text-2xl md:text-[28px] text-ink">{title}</h1>
    </div>
    {children}
  </header>
);

export const Check = ({ on }) => (
  <span
    className={`grid place-items-center w-[22px] h-[22px] rounded-[7px] border transition-colors duration-150 ${
      on ? 'bg-sys border-sys glow-sm' : 'border-line-strong bg-transparent group-hover:border-sys/70'
    }`}
  >
    {on && (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-on-sys" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="24" style={{ animation: 'check 220ms ease-out both' }} />
      </svg>
    )}
  </span>
);

export const Empty = ({ icon: Icon, title, children }) => (
  <div className="card p-10 text-center anim-fade">
    {Icon && <Icon className="mx-auto mb-3 text-faint" size={28} />}
    <div className="sys-heading text-lg mb-1">{title}</div>
    <div className="text-dim text-sm max-w-md mx-auto">{children}</div>
  </div>
);
