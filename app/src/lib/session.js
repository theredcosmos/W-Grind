// Login session + offline (this-device-only) accounts.
//   session = { username, token, mode: 'cloud' | 'offline' }
// Offline passwords are stored as salted PBKDF2 hashes, never in plain text.

const SESSION_KEY = 'session';
const ACCOUNTS_KEY = 'offlineAccounts';
const ITERATIONS = 210000;

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const googleEnabled = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);

const readJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

export const loadSession = () => {
  const s = readJson(SESSION_KEY, null);
  return s?.username && (s.mode === 'offline' || s.token) ? s : null;
};

export const saveSession = (s) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  localStorage.setItem('lastUsername', s.username);
  localStorage.removeItem('username'); // pre-session builds stored only this
};

export const clearSession = () => localStorage.removeItem(SESSION_KEY);

/** Username from a build that had no real sessions; the user must sign in once more. */
export const legacyUsername = () => localStorage.getItem('username') || '';

export const lastUsername = () => localStorage.getItem('lastUsername') || legacyUsername();

// ---------- Cloud ----------

export class NetworkError extends Error {}

const post = async (path, body) => {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new NetworkError("Can't reach the server.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status}).`);
  return { username: data.username, token: data.token, mode: 'cloud' };
};

export const cloudSignIn = (username, password) => post('/login', { username, password });
export const cloudSignUp = (username, password, email) => post('/register', { username, password, email });
export const cloudGoogle = (idToken) => post('/google-auth', { idToken });

// ---------- Offline ----------

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));

const derive = async (password, salt) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
  return toHex(bits);
};

export const offlineSignUp = async (username, password, email) => {
  const accounts = readJson(ACCOUNTS_KEY, {});
  const id = username.toLowerCase();
  if (accounts[id] || localStorage.getItem(`user_${username}`)) {
    throw new Error('That hunter name already exists on this device. Sign in instead.');
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  accounts[id] = { username, salt: toHex(salt), hash: await derive(password, salt), email: email || undefined };
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  return { username, mode: 'offline' };
};

export const offlineSignIn = async (username, password) => {
  const accounts = readJson(ACCOUNTS_KEY, {});
  const id = username.toLowerCase();
  const acct = accounts[id];
  if (acct) {
    if ((await derive(password, fromHex(acct.salt))) !== acct.hash) throw new Error('Wrong hunter name or password.');
    return { username: acct.username, mode: 'offline' };
  }
  // Older builds kept offline passwords in plain text; verify once, then upgrade to a hash.
  const legacy = localStorage.getItem(`user_${username}`);
  if (legacy == null) throw new Error('No offline hunter with that name on this device.');
  if (legacy !== password) throw new Error('Wrong hunter name or password.');
  localStorage.removeItem(`user_${username}`);
  const email = localStorage.getItem(`user_${username}_email`) || undefined;
  localStorage.removeItem(`user_${username}_email`);
  return offlineSignUp(username, password, email);
};
