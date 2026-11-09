import { useState } from 'react';
import { AlertTriangle, Check, Copy, Dumbbell, KeyRound, Lightbulb, MessageCircleQuestion } from 'lucide-react';

/* Renders the blocks of one Codex section (format: data/codex/schema.js). Code shows no font
 * ligatures, so `!=`, `->` and `<>` look exactly as you type them. */

// `code` and **bold** inside text.
export function Inline({ text }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith('`') && p.endsWith('`') && p.length > 1) {
      return <code key={i} className="font-mono text-[0.92em] px-1 py-px rounded bg-ink/[0.07] text-hi [font-variant-ligatures:none]">{p.slice(1, -1)}</code>;
    }
    if (p.startsWith('**') && p.endsWith('**') && p.length > 3) return <strong key={i} className="text-hi font-semibold">{p.slice(2, -2)}</strong>;
    return p;
  });
}

const BlockTitle = ({ children }) => <div className="text-[11px] font-semibold uppercase tracking-wider text-faint mb-2">{children}</div>;

const CALLOUTS = {
  key: { icon: KeyRound, label: 'Remember', cls: 'border-gold/40 bg-gold/[0.07]', tone: 'text-gold' },
  tip: { icon: Lightbulb, label: 'Tip', cls: 'border-sys/35 bg-sys/[0.06]', tone: 'text-sys' },
  warn: { icon: AlertTriangle, label: 'Trap', cls: 'border-hard/40 bg-hard/[0.06]', tone: 'text-hard' },
  drill: { icon: Dumbbell, label: 'Drill', cls: 'border-easy/40 bg-easy/[0.06]', tone: 'text-easy' },
};

function CodeBlock({ title, code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }).catch(() => {});
  };
  return (
    <div className="rounded-lg border border-line bg-void/60 overflow-hidden">
      <div className="flex items-center gap-2 px-3 h-8 border-b border-line">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-faint truncate">{title || 'Code'}</span>
        <button onClick={copy} className="ml-auto flex items-center gap-1 text-[11px] text-faint hover:text-ink" aria-label="Copy code">
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <pre className="overflow-x-auto scroll-thin p-3 font-mono text-[12.5px] leading-relaxed text-ink/90 [font-variant-ligatures:none]"><code>{code}</code></pre>
    </div>
  );
}

// Box colours per node kind (theme tokens, so every theme recolours them).
const NODE = {
  user: 'border-ink/30 bg-ink/[0.05] text-ink',
  svc: 'border-sys/45 bg-sys/[0.08] text-hi',
  lb: 'border-sys-deep/50 bg-sys-deep/[0.10] text-hi',
  db: 'border-gold/50 bg-gold/[0.08] text-hi',
  store: 'border-gold/50 bg-gold/[0.08] text-hi border-dashed',
  cache: 'border-easy/50 bg-easy/[0.08] text-hi',
  q: 'border-medium/50 bg-medium/[0.08] text-hi',
  ext: 'border-hard/45 bg-hard/[0.07] text-hi',
};
const KIND_LABEL = { user: 'client', svc: 'service', lb: 'routing', db: 'database', store: 'storage', cache: 'cache', q: 'queue', ext: 'external' };
const parseNode = (n) => {
  const m = /^(user|svc|lb|db|cache|q|ext|store):(.*)$/.exec(n);
  return m ? { kind: m[1], label: m[2] } : { kind: 'svc', label: n };
};

// A boxes-and-arrows picture: columns left to right on wide screens, top to bottom on phones.
// Container widths at which a flow of n columns turns into a row (literal classes for Tailwind).
const FLOW_LAYOUT = {
  lg: { row: '@lg:flex-row @lg:items-center', col: '@lg:flex-col @lg:flex-1 @lg:min-w-0', gap: '@lg:flex-col @lg:gap-0.5 @lg:px-1 @lg:w-16', down: '@lg:hidden', right: '@lg:block' },
  xl2: { row: '@2xl:flex-row @2xl:items-center', col: '@2xl:flex-col @2xl:flex-1 @2xl:min-w-0', gap: '@2xl:flex-col @2xl:gap-0.5 @2xl:px-1 @2xl:w-16', down: '@2xl:hidden', right: '@2xl:block' },
  xl4: { row: '@4xl:flex-row @4xl:items-center', col: '@4xl:flex-col @4xl:flex-1 @4xl:min-w-0', gap: '@4xl:flex-col @4xl:gap-0.5 @4xl:px-1 @4xl:w-16', down: '@4xl:hidden', right: '@4xl:block' },
};

function Flow({ title, cols, labels = [], note }) {
  const L = FLOW_LAYOUT[cols.length <= 3 ? 'lg' : cols.length <= 4 ? 'xl2' : 'xl4'];
  const kinds = [...new Set(cols.flat().map((n) => parseNode(n).kind))];
  return (
    <figure className="@container rounded-lg border border-line bg-void/40 p-3">
      {title && <BlockTitle>{title}</BlockTitle>}
      {/* Row when the card is wide enough for every column, otherwise a top-to-bottom stack. */}
      <div className={`flex flex-col gap-1 ${L.row}`}>
        {cols.map((col, i) => (
          <div key={i} className="contents">
            <div className={`flex flex-row flex-wrap gap-1.5 ${L.col}`}>
              {col.map((n, j) => {
                const { kind, label } = parseNode(n);
                return (
                  <div key={j} className={`rounded-md border px-2.5 py-1.5 text-[12.5px] leading-tight font-medium text-center flex-1 ${NODE[kind]}`}>
                    <Inline text={label} />
                  </div>
                );
              })}
            </div>
            {i < cols.length - 1 && (
              <div className={`flex items-center justify-center gap-1.5 py-0.5 text-faint shrink-0 ${L.gap}`}>
                <span aria-hidden className={`text-[15px] leading-none ${L.down}`}>↓</span>
                <span aria-hidden className={`text-[15px] leading-none hidden ${L.right}`}>→</span>
                {labels[i] && <span className="text-[10.5px] leading-tight text-dim text-center">{labels[i]}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-faint">
        {kinds.map((k) => (
          <span key={k} className="flex items-center gap-1"><span className={`inline-block w-2.5 h-2.5 rounded-sm border ${NODE[k]}`} />{KIND_LABEL[k]}</span>
        ))}
        {note && <span className="basis-full text-[12px] text-dim leading-relaxed"><Inline text={note} /></span>}
      </figcaption>
    </figure>
  );
}

function Block({ b }) {
  switch (b.type) {
    case 'text':
      return <p className="text-[14px] leading-relaxed text-ink/90"><Inline text={b.text} /></p>;
    case 'list':
    case 'steps': {
      const Tag = b.type === 'list' ? 'ul' : 'ol';
      return (
        <div>
          {b.title && <BlockTitle>{b.title}</BlockTitle>}
          <Tag className={`space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-ink/90 marker:text-faint ${b.type === 'list' ? 'list-disc' : 'list-decimal'}`}>
            {b.items.map((it, i) => <li key={i}><Inline text={it} /></li>)}
          </Tag>
        </div>
      );
    }
    case 'table':
      return (
        <div>
          {b.title && <BlockTitle>{b.title}</BlockTitle>}
          <div className="overflow-x-auto scroll-thin rounded-lg border border-line">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead>
                <tr className="bg-ink/[0.04]">
                  {b.head.map((h) => <th key={h} className="px-3 py-2 font-semibold text-hi whitespace-nowrap border-b border-line">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {b.rows.map((r, i) => (
                  <tr key={i} className="border-b border-line last:border-0 align-top">
                    {r.map((c, j) => <td key={j} className={`px-3 py-2 leading-relaxed ${j === 0 ? 'font-medium text-ink' : 'text-ink/85'}`}><Inline text={c} /></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    case 'code':
      return <CodeBlock title={b.title} code={b.code} />;
    case 'flow':
      return <Flow title={b.title} cols={b.cols} labels={b.labels} note={b.note} />;
    case 'callout': {
      const c = CALLOUTS[b.tone] || CALLOUTS.tip;
      return (
        <div className={`rounded-lg border px-3.5 py-3 ${c.cls}`}>
          <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-1 ${c.tone}`}>
            <c.icon size={13} /> {b.title || c.label}
          </div>
          <p className="text-[13.5px] leading-relaxed text-ink/90"><Inline text={b.text} /></p>
        </div>
      );
    }
    case 'qa':
      return (
        <div>
          {b.title && <BlockTitle>{b.title}</BlockTitle>}
          <dl className="space-y-2">
            {b.items.map((it, i) => (
              <div key={i} className="rounded-lg border border-line px-3.5 py-2.5">
                <dt className="flex gap-2 text-[13.5px] font-semibold text-hi"><MessageCircleQuestion size={15} className="text-sys shrink-0 mt-0.5" /><span><Inline text={it.q} /></span></dt>
                <dd className="text-[13.5px] leading-relaxed text-ink/85 mt-1 pl-6"><Inline text={it.a} /></dd>
              </div>
            ))}
          </dl>
        </div>
      );
    default:
      return null;
  }
}

export default function CodexBlocks({ blocks }) {
  return <div className="space-y-4">{blocks.map((b, i) => <Block key={i} b={b} />)}</div>;
}
