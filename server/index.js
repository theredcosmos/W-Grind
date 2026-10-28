import 'dotenv/config'; // must load before ./auth.js reads AUTH_SECRET
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { MIN_PASSWORD, USERNAME_RE, rateLimit, requireAuth, signToken } from './auth.js';

const app = express();
// Render / Vercel sit behind one proxy; set TRUST_PROXY=0 when self-hosting without one so X-Forwarded-For can't be spoofed.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));
app.use(cors(process.env.CORS_ORIGIN ? { origin: process.env.CORS_ORIGIN.split(',') } : undefined));
app.use(express.json({ limit: '256kb' }));

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'leetcode_tracker',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper to check DB connection
pool.getConnection()
  .then(conn => {
    console.log("Connected to MySQL Database");
    conn.release();
  })
  .catch(err => {
    console.error("Database connection failed. Did you create the DB and configure .env?", err.message);
  });

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  key: (req) => `${req.ip}|${String(req.body?.username || '').toLowerCase()}`,
});
const ipLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, key: (req) => req.ip }); // many usernames from one IP
const signupLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, key: (req) => req.ip });
const syncLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, key: (req) => `sync|${req.user.id}` });

const session = (user) => ({ username: user.username, token: signToken(user) });

// Used when a username doesn't exist, so a failed login takes as long either way.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

// Register endpoint
app.post('/api/register', signupLimiter, async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  const email = String(req.body?.email || '').trim() || null;

  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Hunter name must be 3-24 letters, numbers, _ or -.' });
  }
  if (password.length < MIN_PASSWORD) {
    return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD} characters.` });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'That email address looks invalid.' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (rows.length > 0) {
      return res.status(409).json({ error: 'That hunter name is taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let result;
    try {
      [result] = await pool.query(
        'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
        [username, hashedPassword, email]
      );
    } catch (dbError) {
      // Older databases may not have the email column yet.
      if (dbError.code !== 'ER_BAD_FIELD_ERROR') throw dbError;
      [result] = await pool.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hashedPassword]);
    }
    res.json(session({ id: result.insertId, username }));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That hunter name is taken.' });
    console.error(error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Password login
app.post('/api/login', ipLimiter, authLimiter, async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!username || !password) {
    return res.status(400).json({ error: 'Hunter name and password are required.' });
  }

  try {
    const [rows] = await pool.query('SELECT id, username, password_hash FROM users WHERE username = ?', [username]);
    const user = rows[0];
    const ok = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
    if (!user || !user.password_hash || !ok) {
      // Same answer whether the name is unknown, Google-only, or the password is wrong.
      return res.status(401).json({ error: 'Wrong hunter name or password. If you signed up with Google, use Google sign-in.' });
    }
    res.json(session(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Google sign-in: the client sends its Firebase ID token and we verify it with Google.
app.post('/api/google-auth', ipLimiter, authLimiter, async (req, res) => {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) return res.status(501).json({ error: 'Google sign-in is not configured on the server.' });
  const idToken = String(req.body?.idToken || '');
  if (!idToken) return res.status(400).json({ error: 'Missing Google token.' });

  try {
    const lookup = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await lookup.json();
    const account = data.users?.[0];
    if (!lookup.ok || !account?.localId) return res.status(401).json({ error: 'Google sign-in could not be verified.' });

    const googleId = account.localId;
    const [existing] = await pool.query('SELECT id, username FROM users WHERE google_id = ?', [googleId]);
    if (existing.length) return res.json(session(existing[0]));

    // New Google user: derive a unique hunter name from their display name.
    const raw = (account.displayName || account.email?.split('@')[0] || 'hunter').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20);
    const base = raw.length >= 3 ? raw : `hunter${raw}`;
    let username = base;
    for (let i = 2; i < 1000; i++) {
      const [taken] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
      if (!taken.length) break;
      username = `${base}${i}`;
    }
    try {
      const [result] = await pool.query(
        'INSERT INTO users (username, google_id, email) VALUES (?, ?, ?)',
        [username, googleId, account.email || null]
      );
      res.json(session({ id: result.insertId, username }));
    } catch (insertError) {
      if (insertError.code !== 'ER_DUP_ENTRY') throw insertError;
      // A parallel request created this Google user first.
      const [again] = await pool.query('SELECT id, username FROM users WHERE google_id = ?', [googleId]);
      if (!again.length) throw insertError;
      res.json(session(again[0]));
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during Google sign-in.' });
  }
});

app.get('/api/me', requireAuth, (req, res) => res.json({ username: req.user.username }));

// Old clients call /api/sync/:username; the token must belong to that user.
const ownSync = (req, res, next) => {
  if (req.params.username.toLowerCase() !== req.user.username.toLowerCase()) {
    return res.status(403).json({ error: 'You can only sync your own progress.' });
  }
  next();
};

const getSync = async (req, res) => {
  try {
    const userId = req.user.id;
    const [completedRows] = await pool.query('SELECT question_id, DATE_FORMAT(completed_date, "%Y-%m-%d") as completed_date FROM completed_questions WHERE user_id = ?', [userId]);
    const completed = {};
    completedRows.forEach(row => { completed[row.question_id] = row.completed_date; });

    const [timeRows] = await pool.query('SELECT DATE_FORMAT(track_date, "%Y-%m-%d") as track_date, seconds FROM tracked_time WHERE user_id = ?', [userId]);
    const trackedTime = {};
    timeRows.forEach(row => { trackedTime[row.track_date] = row.seconds; });

    res.json({ completed, trackedTime });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while loading progress.' });
  }
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ID_RE = /^[a-z0-9-]{1,100}$/; // LeetCode slugs (old builds used numeric ids, which also match)
const MAX_ROWS = 3000;

const postSync = async (req, res) => {
  const userId = req.user.id;
  const removed = (Array.isArray(req.body?.removed) ? req.body.removed : [])
    .filter((id) => typeof id === 'string' && ID_RE.test(id))
    .slice(0, MAX_ROWS);
  const removedSet = new Set(removed);
  const completed = Object.entries(req.body?.completed || {})
    .filter(([id, date]) => ID_RE.test(id) && typeof date === 'string' && DATE_RE.test(date) && !removedSet.has(id))
    .slice(0, MAX_ROWS);
  const tracked = Object.entries(req.body?.trackedTime || {})
    .filter(([date, s]) => DATE_RE.test(date) && Number.isInteger(s) && s >= 0 && s <= 86400)
    .slice(0, MAX_ROWS);

  try {
    // Problems un-solved on the client.
    if (removed.length) {
      await pool.query('DELETE FROM completed_questions WHERE user_id = ? AND question_id IN (?)', [userId, removed]);
    }
    // One multi-row upsert per table instead of a query per row.
    if (completed.length) {
      await pool.query(
        'INSERT INTO completed_questions (user_id, question_id, completed_date) VALUES ? ON DUPLICATE KEY UPDATE completed_date = VALUES(completed_date)',
        [completed.map(([id, date]) => [userId, id, date])]
      );
    }
    if (tracked.length) {
      await pool.query(
        'INSERT INTO tracked_time (user_id, track_date, seconds) VALUES ? ON DUPLICATE KEY UPDATE seconds = GREATEST(seconds, VALUES(seconds))',
        [tracked.map(([date, s]) => [userId, date, s])]
      );
    }
    res.json({ success: true });
  } catch (error) {
    // Valid token, but the account was deleted: treat it as a dead session.
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(401).json({ error: 'This account no longer exists. Please sign in again.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Server error while saving progress.' });
  }
};

// ---- LeetCode import: proxy LeetCode's public GraphQL (browsers are blocked by CORS).
// Public data only exposes a user's latest 20 accepted submissions.
const LC_USER_RE = /^[A-Za-z0-9_-]{1,40}$/;
const lcCache = new Map(); // username -> { at, body }
const lcLimiter = rateLimit({ windowMs: 60 * 1000, max: 10, key: (req) => `lc|${req.user.id}` });

app.get('/api/leetcode/:lcUser/recent', requireAuth, lcLimiter, async (req, res) => {
  const lcUser = req.params.lcUser;
  if (!LC_USER_RE.test(lcUser)) return res.status(400).json({ error: 'That does not look like a LeetCode username.' });
  const cached = lcCache.get(lcUser.toLowerCase());
  if (cached && Date.now() - cached.at < 60 * 1000) return res.json(cached.body);
  try {
    const r = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Referer: 'https://leetcode.com', 'User-Agent': 'W-Grind tracker' },
      body: JSON.stringify({
        query: 'query r($u: String!, $n: Int!) { matchedUser(username: $u) { username } recentAcSubmissionList(username: $u, limit: $n) { titleSlug timestamp } }',
        variables: { u: lcUser, n: 20 },
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await r.json();
    if (!r.ok || data.errors?.length && !data.data) return res.status(502).json({ error: 'LeetCode did not answer. Try again in a minute.' });
    if (!data.data?.matchedUser) return res.status(404).json({ error: `No LeetCode user named “${lcUser}”.` });
    const body = {
      username: data.data.matchedUser.username,
      solves: (data.data.recentAcSubmissionList || []).map((s) => ({ slug: s.titleSlug, at: Number(s.timestamp) * 1000 })),
    };
    lcCache.set(lcUser.toLowerCase(), { at: Date.now(), body });
    if (lcCache.size > 500) lcCache.delete(lcCache.keys().next().value);
    res.json(body);
  } catch (error) {
    console.error('LeetCode fetch failed:', error.message);
    res.status(502).json({ error: 'Could not reach LeetCode. Try again in a minute.' });
  }
});

app.get('/api/sync', requireAuth, getSync);
app.post('/api/sync', requireAuth, syncLimiter, postSync);
app.get('/api/sync/:username', requireAuth, ownSync, getSync);
app.post('/api/sync/:username', requireAuth, ownSync, syncLimiter, postSync);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
