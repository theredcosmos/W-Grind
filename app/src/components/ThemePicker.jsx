import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, Cloud, CloudOff, LogOut, X } from 'lucide-react';
import { THEMES } from '../lib/themes';

// Miniature of the app drawn in the theme's own colours.
const Preview = ({ t }) => (
  <div className="h-[86px] rounded-lg p-2.5 flex gap-2" style={{ background: t.bg }}>
    <div className="w-5 rounded-md flex flex-col gap-1.5 pt-1.5 items-center" style={{ background: t.panel }}>
      <span className="w-2.5 h-2.5 rounded-sm" style={{ background: t.accent }} />
      <span className="w-2 h-1 rounded-full opacity-40" style={{ background: t.ink }} />
      <span className="w-2 h-1 rounded-full opacity-40" style={{ background: t.ink }} />
    </div>
    <div className="flex-1 rounded-md p-2 flex flex-col gap-1.5" style={{ background: t.panel }}>
      <span className="h-1.5 w-1/2 rounded-full" style={{ background: t.ink, opacity: 0.85 }} />
      <span className="h-1.5 w-3/4 rounded-full" style={{ background: t.ink, opacity: 0.3 }} />
      <span className="mt-auto h-1.5 rounded-full" style={{ background: `${t.ink}22` }}>
        <span className="block h-full w-3/5 rounded-full" style={{ background: t.accent }} />
      </span>
    </div>
  </div>
);

export function ThemeGrid({ theme, onChange }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {THEMES.map((t) => {
        const on = t.id === theme;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            aria-pressed={on}
            className={`text-left rounded-xl border p-2 transition-colors ${on ? 'border-sys bg-sys/[0.06]' : 'border-line hover:border-line-strong'}`}
          >
            <Preview t={t} />
            <div className="flex items-center gap-2 px-1 pt-2 pb-0.5">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-ink truncate">{t.name}</div>
                <div className="text-[11px] text-faint truncate">{t.note}</div>
              </div>
              {on && <Check size={16} className="text-sys shrink-0" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** Compact swatch row (login screen). */
export function ThemeDots({ theme, onChange }) {
  return (
    <div className="flex items-center justify-center gap-2.5">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          title={t.name}
          aria-label={`${t.name} theme`}
          aria-pressed={t.id === theme}
          className={`w-7 h-7 rounded-full grid place-items-center transition-transform hover:scale-110 ${t.id === theme ? 'ring-2 ring-sys ring-offset-2 ring-offset-void' : ''}`}
          style={{ background: t.bg, boxShadow: `inset 0 0 0 1px ${t.ink}33` }}
        >
          <span className="w-3 h-3 rounded-full" style={{ background: t.accent }} />
        </button>
      ))}
    </div>
  );
}

export default function ThemePicker({ theme, onChange, onClose, account }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-void/70 anim-fade" onClick={onClose} />
      <div className="sys-window anim-drop relative w-full max-w-[620px] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-1">
          <span className="sys-label">Settings</span>
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-lg text-dim hover:text-ink hover:bg-ink/5" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <h2 className="sys-heading text-xl mb-1">Choose a theme</h2>
        <p className="text-sm text-dim mb-5">Saved on this device. Every theme is the same layout, just different colours and type.</p>
        <ThemeGrid theme={theme} onChange={onChange} />

        {account && (
          <div className="mt-6 pt-5 border-t border-line flex items-center gap-3">
            <div className={`grid place-items-center w-9 h-9 rounded-lg ${account.mode === 'cloud' ? 'bg-sys/10 text-sys' : 'bg-gold/10 text-gold'}`}>
              {account.mode === 'cloud' ? <Cloud size={17} /> : <CloudOff size={17} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate">{account.username}</div>
              <div className="text-xs text-dim">
                {account.mode === 'cloud' ? 'Signed in · progress syncs to the server' : 'Offline profile · saved on this device only'}
              </div>
            </div>
            <button onClick={account.onSignOut} className="btn hover:text-hard"><LogOut size={15} /> Sign out</button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
