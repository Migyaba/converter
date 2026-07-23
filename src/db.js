import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB = path.resolve(__dirname, '../storage/app.db');

let db;

export function getDb() {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

export function initDb(dbPath = process.env.DB_PATH || DEFAULT_DB) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      plan TEXT NOT NULL DEFAULT 'free',
      monthly_quota INTEGER NOT NULL DEFAULT 3,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS conversions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL DEFAULT 'page',
      styled_elements INTEGER NOT NULL DEFAULT 0,
      asset_count INTEGER NOT NULL DEFAULT 0,
      rejected INTEGER NOT NULL DEFAULT 0,
      holes INTEGER NOT NULL DEFAULT 0,
      bytes_in INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_conversions_user ON conversions(user_id);
    CREATE INDEX IF NOT EXISTS idx_conversions_created ON conversions(created_at);
  `);
  return db;
}
