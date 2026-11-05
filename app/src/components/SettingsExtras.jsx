import { useState } from 'react';
import { BellRing, Check, Download, Eye, EyeOff, KeyRound, Loader2, RefreshCw } from 'lucide-react';
import { cloudChangePassword, offlineChangePassword } from '../lib/session';

const MIN_PASSWORD = 8; // same rule as sign-up (server/auth.js)

const ago = (ms) => {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return `${Math.round(s / 3600)} h ago`;
};

const Switch = ({ on, onChange, label }) => (
  <button
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={() => onChange(!on)}
    className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-sys' : 'bg-ink/15'}`}
  >
    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-panel shadow transition-transform duration-200 ${on ? 'translate-x-4' : ''}`} />
  </button>
);

export function LeetCodeSettings({ lc }) {
  const [draft, setDraft] = useState(lc.lcUser);
  const s = lc.status;
  const dirty = draft.trim() !== lc.lcUser;
  return (
    <div className="card px-4 py-3.5">
      <div className="text-sm font-semibold">LeetCode auto-import</div>
      <div className="text-xs text-dim mt-0.5 mb-3">
        Ticks problems you solve on LeetCode. LeetCode only shares your latest 20 accepted solves, so new solves sync on
        their own; older ones need a one-time manual tick.
      </div>
      {!lc.available ? (
        <div className="text-xs text-gold">Needs a signed-in (online) account. Offline profiles can't reach LeetCode.</div>
      ) : (
        <>
          <form
            onSubmit={(e) => { e.preventDefault(); lc.setLcUser(draft); }}
            className="flex gap-2"
          >
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Your LeetCode username" className="input" autoComplete="off" spellCheck={false} />
            {dirty ? (
              <button type="submit" className="btn btn-sys shrink-0">Save</button>
            ) : (
              <button type="button" onClick={() => lc.sync()} disabled={!lc.lcUser || s.state === 'syncing'} className="btn shrink-0">
                {s.state === 'syncing' ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Sync now
              </button>
            )}
          </form>
          <div className="text-[11.5px] mt-2 min-h-4" role="status">
            {s.state === 'ok' && <span className="text-dim">Synced {ago(s.at)} · checked {s.seen} recent solves · {s.added ? `${s.added} new` : 'nothing new'}</span>}
            {s.state === 'error' && <span className="text-hard">{s.message}</span>}
            {s.state === 'idle' && lc.lcUser && <span className="text-faint">Syncs when you open the app and every 15 minutes.</span>}
          </div>
        </>
      )}
    </div>
  );
}

export function ReminderSettings({ reminder, setReminder, supported }) {
  const [error, setError] = useState('');
  return (
    <div className="card px-4 py-3.5">
      <div className="flex items-center gap-4">
        <BellRing size={17} className="text-sys shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Daily reminder</div>
          <div className="text-xs text-dim">Nudges you if today's training isn't done. Works while the app is open or installed.</div>
        </div>
        {supported ? (
          <Switch
            on={reminder.enabled}
            label="Daily reminder"
            onChange={async (on) => {
              setError('');
              const ok = await setReminder({ enabled: on });
              if (on && !ok) setError('Notifications are blocked for this site. Allow them in your browser settings.');
            }}
          />
        ) : (
          <span className="text-xs text-faint">Not supported here</span>
        )}
      </div>
      {reminder.enabled && (
        <label className="flex items-center gap-3 mt-3 text-xs text-dim">
          Remind me at
          <input type="time" value={reminder.time} onChange={(e) => setReminder({ time: e.target.value })} className="input h-8 w-28 text-sm" />
        </label>
      )}
      {error && <div className="text-xs text-hard mt-2">{error}</div>}
    </div>
  );
}

export function InstallSettings({ install }) {
  if (install.installed) return null;
  return (
    <div className="card px-4 py-3.5 flex items-center gap-4">
      <Download size={17} className="text-sys shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold">Install W-Grind</div>
        <div className="text-xs text-dim">
          {install.canInstall
            ? 'Opens in its own window, works offline, and can show reminders.'
            : install.ios
              ? 'On iPhone/iPad: tap Share, then “Add to Home Screen”.'
              : 'Use your browser menu → “Install app” (shown once the site has loaded over HTTPS).'}
        </div>
      </div>
      {install.canInstall && <button onClick={install.install} className="btn btn-sys shrink-0">Install</button>}
    </div>
  );
}

/** Change password for the signed-in account: cloud accounts on the server, offline profiles on this device. */
export function PasswordSettings({ account }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [state, setState] = useState({ busy: false, error: '', done: false });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const tooShort = form.next.length > 0 && form.next.length < MIN_PASSWORD;
  const mismatch = form.confirm.length > 0 && form.confirm !== form.next;
  const ready = form.current && form.next.length >= MIN_PASSWORD && form.confirm === form.next;

  const submit = async (e) => {
    e.preventDefault();
    if (!ready || state.busy) return;
    setState({ busy: true, error: '', done: false });
    try {
      if (account.mode === 'cloud') await cloudChangePassword(account.token, form.current, form.next);
      else await offlineChangePassword(account.username, form.current, form.next);
      setForm({ current: '', next: '', confirm: '' });
      setState({ busy: false, error: '', done: true });
      setOpen(false);
    } catch (err) {
      setState({ busy: false, error: err.message || 'Could not change the password.', done: false });
    }
  };

  const field = (k, label, autoComplete, hint) => (
    <label className="block">
      <span className="text-xs text-dim">{label}</span>
      <input
        type={show ? 'text' : 'password'}
        value={form[k]}
        onChange={set(k)}
        autoComplete={autoComplete}
        className="input mt-1"
      />
      {hint && <span className="block text-[11.5px] text-hard mt-1">{hint}</span>}
    </label>
  );

  return (
    <div className="card px-4 py-3">
      <div className="flex items-center gap-3">
        <KeyRound size={17} className="text-sys shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">Password</div>
          <div className="text-xs text-dim">
            {state.done ? <span className="text-easy inline-flex items-center gap-1"><Check size={12} /> Password changed.</span>
              : account.mode === 'cloud' ? 'Change the password you sign in with.' : 'Change the password of this offline profile (this device only).'}
          </div>
        </div>
        <button onClick={() => { setOpen((o) => !o); setState((s) => ({ ...s, error: '', done: false })); }} className="btn h-9 text-[13px]">
          {open ? 'Cancel' : 'Change'}
        </button>
      </div>
      {open && (
        <form onSubmit={submit} className="mt-3 space-y-2.5">
          {field('current', 'Current password', 'current-password')}
          {field('next', 'New password', 'new-password', tooShort ? `At least ${MIN_PASSWORD} characters` : '')}
          {field('confirm', 'Repeat new password', 'new-password', mismatch ? "Doesn't match the new password" : '')}
          {state.error && <p className="text-[12.5px] text-hard">{state.error}</p>}
          <div className="flex items-center gap-2 pt-1">
            <button type="submit" disabled={!ready || state.busy} className="btn btn-sys h-9 text-[13px] disabled:opacity-50">
              {state.busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save new password
            </button>
            <button type="button" onClick={() => setShow((v) => !v)} className="btn h-9 text-[13px]" aria-label={show ? 'Hide passwords' : 'Show passwords'}>
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
