import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, Cloud, CloudOff, LogOut, X } from 'lucide-react';
import { THEMES } from '../lib/themes';
import { useDialog } from '../lib/useDialog';
import { InstallSettings, LeetCodeSettings, ReminderSettings } from './SettingsExtras';

// Miniature of the theme: its background, a panel, its accent and its heading font.
const Preview = ({ t }) => (
  <div className="relative h-[92px] rounded-lg overflow-hidden p-3 flex flex-col justify-between" style={{ background: t.bg }}>
    <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full" style={{ background: `radial-gradient(closest-side, ${t.accent}55, transparent)` }} />
    <div className="relative text-[22px] leading-none" style={{ fontFamily: t.font, color: t.ink }}>Aa</div>
    <div className="relative rounded-md px-2 py-1.5 flex items-center gap-2" style={{ background: t.panel, boxShadow: `inset 0 0 0 1px ${t.ink}14` }}>
      <span className="h-1.5 flex-1 rounded-full" style={{ background: `${t.ink}1f` }}>
        <span className="block h-full w-3/5 rounded-full" style={{ background: t.accent }} />
      </span>
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.accent }} />
    </div>
  </div>
);

const Switch = ({ on, onChange, label }) => (
  <button
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={() => onChange(!on)}
    className={`relative w-10 h-6 rounded-full transition-colors ${on ? 'bg-sys' : 'bg-ink/15'}`}
  >
    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-panel shadow transition-transform duration-200 ${on ? 'translate-x-4' : ''}`} />
  </button>
);

export default function ThemePicker({ theme, onChange, motion, onMotion, onClose, account, lc, reminder, install }) {
  const dialogRef = useDialog();
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-void/70 anim-fade" onClick={onClose} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Settings" tabIndex={-1} className="sys-window anim-drop relative w-full max-w-[640px] max-h-[92dvh] overflow-y-auto scroll-thin p-5 sm:p-6">
        <div className="flex items-center justify-between mb-1">
          <span className="sys-label">Settings</span>
          <button onClick={onClose} className="grid place-items-center w-8 h-8 rounded-lg text-dim hover:text-ink hover:bg-ink/5" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <h2 className="sys-heading text-xl mb-4">Choose your world</h2>

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

        <div className="mt-5 flex items-center gap-4 card px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">Ambient motion</div>
            <div className="text-xs text-dim">Drifting petals, waves, rain and lights. Turn off for a completely still screen.</div>
          </div>
          <Switch on={motion} onChange={onMotion} label="Ambient motion" />
        </div>

        <div className="mt-6 pt-5 border-t border-line space-y-3">
          <div className="sys-label">Training</div>
          {lc && <LeetCodeSettings lc={lc} />}
          {reminder && <ReminderSettings {...reminder} />}
          {install && <InstallSettings install={install} />}
        </div>

        {account && (
          <div className="mt-5 pt-5 border-t border-line flex items-center gap-3">
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
