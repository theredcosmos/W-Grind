import { useState } from 'react';
import { Loader2, Lock, Mail, User } from 'lucide-react';
import { API_URL } from '../lib/useProgress';

const Field = ({ icon: Icon, ...props }) => (
  <div className="relative">
    <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" />
    <input {...props} className="input h-11 pl-9" />
  </div>
);

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleGoogle = async () => {
    setError('');
    try {
      // Firebase is heavy; only load it if someone actually clicks this.
      const [{ signInWithPopup }, { auth, provider }] = await Promise.all([import('firebase/auth'), import('../firebase')]);
      if (!auth) throw new Error('Google sign-in is not configured yet.');
      const result = await signInWithPopup(auth, provider);
      if (result.user.displayName) onLogin(result.user.displayName.replace(/[^a-zA-Z0-9]/g, ''));
    } catch (err) {
      setError(err.message?.includes('configured') ? err.message : 'Google sign-in failed.');
    }
  };

  const localAuth = (name) => {
    const key = `user_${name}`;
    const stored = localStorage.getItem(key);
    if (mode === 'signup') {
      if (stored) throw new Error('That hunter name already exists on this device. Sign in instead.');
      localStorage.setItem(key, password);
      if (email.trim()) localStorage.setItem(`${key}_email`, email.trim());
      return name;
    }
    if (!stored) throw new Error('Hunter not found on this device. Create an account first.');
    if (stored !== password) throw new Error('Incorrect password.');
    return name;
  };

  const submit = async (e) => {
    e.preventDefault();
    const name = username.trim();
    if (!name || !password) return;
    setBusy(true);
    setError('');
    try {
      let res;
      try {
        res = await fetch(`${API_URL}${mode === 'signin' ? '/login' : '/register'}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name, password, ...(mode === 'signup' ? { email: email.trim() } : {}) }),
        });
      } catch {
        // No backend reachable: fall back to this browser.
        onLogin(localAuth(name));
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Authentication failed.');
      onLogin(data.username || name);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full grid place-items-center px-4 py-10">
      <div className="w-full max-w-[420px] anim-pop">
        <div className="text-center mb-8">
          <div className="inline-grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-sys-deep to-mana shadow-[0_0_40px_-8px_rgb(76_194_255/0.8)] mb-5">
            <span className="sys-heading text-white text-xl">W</span>
          </div>
          <div className="sys-label mb-2">Notification</div>
          <h1 className="sys-heading text-2xl leading-snug">
            You have acquired the qualifications<br />to be a <span className="text-sys glow-text">Player</span>.
          </h1>
          <p className="text-dim text-sm mt-3">519 problems · Blind 75 · NeetCode 150 · Striver SDE</p>
        </div>

        <div className="sys-window p-6">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-void/60 border border-line mb-5">
            {[['signin', 'Sign in'], ['signup', 'Create account']].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => { setMode(k); setError(''); }}
                className={`h-9 rounded-lg text-sm font-semibold transition-colors ${mode === k ? 'bg-panel-2 text-white shadow-[inset_0_0_0_1px_var(--color-line-strong)]' : 'text-dim hover:text-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <Field icon={User} placeholder="Hunter name" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
            {mode === 'signup' && (
              <Field icon={Mail} type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            )}
            <Field
              icon={Lock}
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
            />
            {error && <p className="text-[13px] text-hard bg-hard/10 border border-hard/25 rounded-lg px-3 py-2">{error}</p>}
            <button type="submit" disabled={busy} className="btn btn-sys w-full h-11 text-[14px]">
              {busy ? <Loader2 size={16} className="animate-spin" /> : mode === 'signin' ? 'Accept & Enter' : 'Awaken'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5 text-[11px] text-faint uppercase tracking-wider">
            <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
          </div>
          <button type="button" onClick={handleGoogle} className="btn w-full h-11">
            <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
