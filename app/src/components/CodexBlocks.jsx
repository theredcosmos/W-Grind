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
