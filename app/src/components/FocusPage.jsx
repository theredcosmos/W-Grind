import { memo, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, Check, Cloud, Coffee, Lightbulb, Pause, Play, Repeat, Search, SlidersHorizontal, SquareCheck, Undo2, Volume2, VolumeX, X } from 'lucide-react';
import { PageHeader } from './ui';
import { notify } from '../lib/system';
import { userKey } from '../lib/session';
import { ymd } from '../lib/date';
import {
  MAX_MS, PRESETS, again, attach, fmt, getTimer, inSession, isWarn, load, pause, readLog, remainingOf,
  reset, setIntent, setMinutes, start, startBreak, subscribe,
} from '../lib/focus/timer';
import { DEFAULT_MIX, SCAPES, SOUNDS, endChime, halfChime, preview, scapeOf, setMix, unlock } from '../lib/focus/sounds';
import { useDialog } from '../lib/useDialog';
import { KINDS, classify, isOpen, loadNotes, makeNote, nextKind, saveNotes } from '../lib/focus/park';

/*
 * Focus: the Stillpoint timer, ported. A shrinking disc shows the time left, a parking lot
 * catches stray thoughts mid-session (hidden until the break), and generated focus sounds
 * fade in while a session runs. A finished focus session counts toward today's training.
 *
 * Built for an ADHD brain: one primary button at a time, big digits (or none), and nothing
 * to read while the clock runs except the one thing you said you'd do.
 */

const KIND_ICON = { task: SquareCheck, lookup: Search, idea: Lightbulb, worry: Cloud };

// ---------------------------------------------------------------- per-user prefs
const DEFAULT_PREFS = { digits: true, chime: true, mix: DEFAULT_MIX };
function usePrefs(key) {
  const [prefs, setPrefs] = useState(() => {
    try {
      const p = JSON.parse(localStorage.getItem(key)) || {};
      return { ...DEFAULT_PREFS, ...p, mix: { ...DEFAULT_MIX, ...p.mix } };
    } catch { return DEFAULT_PREFS; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(prefs)); } catch { /* private mode */ }
  }, [key, prefs]);
  return [prefs, setPrefs];
}

// ---------------------------------------------------------------- dial geometry (Stillpoint's 440 box)
const C = 220;
const R = 150;
const TICKS = Array.from({ length: 60 }, (_, m) => {
  const a = (m / 60) * Math.PI * 2;
  const major = m % 5 === 0;
  const r1 = major ? 160 : 166;
  const sin = Math.sin(a);
  const cos = Math.cos(a);
  return { m, major, x1: C + r1 * sin, y1: C - r1 * cos, x2: C + 174 * sin, y2: C - 174 * cos, lx: C + 198 * sin, ly: C - 198 * cos };
});

function wedgePath(f) {
  if (f <= 0) return '';
  if (f >= 0.9999) return `M${C},${C - R} A${R},${R} 0 1 1 ${C - 0.01},${C - R} Z`;
  const a = f * Math.PI * 2;
  return `M${C},${C} L${C},${C - R} A${R},${R} 0 ${f > 0.5 ? 1 : 0} 1 ${C + R * Math.sin(a)},${C - R * Math.cos(a)} Z`;
}

/** Re-render about 5x a second while running and the tab is visible (rAF pauses in hidden tabs). */
function useTicking(on) {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!on) return undefined;
    let raf = 0;
    const loop = () => {
      setTick(Math.floor(Date.now() / 200));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);
}

const statusLine = (t, rem, parkedThisRound) => {
  if (t.status === 'running' && t.onBreak) return 'Break. Stand up, stretch, drink water.';
  if (t.status === 'running') return rem <= 60000 ? 'Last minute. Find a stopping point.' : 'In focus';
  if (t.status === 'paused') return t.onBreak ? 'Break paused' : 'Paused';
  if (t.status === 'done') {
    const k = parkedThisRound;
    const m = Math.round(t.durationMs / 60000);
    return `Done. ${m} minute${m === 1 ? '' : 's'} of focus.${k ? ` ${k} distraction${k > 1 ? 's' : ''} parked, not followed.` : ''}`;
  }
  return 'Drag the dial or pick a length';
};

// ---------------------------------------------------------------- the disc
const Dial = memo(function Dial({ t, digits, parkedThisRound }) {
  const running = t.status === 'running';
  useTicking(running);
  const rem = remainingOf(t);
  const warn = isWarn(t, rem);
  const f = Math.min(rem, MAX_MS) / MAX_MS;
  const a = f * Math.PI * 2;
  const busy = running || t.status === 'paused';
  const minutes = Math.round(t.durationMs / 60000);
  const color = t.onBreak ? 'var(--color-easy)' : warn ? 'var(--color-gold)' : 'var(--color-sys)';

  // Drag on the face to set the length (Stillpoint: wrapping past 12 o'clock clamps to 1 or 60).
  const svgRef = useRef(null);
  const drag = useRef(null);
  const minFromEvent = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 440 - C;
    const y = ((e.clientY - r.top) / r.height) * 440 - C;
    let ang = Math.atan2(x, -y);
    if (ang < 0) ang += Math.PI * 2;
    let m = Math.round((ang / (Math.PI * 2)) * 60);
    const last = drag.current;
    if (last != null) {
      if (last >= 45 && m <= 15) m = 60;
      if (last <= 15 && m >= 45) m = 1;
    }
    return Math.max(1, Math.min(60, m || 60));
  };
  const onDown = (e) => {
    if (busy) return;
    svgRef.current.setPointerCapture(e.pointerId);
    drag.current = minutes;
    const m = minFromEvent(e);
    drag.current = m;
    setMinutes(m);
  };
  const onMove = (e) => {
    if (drag.current == null) return;
    const m = minFromEvent(e);
    if (m !== drag.current) {
      drag.current = m;
      setMinutes(m);
    }
  };
  const onUp = () => { drag.current = null; };
  const onKey = (e) => {
    if (busy) return;
    const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1, PageUp: 5, PageDown: -5 }[e.key];
    if (!step) return;
    e.preventDefault();
    setMinutes(minutes + step);
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <svg
        ref={svgRef}
        viewBox="0 0 440 440"
        role="slider"
        tabIndex={0}
        aria-label="Timer length in minutes"
        aria-valuemin={1}
        aria-valuemax={60}
        aria-valuenow={minutes}
        aria-valuetext={busy ? `${fmt(rem)} left` : `${minutes} minutes`}
        aria-disabled={busy || undefined}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={onKey}
        className={`block w-[min(100%,360px,calc(100dvh-470px))] min-w-[180px] aspect-square select-none rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sys ${busy ? '' : 'cursor-pointer touch-none'}`}
      >
        <circle cx={C} cy={C} r={176} fill="color-mix(in srgb, var(--color-ink) 4%, transparent)" stroke="var(--color-line)" strokeWidth="1.5" />
        {TICKS.map((k) => (
          <g key={k.m}>
            <line x1={k.x1} y1={k.y1} x2={k.x2} y2={k.y2} stroke={k.major ? 'var(--color-dim)' : 'var(--color-line-strong)'} strokeWidth={k.major ? 2.5 : 1.2} strokeLinecap="round" />
            {k.major && (
              <text x={k.lx} y={k.ly} textAnchor="middle" dominantBaseline="central" fill="var(--color-faint)" fontSize="15" fontFamily="var(--font-mono)">
                {k.m}
              </text>
            )}
          </g>
        ))}
        <path d={wedgePath(f)} fill={color} opacity={t.status === 'paused' ? 0.45 : 0.85} style={{ transition: 'fill 600ms ease, opacity 300ms ease' }} />
        <circle cx={C} cy={C} r={16} fill="var(--color-panel)" stroke="var(--color-line-strong)" strokeWidth="1.5" />
        <circle cx={C} cy={C} r={3} fill="var(--color-ink)" />
        <circle cx={C + R * Math.sin(a)} cy={C - R * Math.cos(a)} r={9} fill="var(--color-panel)" stroke={color} strokeWidth="3" />
      </svg>

      {digits && <div className="font-mono tabular leading-none text-hi text-[52px] sm:text-[64px]">{fmt(rem)}</div>}
      <p className={`text-sm text-center min-h-5 ${warn ? 'text-gold' : 'text-dim'}`} aria-live="polite">
        {statusLine(t, rem, parkedThisRound)}
      </p>
    </div>
  );
});

// ---------------------------------------------------------------- parking lot
const ParkItem = memo(function ParkItem({ n, onAct }) {
  const Icon = KIND_ICON[n.type] || SquareCheck;
  const kind = KINDS[n.type] || KINDS.task;
  const done = n.status === 'done';
  return (
    <li className={`flex items-start gap-2.5 py-2 ${done ? 'opacity-60' : ''}`}>
      <button
        onClick={() => onAct(n, 'type')}
        title={`${kind.label}. Click to change`}
        aria-label={`${kind.label}, change kind`}
        className="grid place-items-center w-7 h-7 shrink-0 rounded-lg text-sys hover:bg-sys/10"
      >
        <Icon size={15} />
      </button>
      <div className="min-w-0 flex-1">
        <div className={`text-[13.5px] leading-snug break-words ${done ? 'line-through text-dim' : 'text-ink'}`}>{n.text}</div>
        <div className="text-[11px] text-faint">
          {kind.label} · {new Date(n.created).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>
      <div className="flex shrink-0">
        {!done && (
          <button onClick={() => onAct(n, 'next')} title="Make this my next focus" aria-label={`Make this my next focus: ${n.text}`} className="grid place-items-center w-7 h-7 rounded-lg text-dim hover:text-sys hover:bg-sys/10">
            <ArrowUp size={15} />
          </button>
        )}
        <button onClick={() => onAct(n, 'done')} title={done ? 'Mark as not done' : 'Done'} aria-label={`${done ? 'Mark as not done' : 'Done'}: ${n.text}`} className="grid place-items-center w-7 h-7 rounded-lg text-dim hover:text-easy hover:bg-easy/10">
          <Check size={15} />
        </button>
        <button onClick={() => onAct(n, 'drop')} title="Let it go" aria-label={`Let it go: ${n.text}`} className="grid place-items-center w-7 h-7 rounded-lg text-dim hover:text-hard hover:bg-hard/10">
          <X size={15} />
        </button>
      </div>
    </li>
  );
});

function ParkingLot({ t, notes, setNotes, listOpen, setListOpen, inputRef }) {
  const [text, setText] = useState('');
  const [picked, setPicked] = useState(null);
  const [said, setSaid] = useState(null); // { text, undo? }
  const undoSnap = useRef(null);
  const saidTimer = useRef(0);
  useEffect(() => () => clearTimeout(saidTimer.current), []);

  const focusing = inSession(t);
  const kind = picked || (text.trim() ? classify(text) : 'task');
  const KindIcon = KIND_ICON[kind];
  const open = notes.filter(isOpen);
  const visible = notes.filter((n) => isOpen(n) || n.status === 'done');
  const label = t.intent.trim();

  const say = (msg, undo = false) => {
    clearTimeout(saidTimer.current);
    setSaid({ text: msg, undo });
    saidTimer.current = setTimeout(() => setSaid(null), undo ? 6000 : 3500);
  };

  const submit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const n = makeNote(text, picked, focusing ? t.sid : null);
    setNotes((prev) => [n, ...prev]);
    setText('');
    setPicked(null);
    const running = t.status === 'running' && !t.onBreak;
    say(running && label ? `Parked. Back to: ${label}` : KINDS[n.type].said);
    if (running) inputRef.current?.blur(); // hands off: back to the work
  };

  const onAct = useCallback((n, what) => {
    setNotes((prev) => {
      undoSnap.current = prev;
      const now = Date.now();
      return prev.map((x) => {
        if (x.id !== n.id) return x;
        if (what === 'type') return { ...x, type: nextKind(x.type) };
        if (what === 'done') return { ...x, status: x.status === 'done' ? 'open' : 'done', doneAt: now };
        if (what === 'drop') return { ...x, status: 'dropped', doneAt: now };
        return { ...x, status: 'promoted', doneAt: now }; // 'next'
      });
    });
    if (what === 'done' && n.status !== 'done') say('Done. One less thing in your head.', true);
    else if (what === 'drop') say('Let go.', true);
    else if (what === 'next') {
      setIntent(n.text);
      say('That is your one thing now. Start when ready.');
      setListOpen(false);
    }
  }, [setNotes, setListOpen]);

  const undo = () => {
    if (undoSnap.current) setNotes(undoSnap.current);
    undoSnap.current = null;
    setSaid(null);
  };

  const thisRound = visible.filter((n) => t.sid && n.sid === t.sid);
  const earlier = visible.filter((n) => !(t.sid && n.sid === t.sid));
  const order = (a, b) => (a.status === 'done') - (b.status === 'done') || b.created - a.created;

  const cue = focusing && t.status === 'running'
    ? `Something pulling at you? Park it here, then go straight back${label ? ` to ${label}` : ''}.`
    : t.status === 'paused' && !t.onBreak
      ? 'Paused. Empty your head here before you resume.'
      : t.status === 'done'
        ? 'Session done. Review what you parked, or add anything else on your mind.'
        : "A stray thought or urge to check something? Park it here and keep going. It'll wait.";

  return (
    <section id="parking-lot" className="card p-4 flex flex-col min-h-0 md:flex-1 md:min-h-[270px]" aria-label="Parking lot">
      <div className="flex items-center justify-between mb-1.5 shrink-0">
        <h2 className="sys-label">Parking lot</h2>
        {open.length > 0 && <span className="text-xs text-dim tabular">{open.length} waiting</span>}
      </div>
      <p className="text-[13px] text-dim leading-snug mb-3 shrink-0">{cue}</p>
      <form onSubmit={submit} className="flex gap-2 shrink-0" autoComplete="off">
        <button
          type="button"
          onClick={() => { setPicked(nextKind(kind)); inputRef.current?.focus(); }}
          title={`${KINDS[kind].label}. Click to change`}
          aria-label={`Kind of thought: ${KINDS[kind].label}. Click to change`}
          className="btn w-10 px-0 shrink-0 text-sys"
        >
          <KindIcon size={16} />
        </button>
        <input
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setText(''); setPicked(null); e.currentTarget.blur(); }
          }}
          maxLength={200}
          placeholder="Park a thought (N)"
          aria-label="Park a thought"
          className="input min-w-0 flex-1"
        />
        <button type="submit" className="btn shrink-0">Park</button>
      </form>
      <div className="min-h-6 mt-2 flex items-center gap-2 text-[12.5px] text-dim shrink-0" aria-live="polite">
        {said && (
          <>
            <span className="anim-fade">{said.text}</span>
            {said.undo && (
              <button onClick={undo} className="ml-auto inline-flex items-center gap-1 text-sys hover:underline">
                <Undo2 size={13} /> Undo
              </button>
            )}
          </>
        )}
      </div>

      {focusing ? (
        open.length > 0 && (
          <p className="text-[12.5px] text-faint">
            {open.length} thought{open.length > 1 ? 's' : ''} parked. They'll wait for your break.
          </p>
        )
      ) : visible.length > 0 && (
        listOpen ? (
          <div className="mt-1 border-t border-line pt-2 anim-fade flex flex-col min-h-0 flex-1">
            <div className="min-h-0 flex-1 overflow-y-auto scroll-thin -mr-2 pr-2">
            {[['This session', thisRound], ['Earlier', earlier]].map(([name, items]) => items.length > 0 && (
              <div key={name}>
                <div className="text-[11px] text-faint uppercase tracking-wider mt-1">{name} · {items.filter(isOpen).length}</div>
                <ul className="divide-y divide-line">
                  {[...items].sort(order).map((n) => <ParkItem key={n.id} n={n} onAct={onAct} />)}
                </ul>
              </div>
            ))}
            </div>
            <div className="flex items-center justify-between mt-2 shrink-0">
              {notes.some((n) => n.status === 'done') ? (
                <button
                  onClick={() => {
                    undoSnap.current = notes;
                    setNotes((prev) => prev.map((n) => (n.status === 'done' ? { ...n, status: 'cleared' } : n)));
                    say('Cleared.', true);
                  }}
                  className="text-xs text-dim hover:text-ink"
                >
                  Clear finished
                </button>
              ) : <span />}
              <button onClick={() => setListOpen(false)} className="text-xs text-dim hover:text-ink">Hide list</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setListOpen(true)} className="text-[12.5px] text-sys hover:underline self-start">
            Review {open.length || visible.length} parked
          </button>
        )
      )}
    </section>
  );
}

// ---------------------------------------------------------------- sounds
function Toggle({ on, onChange, children }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex items-center justify-between gap-3 text-left text-[13px] text-ink py-0.5 group"
    >
      <span>{children}</span>
      <span className={`relative w-9 h-5 rounded-full shrink-0 transition-colors ${on ? 'bg-sys' : 'bg-ink/15'}`}>
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-panel shadow transition-transform duration-200 ${on ? 'translate-x-4' : ''}`} />
      </span>
    </button>
  );
}

// One tap picks a whole soundscape (and previews it); "Customize mix" opens every slider in a
// roomy window instead of squeezing them into this card.
function SoundPanel({ prefs, setPrefs, running, onToggle }) {
  const { mix } = prefs;
  const [mixing, setMixing] = useState(false);
  const active = scapeOf(mix.levels);
  const playingNow = mix.enabled && (!mix.withTimer || running);

  const pick = (levels) => {
    unlock();
    setPrefs((p) => ({ ...p, mix: { ...p.mix, enabled: true, levels } }));
    if (!running) preview();
  };

  return (
    <section className="card p-4 shrink-0" aria-label="Focus sounds">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="sys-label">Soundscape</h2>
          <p className="text-[12px] text-dim mt-0.5 truncate">
            {!mix.enabled ? 'Off. Pick one to hear it.' : playingNow ? 'Playing' : 'Plays when you start a session'}
          </p>
        </div>
        <button onClick={onToggle} aria-pressed={mix.enabled} title="Sound on or off (M)" className={`btn h-8 shrink-0 ${mix.enabled ? 'btn-sys' : ''}`}>
          {mix.enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          {mix.enabled ? 'On' : 'Off'}
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3" role="group" aria-label="Soundscapes">
        {SCAPES.map(([id, name, levels]) => (
          <button key={id} onClick={() => pick(levels)} aria-pressed={mix.enabled && active === id} data-on={mix.enabled && active === id} className="chip h-8">
            {name}
          </button>
        ))}
      </div>
      <button onClick={() => setMixing(true)} className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-sys hover:underline">
        <SlidersHorizontal size={13} /> Customize mix{mix.enabled && !active ? ' · custom' : ''}
      </button>
      {mixing && <MixDialog prefs={prefs} setPrefs={setPrefs} running={running} onClose={() => setMixing(false)} />}
    </section>
  );
}

function MixDialog({ prefs, setPrefs, running, onClose }) {
  const dialogRef = useDialog();
  const { mix } = prefs;
  const setMixPrefs = (patch) => setPrefs((p) => ({ ...p, mix: { ...p.mix, ...patch } }));
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const level = (id, v) => {
    unlock();
    setMixPrefs({ enabled: true, levels: { ...mix.levels, [id]: v } });
    if (!running) preview(4000); // hear the change even before a session starts
  };

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-void/70 anim-fade" onClick={onClose} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Customize the soundscape" tabIndex={-1}
        className="sys-window anim-drop relative w-full max-w-[640px] max-h-[88dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-line shrink-0">
          <div>
            <div className="sys-label">Soundscape</div>
            <h2 className="sys-heading text-xl">Customize the mix</h2>
          </div>
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-lg text-dim hover:text-ink hover:bg-ink/5" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto scroll-thin px-5 py-4 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Toggle on={mix.withTimer} onChange={(v) => setMixPrefs({ withTimer: v })}>Play only while a session runs</Toggle>
            <Toggle on={prefs.chime} onChange={(v) => { unlock(); setPrefs((p) => ({ ...p, chime: v })); }}>Soft chime at halfway and the end</Toggle>
          </div>
          {SOUNDS.map(([group, items]) => (
            <div key={group}>
              <div className="text-[11px] text-faint uppercase tracking-wider mb-2">{group}</div>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                {items.map(([id, name, hint]) => (
                  <label key={id} className="flex flex-col gap-1.5">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-[13.5px] text-ink">{name}</span>
                      <span className="text-[11px] text-faint tabular">{Math.round((mix.levels[id] || 0) * 100)}</span>
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round((mix.levels[id] || 0) * 100)}
                      onChange={(e) => level(id, Number(e.target.value) / 100)}
                      aria-label={`${name} volume`}
                      className="w-full accent-[var(--color-sys)]"
                    />
                    {hint && <span className="text-[11px] text-faint">{hint}</span>}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <p className="text-[11px] text-faint">Generated live in your browser: nothing downloads, nothing repeats.</p>
        </div>
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-line shrink-0">
          <button onClick={() => { unlock(); setMixPrefs({ levels: {} }); }} className="text-[12.5px] text-dim hover:text-ink">Silence all</button>
          <button onClick={onClose} className="btn btn-sys h-9">Done</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------- page
export default function FocusPage({ username, onAddTime }) {
  const keys = useMemo(() => ({
    timer: userKey(username, 'focusTimer'),
    log: userKey(username, 'focusLog'),
    notes: userKey(username, 'parkedThoughts'),
    prefs: userKey(username, 'focusPrefs'),
  }), [username]);
  // Load this user's timer before the first render, so a running session shows straight away.
  useState(() => load(keys));
  useEffect(() => load(keys), [keys]);
  const t = useSyncExternalStore(subscribe, getTimer);

  const [prefs, setPrefs] = usePrefs(keys.prefs);
  const [log, setLog] = useState(() => readLog(keys.log));
  const [notes, setNotesRaw] = useState(() => loadNotes(keys.notes));
  const [listOpen, setListOpen] = useState(true); // the parked list shows outside sessions; it scrolls inside its card
  const parkRef = useRef(null);

  const setNotes = useCallback((update) => {
    setNotesRaw((prev) => {
      const next = typeof update === 'function' ? update(prev) : update;
      saveNotes(keys.notes, next);
      return next;
    });
  }, [keys.notes]);

  useEffect(() => { setMix(prefs.mix); }, [prefs.mix]);

  // What happens when a session ends. Kept by the engine after this page unmounts,
  // so the latest prefs live in a ref.
  const prefsRef = useRef(prefs);
  useEffect(() => { prefsRef.current = prefs; }, [prefs]);
  useEffect(() => {
    const showSystemNote = (title, body) => {
      if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return;
      try { new Notification(title, { body, icon: '/icon-192.png', tag: 'focus' }); } catch { /* mobile: service worker only */ }
    };
    attach({
      onFocusDone: ({ minutes, seconds, intent, late, log: nextLog }) => {
        onAddTime(seconds);
        setLog(nextLog);
        if (prefsRef.current.chime && !late) endChime();
        const what = intent.trim() ? ` on “${intent.trim()}”` : '';
        notify({ text: late
          ? `A ${minutes}-minute focus session${what} finished while you were away. Counted toward today’s training.`
          : `Focus complete: ${minutes} minute${minutes === 1 ? '' : 's'}${what}. Counted toward today’s training. Take a breath.` });
        showSystemNote('Session complete', `${minutes} minute${minutes === 1 ? '' : 's'} of focus${what}. Take a breath.`);
      },
      onBreakDone: ({ late }) => {
        if (prefsRef.current.chime && !late) endChime();
        notify({ text: 'Break over. Ready when you are.' });
        showSystemNote('Break over', 'Ready when you are.');
      },
      onHalf: () => { if (prefsRef.current.chime) halfChime(); },
    });
  }, [onAddTime]);

  // Browsers only allow audio after a gesture: the first click or key press here wakes it,
  // so a session restored after a reload can still chime.
  useEffect(() => {
    const wake = () => unlock();
    window.addEventListener('pointerdown', wake, { once: true });
    window.addEventListener('keydown', wake, { once: true });
    return () => {
      window.removeEventListener('pointerdown', wake);
      window.removeEventListener('keydown', wake);
    };
  }, []);

  const running = t.status === 'running';
  const busy = running || t.status === 'paused';
  const toggleRun = useCallback(() => {
    unlock();
    if (getTimer().status === 'running') pause();
    else start();
  }, []);

  // Reset mid-session asks twice (Stillpoint: press again within 3 s).
  const [resetArmed, setResetArmed] = useState(false);
  useEffect(() => {
    if (!resetArmed) return undefined;
    const id = setTimeout(() => setResetArmed(false), 3000);
    return () => clearTimeout(id);
  }, [resetArmed]);
  const safeReset = () => {
    const cur = getTimer();
    const worthAsking = inSession(cur) && cur.durationMs - remainingOf(cur) > 60000;
    if (worthAsking && !resetArmed) { setResetArmed(true); return; }
    setResetArmed(false);
    reset();
  };

  const toggleDigits = useCallback(() => setPrefs((p) => ({ ...p, digits: !p.digits })), [setPrefs]);
  const toggleSound = useCallback(() => {
    unlock();
    setPrefs((p) => {
      const silent = !Object.values(p.mix.levels).some((v) => v > 0);
      const enabled = !p.mix.enabled;
      return { ...p, mix: { ...p.mix, enabled, ...(enabled && silent ? { levels: { ...DEFAULT_MIX.levels } } : null) } };
    });
    if (getTimer().status !== 'running') preview(); // turning it on while idle: hear it for a moment
  }, [setPrefs]);

  // Keyboard: Space start/pause, N park, D digits, M sound (never while typing or in a dialog).
  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      const el = e.target instanceof Element ? e.target : null;
      if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const k = e.key.toLowerCase();
      if (k === ' ') {
        if (el?.closest('button, a, summary')) return; // let Space press the focused control
        e.preventDefault();
        toggleRun();
      } else if (k === 'n') {
        e.preventDefault();
        parkRef.current?.focus();
      } else if (k === 'd') toggleDigits();
      else if (k === 'm') toggleSound();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleRun, toggleDigits, toggleSound]);

  const reviewParked = () => {
    setListOpen(true);
    requestAnimationFrame(() => document.getElementById('parking-lot')?.scrollIntoView({ block: 'nearest' }));
  };

  const today = log[ymd()];
  const parkedThisRound = t.sid ? notes.filter((n) => n.sid === t.sid).length : 0;
  const openThisRound = t.sid ? notes.filter((n) => n.sid === t.sid && isOpen(n)).length : 0;
  const minutes = Math.round(t.durationMs / 60000);

  return (
    <div className="flex flex-col md:h-full min-h-0">
      <PageHeader kicker="Focus" title="Stillpoint">
        <div className="chip pointer-events-none tabular" title="Focus sessions finished today">
          {today ? `${today.count} session${today.count > 1 ? 's' : ''} · ${today.min} min today` : 'No sessions yet today'}
        </div>
      </PageHeader>

      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_320px] lg:grid-cols-[minmax(0,1fr)_360px] md:flex-1 md:min-h-0 anim-rise">
        <section className="sys-window px-4 py-5 sm:px-8 flex flex-col items-center justify-center-safe gap-3 min-w-0 md:min-h-0 md:overflow-y-auto scroll-thin [&>*]:shrink-0" aria-label="Focus timer">
          <input
            value={t.intent}
            onChange={(e) => setIntent(e.target.value)}
            maxLength={80}
            placeholder="What are you focusing on?"
            aria-label="What you are focusing on"
            autoComplete="off"
            className="input max-w-md text-center text-[15px]"
          />

          <Dial t={t} digits={prefs.digits} parkedThisRound={parkedThisRound} />

          {t.status === 'idle' && !t.onBreak && (
            <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Session length">
              {PRESETS.map((m) => (
                <button key={m} onClick={() => setMinutes(m)} data-on={m === minutes} aria-pressed={m === minutes} className="chip tabular min-w-12 justify-center">
                  {m}
                </button>
              ))}
            </div>
          )}

          {t.status === 'done' ? (
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => { unlock(); startBreak(); }} className="btn btn-sys h-11 px-6 text-[15px]"><Coffee size={17} /> 5 min break</button>
              <button onClick={() => { unlock(); again(); }} className="btn h-11"><Repeat size={15} /> Another round</button>
              {openThisRound > 0 && (
                <button onClick={reviewParked} className="btn h-11">Review {openThisRound} parked</button>
              )}
              <button onClick={reset} className="btn h-11 text-dim">New length</button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={toggleRun} className="btn btn-sys h-11 px-8 text-[15px] min-w-36">
                {running ? <><Pause size={17} /> Pause</> : <><Play size={17} /> {t.status === 'paused' ? 'Resume' : t.onBreak ? 'Start break' : 'Start'}</>}
              </button>
              {(busy || t.onBreak) && (
                <button onClick={safeReset} className={`btn h-11 ${resetArmed ? 'border-hard text-hard' : ''}`}>
                  {resetArmed ? 'Reset? Press again' : t.onBreak ? 'Skip break' : 'Reset'}
                </button>
              )}
            </div>
          )}

          <div className="hidden sm:flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1 text-[11.5px] text-faint" aria-label="Keyboard shortcuts">
            <span><kbd className="kbd">Space</kbd> start / pause</span>
            <span><kbd className="kbd">N</kbd> park a thought</span>
            <button onClick={toggleDigits} className="hover:text-dim"><kbd className="kbd">D</kbd> {prefs.digits ? 'hide' : 'show'} digits</button>
            <button onClick={toggleSound} className="hover:text-dim"><kbd className="kbd">M</kbd> sound {prefs.mix.enabled ? 'off' : 'on'}</button>
          </div>
          <button onClick={toggleDigits} className="sm:hidden text-xs text-faint">{prefs.digits ? 'Hide' : 'Show'} digits</button>
        </section>

        <div className="flex flex-col gap-4 min-w-0 md:min-h-0 md:overflow-y-auto scroll-thin">
          <ParkingLot t={t} notes={notes} setNotes={setNotes} listOpen={listOpen} setListOpen={setListOpen} inputRef={parkRef} />
          <SoundPanel prefs={prefs} setPrefs={setPrefs} running={running} onToggle={toggleSound} />
        </div>
      </div>
    </div>
  );
}
