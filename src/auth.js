import crypto from 'node:crypto';
import { getDb } from './db.js';

const SESSION_DAYS = Number(process.env.SESSION_DAYS || 14);
const COOKIE_NAME = 'sid';
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, SCRYPT_PARAMS);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export function verifyPassword(password, stored) {
  const [algo, saltHex, hashHex] = String(stored || '').split('$');
  if (algo !== 'scrypt' || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length, SCRYPT_PARAMS);
  return crypto.timingSafeEqual(expected, actual);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createSession(userId) {
  const db = getDb();
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const expiresAt = expires.toISOString().slice(0, 19).replace('T', ' ');
  db.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
  ).run(hashToken(token), userId, expiresAt);
  return { token, expires };
}

export function destroySession(token) {
  if (!token) return;
  getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

export function destroyUserSessions(userId) {
  getDb().prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

export function getUserBySession(token) {
  if (!token) return null;
  const db = getDb();
  db.prepare(`DELETE FROM sessions WHERE expires_at < datetime('now')`).run();
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.plan, u.monthly_quota, u.active, u.created_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at >= datetime('now')`,
    )
    .get(hashToken(token));
  if (!row || !row.active) return null;
  return row;
}

export function findUserByEmail(email) {
  return getDb()
    .prepare(
      `SELECT id, email, name, password_hash, role, plan, monthly_quota, active, created_at
       FROM users WHERE email = ?`,
    )
    .get(String(email || '').trim().toLowerCase());
}

export function createUser({ email, password, name = '', role = 'user', plan = 'free', monthlyQuota = 3 }) {
  const db = getDb();
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('Adresse e-mail invalide');
  }
  if (!password || password.length < 8) {
    throw new Error('Mot de passe : 8 caractères minimum');
  }
  const info = db
    .prepare(
      `INSERT INTO users (email, name, password_hash, role, plan, monthly_quota)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(normalized, String(name || '').trim(), hashPassword(password), role, plan, monthlyQuota);
  return db.prepare('SELECT id, email, name, role, plan, monthly_quota, active, created_at FROM users WHERE id = ?').get(info.lastInsertRowid);
}

export function listUsers() {
  return getDb()
    .prepare(
      `SELECT u.id, u.email, u.name, u.role, u.plan, u.monthly_quota, u.active, u.created_at,
              (SELECT COUNT(*) FROM conversions c WHERE c.user_id = u.id) AS conversion_count,
              (SELECT COUNT(*) FROM conversions c
                 WHERE c.user_id = u.id
                   AND c.created_at >= datetime('now', 'start of month')) AS conversions_this_month
       FROM users u
       ORDER BY u.created_at DESC`,
    )
    .all();
}

export function setUserActive(userId, active) {
  getDb().prepare('UPDATE users SET active = ? WHERE id = ?').run(active ? 1 : 0, userId);
  if (!active) destroyUserSessions(userId);
}

export function setUserQuota(userId, monthlyQuota) {
  const q = Math.max(0, Number(monthlyQuota) || 0);
  getDb().prepare('UPDATE users SET monthly_quota = ? WHERE id = ?').run(q, userId);
}

export function setUserRole(userId, role) {
  if (!['user', 'admin'].includes(role)) throw new Error('Rôle invalide');
  getDb().prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
}

export function countUsers() {
  return getDb().prepare('SELECT COUNT(*) AS n FROM users').get().n;
}

export function countAdmins() {
  return getDb().prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND active = 1`).get().n;
}

export function conversionsThisMonth(userId) {
  return getDb()
    .prepare(
      `SELECT COUNT(*) AS n FROM conversions
       WHERE user_id = ? AND created_at >= datetime('now', 'start of month')`,
    )
    .get(userId).n;
}

export function recordConversion(userId, stats, bytesIn = 0) {
  getDb()
    .prepare(
      `INSERT INTO conversions
         (user_id, name, styled_elements, asset_count, rejected, holes, bytes_in)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      userId,
      stats.name || 'page',
      stats.styledElements || 0,
      stats.assetCount || 0,
      stats.rejected || 0,
      stats.holes || 0,
      bytesIn,
    );
}

export function recentConversions(userId, limit = 20) {
  return getDb()
    .prepare(
      `SELECT id, name, styled_elements, asset_count, rejected, holes, created_at
       FROM conversions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
    )
    .all(userId, limit);
}

export function adminStats() {
  const db = getDb();
  return {
    users: db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
    activeUsers: db.prepare('SELECT COUNT(*) AS n FROM users WHERE active = 1').get().n,
    conversions: db.prepare('SELECT COUNT(*) AS n FROM conversions').get().n,
    conversionsThisMonth: db
      .prepare(`SELECT COUNT(*) AS n FROM conversions WHERE created_at >= datetime('now', 'start of month')`)
      .get().n,
  };
}

export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export function sessionCookie(token, expires) {
  const maxAge = Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000));
  const secure = process.env.COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie() {
  const secure = process.env.COOKIE_SECURE === '1' || process.env.NODE_ENV === 'production';
  const parts = [`${COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function getSessionToken(req) {
  return parseCookies(req.headers.cookie)[COOKIE_NAME] || null;
}

export function bootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password) return null;
  if (countAdmins() > 0) return null;
  const existing = findUserByEmail(email);
  if (existing) {
    getDb().prepare(`UPDATE users SET role = 'admin', active = 1 WHERE id = ?`).run(existing.id);
    return findUserByEmail(email);
  }
  return createUser({
    email,
    password,
    name: 'Admin',
    role: 'admin',
    plan: 'pro',
    monthlyQuota: Number(process.env.BOOTSTRAP_ADMIN_QUOTA || 1000),
  });
}

export function checkQuota(user) {
  const used = conversionsThisMonth(user.id);
  const limit = user.monthly_quota;
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
    ok: used < limit,
  };
}
