import { useCallback, useEffect, useState } from 'react';

/*
 * The fight companion: a small always-on-top window (Document Picture-in-Picture) that keeps the
 * timer, interview phase and hints beside LeetCode. Chrome and Edge on desktop only; elsewhere
 * `supported` is false and the caller opens LeetCode in a normal tab instead.
 *
 * Browsers allow one window per click: opening the companion uses up the click, so LeetCode is
 * opened from a button inside the companion.
 */
export const companionSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;

// The companion has no stylesheet of its own: copy the app's styles and theme attributes into it.
const adoptStyles = (doc) => {
  for (const node of document.head.querySelectorAll('style, link[rel="stylesheet"]')) {
    doc.head.appendChild(node.cloneNode(true));
  }
};
const mirrorRoot = (doc) => {
  const sync = () => {
    for (const { name } of [...doc.documentElement.attributes]) doc.documentElement.removeAttribute(name);
    for (const { name, value } of document.documentElement.attributes) doc.documentElement.setAttribute(name, value);
  };
  sync();
  const observer = new MutationObserver(sync);
  observer.observe(document.documentElement, { attributes: true });
  return observer;
};

export function useCompanion() {
  const [win, setWin] = useState(null);

  /** Must run inside a click handler: the browser only opens it in response to a user gesture. */
  const open = useCallback(() => {
    if (!companionSupported) return Promise.resolve(null);
    const existing = window.documentPictureInPicture.window;
    if (existing) { setWin(existing); return Promise.resolve(existing); }
    // preferInitialWindowPlacement: the browser otherwise reuses the window's last size, and since
    // it usually closes as the small pill, the next fight would open the full panel squeezed into it.
    return window.documentPictureInPicture.requestWindow({ width: 380, height: 600, preferInitialWindowPlacement: true })
      .then((w) => {
        w.document.title = 'W-Grind · fight';
        adoptStyles(w.document);
        w.document.body.style.overflow = 'hidden'; // the companion scrolls inside its own panel
        const observer = mirrorRoot(w.document);
        w.addEventListener('pagehide', () => { observer.disconnect(); setWin(null); }, { once: true });
        setWin(w);
        return w;
      })
      .catch(() => null);
  }, []);

  const close = useCallback(() => window.documentPictureInPicture?.window?.close(), []);

  // Closing the app tab takes the companion with it (the browser does this too; be explicit).
  useEffect(() => () => window.documentPictureInPicture?.window?.close(), []);

  return { win, open, close };
}
