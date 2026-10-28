import { useState } from 'react';
import { BellRing, Download, Loader2, RefreshCw } from 'lucide-react';

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
