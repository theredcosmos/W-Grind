import { useState } from 'react';
import { CloudOff, Eye, EyeOff, Info, Loader2, Lock, Mail, User } from 'lucide-react';
import {
  NetworkError, cloudGoogle, cloudSignIn, cloudSignUp, googleEnabled, lastUsername, offlineSignIn, offlineSignUp,
} from '../lib/session';
import { ThemeDots } from './ThemePicker';

const NAME_RE = /^[a-zA-Z0-9_-]{3,24}$/;
const MIN_PASSWORD = 8;

const Field = ({ icon: Icon, right, hint, error, ...props }) => (
  <div>
    <div className="relative">
      <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
      <input {...props} aria-invalid={!!error} className={`input h-11 pl-9 ${right ? 'pr-11' : ''} ${error ? 'border-hard/60' : ''}`} />
      {right}
    </div>
    {(error || hint) && <p className={`text-[11.5px] mt-1.5 px-1 ${error ? 'text-hard' : 'text-faint'}`}>{error || hint}</p>}
  </div>
);

export default function Login({ onLogin, notice, theme, onTheme }) {
  const [mode, setMode] = useState('signin');
  const [username, setUsername] = useState(lastUsername);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [caps, setCaps] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false); // server unreachable: offer a device-only profile
  const [busy, setBusy] = useState(false);

  const signup = mode === 'signup';
  const name = username.trim();
  const nameError = signup && touched && !NAME_RE.test(name) ? '3–24 letters, numbers, _ or -' : '';
  const pwError = signup && touched && password.length < MIN_PASSWORD ? `At least ${MIN_PASSWORD} characters` : '';

  const switchMode = (m) => {
    setMode(m);
    setError('');
    setOffline(false);
    setTouched(false);
  };

  const run = async (fn) => {
    setBusy(true);
    setError('');
    try {
      onLogin(await fn());
    } catch (err) {
      if (err instanceof NetworkError) setOffline(true);
      setError(err.code?.startsWith('auth/') ? 'Google sign-in was cancelled or failed.' : err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!name || !password) return;
    if (signup && (!NAME_RE.test(name) || password.length < MIN_PASSWORD)) return;
    run(() => (signup ? cloudSignUp(name, password, email.trim()) : cloudSignIn(name, password)));
  };

  const continueOffline = () =>
    run(() => (signup ? offlineSignUp(name, password, email.trim()) : offlineSignIn(name, password)));

  const google = () => run(async () => {
    // Firebase is heavy; it only loads when someone clicks this.
    const [{ signInWithPopup }, { auth, provider }] = await Promise.all([import('firebase/auth'), import('../firebase')]);
    const result = await signInWithPopup(auth, provider);
    return cloudGoogle(await result.user.getIdToken());
  });

  const onKey = (e) => setCaps(e.getModifierState?.('CapsLock') ?? false);

  return (
    <div className="min-h-full grid place-items-center px-4 py-10">
      <div className="w-full max-w-[420px] anim-pop">
        <div className="text-center mb-7">
          <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sys-deep to-mana glow-md mb-5">
            <span className="sys-heading text-on-accent text-xl">W</span>
          </div>
          <div className="sys-label mb-2">Notification</div>
          <h1 className="sys-heading text-2xl leading-snug">
            You have acquired the qualifications<br />to be a <span className="text-sys glow-text">Player</span>.
          </h1>
          <p className="text-dim text-sm mt-3">519 problems · Blind 75 · NeetCode 150 · Striver SDE</p>
        </div>

        <div className="sys-window p-6">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-ink/[0.04] border border-line mb-5" role="tablist">
            {[['signin', 'Sign in'], ['signup', 'Create account']].map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={mode === k}
                onClick={() => switchMode(k)}
                className={`h-9 rounded-lg text-sm font-semibold transition-colors ${mode === k ? 'bg-panel text-hi shadow-[inset_0_0_0_1px_var(--color-line-strong)]' : 'text-dim hover:text-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {notice && (
            <div className="flex gap-2 text-[12.5px] text-sys bg-sys/[0.08] border border-sys/25 rounded-lg px-3 py-2.5 mb-4">
              <Info size={15} className="shrink-0 mt-px" /> {notice}
            </div>
          )}

          <form onSubmit={submit} className="space-y-3" noValidate>
            <Field
              icon={User}
              placeholder="Hunter name"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setOffline(false); }}
              autoComplete="username"
              autoFocus={!username}
              hint={signup && !nameError ? 'This is how the System will address you.' : ''}
              error={nameError}
            />
            {signup && (
              <Field icon={Mail} type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            )}
            <Field
              icon={Lock}
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setOffline(false); }}
              onKeyUp={onKey}
              onKeyDown={onKey}
              autoComplete={signup ? 'new-password' : 'current-password'}
              autoFocus={!!username}
              error={pwError}
              hint={caps ? 'Caps Lock is on' : ''}
              right={(
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 grid place-items-center w-8 h-8 rounded-lg text-faint hover:text-ink"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            />

            {error && (
              <div className="text-[13px] text-hard bg-hard/10 border border-hard/25 rounded-lg px-3 py-2.5" role="alert">
                {error}
                {offline && (
                  <div className="mt-2 text-dim">
                    You can keep going with a profile saved only on this device. It won't sync until you sign in to the server.
                  </div>
                )}
              </div>
            )}

            {offline ? (
              <button type="button" onClick={continueOffline} disabled={busy} className="btn w-full h-11 text-[14px]">
                {busy ? <Loader2 size={16} className="animate-spin" /> : <><CloudOff size={16} /> Continue offline on this device</>}
              </button>
            ) : (
              <button type="submit" disabled={busy} className="btn btn-sys w-full h-11 text-[14px]">
                {busy ? <Loader2 size={16} className="animate-spin" /> : signup ? 'Awaken' : 'Accept & Enter'}
              </button>
            )}
          </form>

          {googleEnabled && (
            <>
              <div className="flex items-center gap-3 my-5 text-[11px] text-faint uppercase tracking-wider">
                <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
              </div>
              <button type="button" onClick={google} disabled={busy} className="btn w-full h-11">
                <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>

        <div className="mt-6">
          <ThemeDots theme={theme} onChange={onTheme} />
        </div>
      </div>
    </div>
  );
}
