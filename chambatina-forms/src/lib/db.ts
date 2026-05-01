import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'chambatina.db');

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        trackingNumber TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        identity TEXT NOT NULL,
        phone TEXT NOT NULL,
        province TEXT NOT NULL,
        address TEXT NOT NULL,
        weight REAL NOT NULL,
        packages INTEGER NOT NULL,
        description TEXT DEFAULT '',
        embarcador TEXT DEFAULT 'CHAMBATINA MIAMI',
        status TEXT DEFAULT 'PENDIENTE',
        syncedToSolvedcargo INTEGER DEFAULT 0,
        solvedcargoId TEXT,
        createdAt TEXT DEFAULT (datetime('now')),
        updatedAt TEXT DEFAULT (datetime('now'))
      )
    `);
  }
  return _db;
}

export function insertSubmission(data: {
  trackingNumber: string;
  name: string;
  identity: string;
  phone: string;
  province: string;
  address: string;
  weight: number;
  packages: number;
  description: string;
  embarcador: string;
}) {
  const db = getDb();
  const id = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  const stmt = db.prepare(`
    INSERT INTO submissions (id, trackingNumber, name, identity, phone, province, address, weight, packages, description, embarcador)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, data.trackingNumber, data.name, data.identity, data.phone, data.province, data.address, data.weight, data.packages, data.description, data.embarcador);
  return { id, trackingNumber: data.trackingNumber };
}

export function getAllSubmissions() {
  const db = getDb();
  return db.prepare('SELECT * FROM submissions ORDER BY createdAt DESC').all();
}

export function getSubmissionByTracking(trackingNumber: string) {
  const db = getDb();
  return db.prepare('SELECT * FROM submissions WHERE trackingNumber = ?').get(trackingNumber);
}
