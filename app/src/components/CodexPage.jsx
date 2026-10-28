import { useDeferredValue, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import manual from '../data/manual.json';
import { PageHeader } from './ui';

const TABS = [
  { key: 'antiBlank', label: 'Anti-Blank Protocol' },
  { key: 'decoder', label: 'Pattern Decoder' },
  { key: 'linker', label: 'Element Linker' },
];

const ACRONYMS = /\b(Adhd|Dsa|Lru|Bfs|Dfs|Dp)\b/g;
const titleCase = (s) => s
  .replace(/^\d+\.\s*/, '')
  .toLowerCase()
  .replace(/(^|[\s(/'-])(\w)/g, (m, a, b) => a + b.toUpperCase())
  .replace(ACRONYMS, (w) => w.toUpperCase())
  .replace(/\bLeetcode\b/g, 'LeetCode');

// Code-ish lines (comments, numbered steps) read better in mono.
const Body = ({ text, mono }) => (
  <p className={`whitespace-pre-line leading-relaxed ${mono ? 'font-mono text-[12.5px] text-sys/90' : 'text-[13.5px] text-ink/85'}`}>{text}</p>
);

function AntiBlank({ rows }) {
  const sections = useMemo(() => {
    const m = new Map();
    for (const r of rows) {
      if (!m.has(r[0])) m.set(r[0], []);
      m.get(r[0]).push(r);
    }
    return [...m];
  }, [rows]);
  return (
    <div className="space-y-8">
      {sections.map(([name, steps]) => (
        <section key={name}>
          <h2 className="sys-heading text-lg mb-3">{titleCase(name)}</h2>
          <div className="space-y-3">
            {steps.map((s) => (
              <div key={s[1]} className="card p-5 grid lg:grid-cols-2 gap-4">
                <div>
                  <div className="sys-label text-[10.5px] mb-2">{s[1]}</div>
                  <Body text={s[2]} />
                </div>
                <div className="rounded-lg bg-void/60 border border-line p-4">
                  <div className="text-[10.5px] uppercase tracking-wider text-faint mb-2">Do this</div>
                  <Body text={s[3]} mono={s[3].trimStart().startsWith('#')} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Decoder({ rows }) {
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query.toLowerCase());
  const shown = rows.filter((r) => !q || r.join(' ').toLowerCase().includes(q));
  return (
    <>
      <div className="relative max-w-md mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a clue: “sorted”, “N <= 20”, “k-th”…" className="input pl-9" />
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {shown.map((r) => (
          <div key={r[1]} className="card p-4">
            <div className="text-[10.5px] uppercase tracking-wider text-faint mb-1.5">{titleCase(r[0])}</div>
            <div className="font-semibold text-[14.5px] mb-2">{r[1]}</div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="pill bg-sys/10 text-sys font-mono">{r[2]}</span>
              <span className="text-sm text-gold font-semibold">→ {r[3]}</span>
            </div>
            <p className="text-[13px] text-dim leading-relaxed">{r[4]}</p>
          </div>
        ))}
      </div>
    </>
  );
}

function Linker({ rows }) {
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r[0]} className="card p-5">
          <h3 className="sys-heading text-[16px] mb-3">{r[0].replace(/^\d+\.\s*/, '')}</h3>
          <div className="grid md:grid-cols-2 gap-3 mb-3">
            <div className="rounded-lg border border-line p-3"><Body text={r[1]} /></div>
            <div className="rounded-lg border border-line p-3"><Body text={r[2]} /></div>
          </div>
          <div className="rounded-lg bg-sys/[0.06] border border-sys/25 p-3 mb-2">
            <div className="text-[10.5px] uppercase tracking-wider text-sys mb-1">The glue</div>
            <Body text={r[3]} />
          </div>
          <div className="text-[12px] text-faint">{r[4]}</div>
        </div>
      ))}
    </div>
  );
}

export default function CodexPage({ tab }) {
  const active = TABS.find((t) => t.key === tab) || TABS[0];
  return (
    <div>
      <PageHeader kicker="Hunter's Codex" title={active.label} />
      <div className="flex gap-2 overflow-x-auto mb-6 anim-rise">
        {TABS.map((t) => (
          <a key={t.key} href={`#/codex/${t.key}`} className="chip h-9" data-on={t.key === active.key}>{t.label}</a>
        ))}
      </div>
      <div className="anim-fade" key={active.key}>
        {active.key === 'antiBlank' && <AntiBlank rows={manual.antiBlank.rows} />}
        {active.key === 'decoder' && <Decoder rows={manual.decoder.rows} />}
        {active.key === 'linker' && <Linker rows={manual.linker.rows} />}
      </div>
    </div>
  );
}
