import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/*
 * 3D card carousel shared by the guild hall and the pattern decks.
 * - Cards follow the pointer while dragging (DOM updated directly, no React renders mid-drag)
 *   and snap to the nearest card on release.
 * - Trackpad / mouse-wheel scrolling steps one card at a time.
 * - Cards that were off-screen fade in at their destination instead of sweeping across the deck.
 */

const VISIBLE = 2; // cards shown on each side of the centre

// Signed distance from the active card, wrapping around the deck.
const offsetOf = (i, active, len) => {
  const half = Math.floor(len / 2);
  return ((((i - active) % len) + len + half) % len) - half;
};

const look = (pos) => {
  const a = Math.min(Math.abs(pos), 3);
  return {
    transform: `translateX(calc(${pos} * var(--step))) rotateY(${pos * -24}deg) scale(${1 - Math.min(a, 1) * 0.14})`,
    opacity: a > VISIBLE + 0.5 ? 0 : 1,
    '--dim': Math.min(a, VISIBLE) * 0.32,
    zIndex: 10 - Math.round(a),
  };
};

const Slot = memo(function Slot({ index, offset, prevOffset, label, onPick, children }) {
  const center = offset === 0;
  const hidden = Math.abs(offset) > VISIBLE;
  // Came from off-screen: appear in place rather than flying across the visible cards.
  const teleported = Math.abs(prevOffset) > VISIBLE && !hidden;
  return (
    <button
      type="button"
      data-slot={index}
      data-offset={offset}
      onClick={() => onPick(index, offset)}
      tabIndex={center ? 0 : -1}
      aria-hidden={hidden}
      aria-label={center ? `${label} (open)` : label}
      className={`deck-card ${center ? 'is-center' : ''} ${Math.abs(offset) === VISIBLE ? 'far' : ''} ${teleported ? 'teleport' : ''}`}
      style={{ ...look(offset), pointerEvents: hidden ? 'none' : 'auto' }}
    >
      {children}
    </button>
  );
});

export default function CardDeck({ items, active, onActive, onOpen, accent, labelOf, renderCard, itemName = 'card' }) {
  const len = items.length;
  const deckRef = useRef(null);
  const drag = useRef(null);
  const draggedAt = useRef(0); // clicks right after a drag must not open a card (touch delays the click)
  const wheel = useRef({ acc: 0, lockedUntil: 0 });
  const [prevActive, setPrevActive] = useState(active);
  const [lastActive, setLastActive] = useState(active);

  // Remember where we came from so "teleporting" cards can be detected during render.
  if (active !== lastActive) {
    setPrevActive(lastActive);
    setLastActive(active);
  }

  const go = useCallback((delta) => onActive((a) => (((a + delta) % len) + len) % len), [onActive, len]);

  const onPick = useCallback((index, offset) => {
    if (performance.now() - draggedAt.current < 300) return;
    if (offset === 0) onOpen(index);
    else onActive(index);
  }, [onOpen, onActive]);

  // ---- dragging: move cards directly, then snap
  const cards = () => [...(deckRef.current?.querySelectorAll('[data-slot]') || [])];

  const onPointerDown = (e) => {
    if (e.button !== 0 || e.target.closest('.deck-nav')) return;
    const step = parseFloat(getComputedStyle(deckRef.current).getPropertyValue('--step')) || 235;
    drag.current = { x: e.clientX, id: e.pointerId, step, moved: false };
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) < 6) return;
    if (!d.moved) {
      d.moved = true;
      try { deckRef.current.setPointerCapture(d.id); } catch { /* pointer already gone; drag still works without capture */ }
      deckRef.current.classList.add('dragging');
    }
    const shift = dx / d.step;
    for (const el of cards()) {
      const pos = Number(el.dataset.offset) + shift;
      const s = look(pos);
      el.style.transform = s.transform;
      el.style.opacity = s.opacity;
      el.style.setProperty('--dim', s['--dim']);
      el.style.zIndex = s.zIndex;
    }
  };

  const endDrag = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    draggedAt.current = performance.now();
    deckRef.current.classList.remove('dragging');
    if (deckRef.current.hasPointerCapture?.(d.id)) deckRef.current.releasePointerCapture(d.id);
    const steps = e.type === 'pointercancel' ? 0 : Math.round(-(e.clientX - d.x) / d.step);
    // Hand the cards back to React's positions; the CSS transition animates the snap.
    for (const el of cards()) {
      const target = offsetOf(Number(el.dataset.slot), (active + steps + len) % len, len);
      const s = look(target);
      el.style.transform = s.transform;
      el.style.opacity = s.opacity;
      el.style.setProperty('--dim', s['--dim']);
      el.style.zIndex = s.zIndex;
    }
    if (steps) go(steps);
  };

  // ---- trackpad / wheel: one card per gesture tick
  const onWheel = (e) => {
    const w = wheel.current;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const now = performance.now();
    if (now < w.lockedUntil) return;
    w.acc += delta;
    if (Math.abs(w.acc) > 45) {
      go(w.acc > 0 ? 1 : -1);
      w.acc = 0;
      w.lockedUntil = now + 320;
    }
  };

  // Reset a half-finished drag if the window loses focus mid-gesture.
  useEffect(() => {
    const cancel = () => { drag.current = null; deckRef.current?.classList.remove('dragging'); };
    window.addEventListener('blur', cancel);
    return () => window.removeEventListener('blur', cancel);
  }, []);

  return (
    <>
      <div
        ref={deckRef}
        className="deck"
        style={{ '--accent': accent }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onWheel={onWheel}
      >
        {items.map((item, i) => {
          const offset = offsetOf(i, active, len);
          return (
            <Slot
              key={labelOf(item)}
              index={i}
              offset={offset}
              prevOffset={offsetOf(i, prevActive, len)}
              label={labelOf(item)}
              onPick={onPick}
            >
              {renderCard(item, offset === 0)}
            </Slot>
          );
        })}
        <button onClick={() => go(-1)} className="deck-nav left-0 md:left-4" aria-label={`Previous ${itemName}`}><ChevronLeft size={22} /></button>
        <button onClick={() => go(1)} className="deck-nav right-0 md:right-4" aria-label={`Next ${itemName}`}><ChevronRight size={22} /></button>
      </div>
      <div className="flex items-center justify-center gap-1.5 mt-2 shrink-0">
        {items.map((item, i) => (
          <button
            key={labelOf(item)}
            onClick={() => onActive(i)}
            aria-label={labelOf(item)}
            title={labelOf(item)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{ width: i === active ? 22 : 6, background: i === active ? accent : 'var(--color-line-strong)' }}
          />
        ))}
      </div>
      <p className="text-center text-[11.5px] text-faint mt-3 hidden md:block shrink-0">
        Drag, scroll or <span className="kbd">←</span> <span className="kbd">→</span> to browse · click the centre card to enter
      </p>
    </>
  );
}
