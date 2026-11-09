import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Circle, ExternalLink, Footprints, Layers, Loader2, Maximize2, Play, Search, X, Zap } from 'lucide-react';
import { useDialog } from '../lib/useDialog';
import { CODEX_TABS, loadAllTabs, loadTab, sectionText } from '../data/codex';
import { PageHeader } from './ui';
import CodexBlocks, { Inline } from './CodexBlocks';

/*
 * The Codex: the gym where you train before fighting problems. Every tab (data/codex/*.js, the
 * Classic ones built from manual.json) is a list of cards; a card opens in a large reading window,
 * and you tick it off as "trained". Search runs across every tab.
 *
 * Built for an ADHD brain: an opened section shows a Quick view by default (the gist, what to
 * remember, one list, the drill), a Step-by-step view (one card at a time), or Everything.
 */

// ---------------------------------------------------------------- trained sections (this device)
const TRAINED_KEY = 'codexTrained';
const readTrained = () => {
  try { return JSON.parse(localStorage.getItem(TRAINED_KEY)) || {}; } catch { return {}; }
};
function useTrained() {
  const [trained, setTrained] = useState(readTrained);
  const toggle = useCallback((tabKey, id) => {
    setTrained((prev) => {
      const list = new Set(prev[tabKey] || []);
      if (list.has(id)) list.delete(id);
      else list.add(id);
      const next = { ...prev, [tabKey]: [...list] };
      try { localStorage.setItem(TRAINED_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  }, []);
  return [trained, toggle];
}

// ---------------------------------------------------------------- how an opened section reads
const VIEWS = [
  { id: 'quick', label: 'Quick', icon: Zap },
  { id: 'steps', label: 'Step by step', icon: Footprints },
  { id: 'full', label: 'Everything', icon: Layers },
];
const VIEW_KEY = 'codexView';
function useCodexView() {
  const [view, setViewState] = useState(() => {
    try { return localStorage.getItem(VIEW_KEY) || 'quick'; } catch { return 'quick'; }
  });
  const setView = useCallback((v) => {
    setViewState(v);
    try { localStorage.setItem(VIEW_KEY, v); } catch { /* private mode */ }
  }, []);
  return [view, setView];
}

// The few blocks worth reading first: the opening idea, what to remember, one list, the drill.
const quickBlocks = (blocks) => {
  const pick = new Set();
  const first = (test) => { const i = blocks.findIndex(test); if (i >= 0) pick.add(i); };
  first((b) => b.type === 'text');
  first((b) => b.type === 'flow');
  blocks.forEach((b, i) => { if (b.type === 'callout' && b.tone === 'key') pick.add(i); });
  first((b) => b.type === 'steps' || b.type === 'list');
  first((b) => b.type === 'callout' && b.tone === 'drill');
  if (pick.size < 2) blocks.slice(0, 3).forEach((_, i) => pick.add(i));
  return blocks.filter((_, i) => pick.has(i));
};

const PART_LABEL = { text: 'The idea', list: 'Key points', steps: 'Steps', table: 'Table', code: 'Code', qa: 'Questions', flow: 'Picture' };
const CALLOUT_LABEL = { key: 'Remember', tip: 'Tip', warn: 'Trap', drill: 'Drill' };
const partLabel = (b) => b.title || (b.type === 'callout' ? CALLOUT_LABEL[b.tone] : PART_LABEL[b.type]);

// One block at a time, with a progress bar. Arrow keys move too.
function StepView({ blocks, done, onTrained }) {
  const [i, setI] = useState(0);
  const last = i === blocks.length - 1;
  const onKey = (e) => {
    if (e.key === 'ArrowRight' && !last) setI(i + 1);
    if (e.key === 'ArrowLeft' && i > 0) setI(i - 1);
  };
  return (
    <div onKeyDown={onKey} tabIndex={-1} className="outline-none">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[12px] font-semibold text-sys shrink-0">Part {i + 1} of {blocks.length} · {partLabel(blocks[i])}</span>
        <div className="flex-1 h-1.5 rounded-full bg-ink/10 overflow-hidden">
          <div className="h-full bg-sys transition-[width]" style={{ width: `${((i + 1) / blocks.length) * 100}%` }} />
        </div>
      </div>
      <div className="min-h-[120px] anim-fade" key={i}><CodexBlocks blocks={[blocks[i]]} /></div>
      <div className="flex items-center gap-2 mt-4">
        <button onClick={() => setI(i - 1)} disabled={i === 0} className="btn h-10 disabled:opacity-40"><ArrowLeft size={15} /> Back</button>
        {last ? (
          <button onClick={done ? undefined : onTrained} disabled={done} className={`btn h-10 ml-auto ${done ? 'text-easy' : 'btn-sys'}`}>
            <CheckCircle2 size={15} /> {done ? 'Trained' : 'Done · mark trained'}
          </button>
        ) : (
          <button onClick={() => setI(i + 1)} className="btn btn-sys h-10 ml-auto">Next <ArrowRight size={15} /></button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- content tabs
function useTab(key) {
  const [state, setState] = useState({ key: null, tab: null });
  useEffect(() => {
    let live = true;
    loadTab(key).then((tab) => live && setState({ key, tab })).catch(() => live && setState({ key, tab: null }));
    return () => { live = false; };
  }, [key]);
  return state.key === key ? state.tab : undefined; // undefined while loading
}

const TrainButton = ({ done, onTrained, className = '' }) => (
  <button
    onClick={onTrained}
    aria-pressed={done}
    title={done ? 'Trained — click to unmark' : 'Mark as trained'}
    className={`flex items-center gap-1.5 shrink-0 h-8 px-2.5 rounded-lg text-[12px] font-semibold border transition-colors ${
      done ? 'border-easy/50 text-easy bg-easy/10' : 'border-line text-faint hover:text-ink'
    } ${className}`}
  >
    {done ? <CheckCircle2 size={14} /> : <Circle size={14} />} <span className="hidden sm:inline">{done ? 'Trained' : 'Train'}</span>
  </button>
);

// One row in the list; clicking it opens the section in the reading window.
function SectionCard({ s, done, onOpen, onTrained }) {
  return (
    <section className="card card-hover">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <button onClick={onOpen} className="min-w-0 flex-1 text-left group">
          <div className="flex items-center gap-2">
            <h3 className="sys-heading text-[16px] leading-tight group-hover:text-hi">{s.title}</h3>
            <Maximize2 size={14} className="text-faint shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-[13px] text-dim mt-1"><Inline text={s.summary} /></p>
        </button>
        <TrainButton done={done} onTrained={onTrained} />
      </div>
    </section>
  );
}

// The reading window: a large dialog (like Customize mix) with the section, its views, and
// previous / next so you can keep going without closing it.
function SectionDialog({ s, index, total, done, view, onView, onTrained, onClose, onPrev, onNext }) {
  const dialogRef = useDialog();
  const bodyRef = useRef(null);
  const quick = useMemo(() => quickBlocks(s.blocks), [s.blocks]);
  const more = s.blocks.length - quick.length;
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => { bodyRef.current?.scrollTo(0, 0); }, [s.id, view]);

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-void/75 anim-fade" onClick={onClose} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={s.title} tabIndex={-1}
        className="sys-window anim-drop relative w-full max-w-5xl h-[94dvh] sm:h-[90dvh] flex flex-col">
        <div className="flex items-start gap-3 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-line shrink-0">
          <div className="min-w-0 flex-1">
            <div className="sys-label">{index + 1} of {total}</div>
            <h2 className="sys-heading text-lg sm:text-xl leading-tight">{s.title}</h2>
            <p className="text-[13px] text-dim mt-1"><Inline text={s.summary} /></p>
          </div>
          <TrainButton done={done} onTrained={onTrained} />
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-lg text-dim hover:text-ink hover:bg-ink/5 shrink-0" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 px-4 sm:px-6 py-2.5 border-b border-line shrink-0" role="tablist" aria-label="How to read this section">
          {VIEWS.map((v) => (
            <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => onView(v.id)} className="chip h-7 text-[12px]" data-on={view === v.id}>
              <v.icon size={12} /> {v.label}
            </button>
          ))}
        </div>
        <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto scroll-thin px-4 sm:px-6 py-4">
          <div className="max-w-3xl mx-auto">
            {view === 'steps' && <StepView key={s.id} blocks={s.blocks} done={done} onTrained={onTrained} />}
            {view === 'quick' && (
              <>
                <CodexBlocks blocks={quick} />
                {more > 0 && (
                  <button onClick={() => onView('full')} className="mt-3 text-[12.5px] text-sys hover:underline">
                    + {more} more part{more === 1 ? '' : 's'} (tables, code, traps) · show everything
                  </button>
                )}
              </>
            )}
            {view === 'full' && <CodexBlocks blocks={s.blocks} />}
            {s.source && (
              <a href={s.source.href} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1 text-[12px] text-faint hover:text-sys">
                <ExternalLink size={12} /> {s.source.label}
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-t border-line shrink-0">
          <button onClick={onPrev} disabled={!onPrev} className="btn h-9 text-[13px] disabled:opacity-40"><ArrowLeft size={15} /> Previous</button>
          <button onClick={onNext} disabled={!onNext} className="btn btn-sys h-9 text-[13px] ml-auto">Next section <ArrowRight size={15} /></button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function ContentTab({ tabKey, focusId, trained, onTrained }) {
  const tab = useTab(tabKey);
  const [view, setView] = useCodexView();
  const done = useMemo(() => new Set(trained[tabKey] || []), [trained, tabKey]);

  // The open section lives in the URL (#/codex/<tab>?s=<id>): links and search results open it,
  // and Back closes it.
  const open = (id) => window.location.assign(`#/codex/${tabKey}?s=${id}`);
  const close = useCallback(() => window.location.assign(`#/codex/${tabKey}`), [tabKey]);

  if (tab === undefined) return <p className="text-dim text-sm flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Loading…</p>;
  if (!tab) return <p className="text-dim text-sm">This part of the Codex could not be loaded.</p>;

  const openIndex = tab.sections.findIndex((s) => s.id === focusId);
  const current = tab.sections[openIndex];
  const nextUp = tab.sections.find((s) => !done.has(s.id));
  const startNext = () => {
    setView('steps');
    open(nextUp.id);
  };

  return (
    <div className="lg:grid lg:grid-cols-[210px_1fr] lg:gap-6">
      <nav className="hidden lg:block card p-2.5 sticky top-0 self-start max-h-[calc(100dvh-220px)] overflow-y-auto scroll-thin" aria-label="Sections">
        <div className="sys-label mb-2 px-2">{done.size}/{tab.sections.length} trained</div>
        <ul className="space-y-0.5">
          {tab.sections.map((s) => (
            <li key={s.id}>
              <button onClick={() => open(s.id)} className="w-full flex items-center gap-2 text-left text-[12.5px] px-2 py-1.5 rounded-md text-dim hover:text-ink hover:bg-ink/5">
                {done.has(s.id) ? <CheckCircle2 size={12} className="text-easy shrink-0" /> : <Circle size={12} className="text-faint shrink-0" />}
                <span className="truncate">{s.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <p className="text-[13.5px] text-dim flex-1 min-w-[220px]"><Inline text={tab.intro} /></p>
          <span className="lg:hidden text-[12px] text-faint">{done.size}/{tab.sections.length} trained</span>
        </div>
        {/* One small next step instead of a wall of sections. */}
        {nextUp ? (
          <div className="card px-4 py-3 mb-4 flex flex-wrap items-center gap-3 border-sys/40">
            <Footprints size={18} className="text-sys shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-semibold text-sys">Next up · about 10 minutes</div>
              <div className="text-[14.5px] font-semibold truncate">{nextUp.title}</div>
            </div>
            <button onClick={startNext} className="btn btn-sys h-9 text-[13px]"><Play size={14} /> Start step by step</button>
          </div>
        ) : (
          <div className="card px-4 py-3 mb-4 text-[13.5px] text-easy flex items-center gap-2"><CheckCircle2 size={16} /> Every section here is trained. Revisit any in Quick view.</div>
        )}
        <div className="space-y-2.5">
          {tab.sections.map((s) => (
            <SectionCard key={s.id} s={s} done={done.has(s.id)} onOpen={() => open(s.id)} onTrained={() => onTrained(tabKey, s.id)} />
          ))}
        </div>
      </div>
      {current && (
        <SectionDialog
          s={current}
          index={openIndex}
          total={tab.sections.length}
          done={done.has(current.id)}
          view={view}
          onView={setView}
          onTrained={() => onTrained(tabKey, current.id)}
          onClose={close}
          onPrev={openIndex > 0 ? () => open(tab.sections[openIndex - 1].id) : null}
          onNext={openIndex < tab.sections.length - 1 ? () => open(tab.sections[openIndex + 1].id) : null}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- search across every tab
function SearchResults({ query }) {
  const [tabs, setTabs] = useState(null);
  useEffect(() => {
    let live = true;
    loadAllTabs().then((all) => live && setTabs(all.filter(Boolean))).catch(() => live && setTabs([]));
    return () => { live = false; };
  }, []);
  const hits = useMemo(() => {
    if (!tabs) return [];
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return tabs.flatMap((t) => t.sections
      .filter((s) => { const text = sectionText(s); return words.every((w) => text.includes(w)); })
      .map((s) => ({ tab: t, s })));
  }, [tabs, query]);

  if (!tabs) return <p className="text-dim text-sm flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Searching the whole Codex…</p>;
  if (!hits.length) return <p className="text-dim text-sm">Nothing matches “{query}”. Try one word, like “heap” or “sharding”.</p>;
  return (
    <div className="space-y-2">
      <div className="sys-label mb-1">{hits.length} section{hits.length === 1 ? '' : 's'}</div>
      {hits.map(({ tab, s }) => (
        <a key={`${tab.key}-${s.id}`} href={`#/codex/${tab.key}?s=${s.id}`} className="card card-hover block px-4 py-3">
          <div className="flex items-baseline gap-2">
            <span className="text-[12px] font-semibold text-sys shrink-0">{tab.label}</span>
            <span className="font-semibold text-[14.5px] truncate">{s.title}</span>
          </div>
          <p className="text-[13px] text-dim mt-0.5"><Inline text={s.summary} /></p>
        </a>
      ))}
    </div>
  );
}

export default function CodexPage({ tab, section }) {
  const active = CODEX_TABS.find((t) => t.key === tab) || CODEX_TABS[0];
  const [trained, toggleTrained] = useTrained();
  const [query, setQuery] = useState('');
  const q = useDeferredValue(query.trim());
  const searching = q.length >= 2;

  // Opening a search result (or another tab) changes the route: leave search mode.
  const route = `${active.key}?${section || ''}`;
  const [lastRoute, setLastRoute] = useState(route);
  if (route !== lastRoute) {
    setLastRoute(route);
    setQuery('');
  }

  const groups = useMemo(() => {
    const m = new Map();
    for (const t of CODEX_TABS) {
      if (!m.has(t.group)) m.set(t.group, []);
      m.get(t.group).push(t);
    }
    return [...m];
  }, []);

  return (
    <div className="flex flex-col md:h-full min-h-0">
      <PageHeader kicker="Hunter's Codex · the gym" title={searching ? 'Search' : active.label} />
      <div className="shrink-0 anim-rise space-y-3 mb-5">
        <div className="relative max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the whole Codex: “heap”, “sliding window”, “TreeMap”, “sharding”…"
            className="input pl-9 pr-9"
            aria-label="Search the Codex"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-md text-faint hover:text-ink" aria-label="Clear search">
              <X size={15} />
            </button>
          )}
        </div>
        {/* Wraps instead of scrolling sideways, so every tab (LLD, HLD, Classic) is always in view. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {groups.map(([group, tabs]) => (
            <div key={group} className="flex flex-wrap items-center gap-1.5">
              <span className="text-[12px] font-semibold text-faint">{group}</span>
              {tabs.map((t) => {
                const n = trained[t.key]?.length || 0;
                return (
                  <a key={t.key} href={`#/codex/${t.key}`} className="chip h-8" data-on={!searching && t.key === active.key}>
                    {t.label}
                    {n > 0 && <span className="text-[10.5px] text-easy font-mono">✓{n}</span>}
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="anim-fade flex-1 min-h-0 overflow-y-auto scroll-thin -mx-1 px-1 pb-2" key={searching ? 'search' : active.key}>
        {searching ? <SearchResults query={q} />
          : <ContentTab key={active.key} tabKey={active.key} focusId={section} trained={trained} onTrained={toggleTrained} />}
      </div>
    </div>
  );
}
