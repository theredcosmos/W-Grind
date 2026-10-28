import { useEffect, useRef } from 'react';

/**
 * Minimal dialog behaviour for overlays: move focus into the dialog when it opens,
 * keep Tab inside it, and put focus back where it was when it closes.
 */
export function useDialog() {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const node = ref.current;
    const focusables = () => [...node.querySelectorAll('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])')]
      .filter((el) => !el.disabled && el.offsetParent !== null);
    (focusables()[0] || node).focus({ preventScroll: true });

    const onKey = (e) => {
      if (e.key !== 'Tab' || !node.contains(document.activeElement)) return;
      const list = focusables();
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    node.addEventListener('keydown', onKey);
    return () => {
      node.removeEventListener('keydown', onKey);
      if (previous && document.contains(previous)) previous.focus({ preventScroll: true });
    };
  }, []);
  return ref;
}
