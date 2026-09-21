import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

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

// Register endpoint
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (rows.length > 0) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)', 
      [username, hashedPassword]
    );
    res.json({ id: result.insertId, username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during registration", details: error.message });
  }
});

// Manual Login endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const user = rows[0];
    if (!user.password_hash) {
      return res.status(403).json({ error: "This account uses Google Sign-In. Please sign in with Google." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.json({ id: user.id, username: user.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during login", details: error.message });
  }
});

// Google Auth endpoint
app.post('/api/google-auth', async (req, res) => {
  const { username, googleId } = req.body;
  if (!username || !googleId) {
    return res.status(400).json({ error: "Username and Google ID are required" });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    
    // New user
    if (rows.length === 0) {
      const [result] = await pool.query(
        'INSERT INTO users (username, google_id) VALUES (?, ?)', 
        [username, googleId]
      );
      return res.json({ id: result.insertId, username });
    }
    
    // Existing user
    const user = rows[0];
    if (user.google_id === googleId) {
      return res.json({ id: user.id, username: user.username });
    } else if (!user.google_id && user.password_hash) {
      return res.status(403).json({ error: "Username belongs to a password-protected account. Please login manually." });
    } else {
      return res.status(403).json({ error: "Account mismatch. Google ID does not match." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during Google auth", details: error.message });
  }
});

// Sync GET endpoint
app.get('/api/sync/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const [users] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    const userId = users[0].id;

    const [completedRows] = await pool.query('SELECT question_id, DATE_FORMAT(completed_date, "%Y-%m-%d") as completed_date FROM completed_questions WHERE user_id = ?', [userId]);
    const completed = {};
    completedRows.forEach(row => {
      completed[row.question_id] = row.completed_date;
    });

    const [timeRows] = await pool.query('SELECT DATE_FORMAT(track_date, "%Y-%m-%d") as track_date, seconds FROM tracked_time WHERE user_id = ?', [userId]);
    const trackedTime = {};
    timeRows.forEach(row => {
      trackedTime[row.track_date] = row.seconds;
    });

    res.json({ completed, trackedTime });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during sync GET" });
  }
});

// Sync POST endpoint (Save data)
app.post('/api/sync/:username', async (req, res) => {
  const { username } = req.params;
  const { completed, trackedTime } = req.body; // Expects full objects

  try {
    const [users] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    const userId = users[0].id;

    // Sync Completed Questions
    if (completed && Object.keys(completed).length > 0) {
      // In a real app we'd do UPSERT (INSERT ... ON DUPLICATE KEY UPDATE)
      for (const [questionId, dateStr] of Object.entries(completed)) {
        await pool.query(
          'INSERT INTO completed_questions (user_id, question_id, completed_date) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE completed_date = VALUES(completed_date)',
          [userId, questionId, dateStr]
        );
      }
    }

    // Sync Tracked Time
    if (trackedTime && Object.keys(trackedTime).length > 0) {
      for (const [dateStr, seconds] of Object.entries(trackedTime)) {
        await pool.query(
          'INSERT INTO tracked_time (user_id, track_date, seconds) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE seconds = VALUES(seconds)',
          [userId, dateStr, seconds]
        );
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error during sync POST" });
  }
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
