import 'dotenv/config'; // must load before ./auth.js reads AUTH_SECRET
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { MIN_PASSWORD, USERNAME_RE, rateLimit, requireAuth, signToken } from './auth.js';

const app = express();
app.set('trust proxy', 1); // Render / Vercel sit behind a proxy; needed for per-IP rate limits
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
const signupLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, key: (req) => req.ip });

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
    console.error(error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Password login
app.post('/api/login', authLimiter, async (req, res) => {
  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');
  if (!username || !password) {
    return res.status(400).json({ error: 'Hunter name and password are required.' });
  }

  try {
    const [rows] = await pool.query('SELECT id, username, password_hash FROM users WHERE username = ?', [username]);
    const user = rows[0];
    const ok = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
    if (user && !user.password_hash) {
      return res.status(403).json({ error: 'This account uses Google sign-in.' });
    }
    if (!user || !ok) {
      return res.status(401).json({ error: 'Wrong hunter name or password.' });
    }
    res.json(session(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Google sign-in: the client sends its Firebase ID token and we verify it with Google.
app.post('/api/google-auth', authLimiter, async (req, res) => {
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
    const [result] = await pool.query(
      'INSERT INTO users (username, google_id, email) VALUES (?, ?, ?)',
      [username, googleId, account.email || null]
    );
    res.json(session({ id: result.insertId, username }));
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

const postSync = async (req, res) => {
  const userId = req.user.id;
  const completed = Object.entries(req.body?.completed || {})
    .filter(([id, date]) => id.length <= 255 && DATE_RE.test(date))
    .slice(0, 5000);
  const tracked = Object.entries(req.body?.trackedTime || {})
    .filter(([date, s]) => DATE_RE.test(date) && Number.isInteger(s) && s >= 0 && s <= 86400)
    .slice(0, 5000);

  try {
    // One multi-row upsert per table instead of a query per row.
    if (completed.length) {
      await pool.query(
        'INSERT INTO completed_questions (user_id, question_id, completed_date) VALUES ? ON DUPLICATE KEY UPDATE completed_date = VALUES(completed_date)',
        [completed.map(([id, date]) => [userId, id, date])]
      );
    }
    if (tracked.length) {
      await pool.query(
        'INSERT INTO tracked_time (user_id, track_date, seconds) VALUES ? ON DUPLICATE KEY UPDATE seconds = VALUES(seconds)',
        [tracked.map(([date, s]) => [userId, date, s])]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while saving progress.' });
  }
};

app.get('/api/sync', requireAuth, getSync);
app.post('/api/sync', requireAuth, postSync);
app.get('/api/sync/:username', requireAuth, ownSync, getSync);
app.post('/api/sync/:username', requireAuth, ownSync, postSync);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
