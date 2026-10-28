import { useEffect, useState } from 'react';

// Captures the browser's "install this app" prompt so Settings can offer an Install button.
let deferred = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

export function initInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
  // Service worker only in production builds, so development never serves stale cached files.
  if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
}

export function useInstall() {
  const [, force] = useState(0);
  useEffect(() => {
    const fn = () => force((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  const installed = typeof window !== 'undefined' && window.matchMedia?.('(display-mode: standalone)').matches;
  const ios = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  return {
    canInstall: !!deferred,
    installed,
    ios,
    install: async () => {
      if (!deferred) return;
      deferred.prompt();
      await deferred.userChoice.catch(() => {});
      deferred = null;
      emit();
    },
  };
}
