import crypto from 'crypto';

// Signed session tokens (HMAC-SHA256, JWT-shaped) so no extra dependency or DB table is needed.
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

let secret = process.env.AUTH_SECRET;
if (!secret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must be set in production (any long random string).');
  }
  secret = crypto.randomBytes(32).toString('hex');
  console.warn('AUTH_SECRET not set: using a random dev secret. Sessions reset when the server restarts.');
}

const b64url = (input) => Buffer.from(input).toString('base64url');
const sign = (data) => crypto.createHmac('sha256', secret).update(data).digest('base64url');

export const signToken = (user) => {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(JSON.stringify({ sub: user.id, name: user.username, iat: now, exp: now + TOKEN_TTL_SECONDS }));
  return `${header}.${payload}.${sign(`${header}.${payload}`)}`;
};

export const verifyToken = (token) => {
  const parts = (token || '').split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = Buffer.from(sign(`${header}.${payload}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!claims.exp || claims.exp < Date.now() / 1000) return null;
    return claims;
  } catch {
    return null;
  }
};

export const requireAuth = (req, res, next) => {
  const header = req.get('authorization') || '';
  const claims = verifyToken(header.startsWith('Bearer ') ? header.slice(7) : '');
  if (!claims) return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  req.user = { id: claims.sub, username: claims.name };
  next();
};

/**
 * Fixed-window rate limiter kept in memory. Good enough for a single instance;
 * on serverless each instance keeps its own counts.
 */
export const rateLimit = ({ windowMs, max, key }) => {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const k = key(req);
    const entry = hits.get(k);
    if (!entry || entry.reset < now) {
      hits.set(k, { count: 1, reset: now + windowMs });
      if (hits.size > 10000) for (const [id, e] of hits) if (e.reset < now) hits.delete(id);
      return next();
    }
    entry.count++;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ error: 'Too many attempts. Wait a few minutes and try again.' });
    }
    next();
  };
};

export const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/;
export const MIN_PASSWORD = 8;
