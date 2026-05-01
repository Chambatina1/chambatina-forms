import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { randomUUID } from "crypto";

const DB_PATH = join(process.cwd(), "data", "shipments.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  mkdirSync(dirname(DB_PATH), { recursive: true });
  _db = new Database(DB_PATH);

  // Create table if not exists
  _db.exec(`
    CREATE TABLE IF NOT EXISTS Shipment (
      id TEXT PRIMARY KEY,
      sname TEXT NOT NULL DEFAULT '',
      sphone TEXT NOT NULL DEFAULT '',
      saddress TEXT NOT NULL DEFAULT '',
      semail TEXT NOT NULL DEFAULT '',
      cname TEXT NOT NULL DEFAULT '',
      cidentity TEXT NOT NULL DEFAULT '',
      cphone TEXT NOT NULL DEFAULT '',
      caddress TEXT NOT NULL DEFAULT '',
      cprovince TEXT NOT NULL DEFAULT '',
      weight TEXT NOT NULL DEFAULT '',
      npieces TEXT NOT NULL DEFAULT '1',
      description TEXT NOT NULL DEFAULT '',
      cnotes TEXT NOT NULL DEFAULT '',
      shipperIdApi TEXT NOT NULL DEFAULT '',
      consigneeIdApi TEXT NOT NULL DEFAULT '',
      cpkNumber TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'PENDIENTE',
      syncedToApi INTEGER NOT NULL DEFAULT 0,
      apiResponse TEXT NOT NULL DEFAULT '',
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  return _db;
}

// Prisma-compatible wrapper so all existing API routes work without changes
export const db = {
  shipment: {
    create({ data }: { data: Record<string, unknown> }) {
      const database = getDb();
      const id = (data.id as string) || randomUUID();
      const now = new Date().toISOString();
      const createdAt = (data.createdAt as string) || now;
      const updatedAt = (data.updatedAt as string) || now;

      database
        .prepare(
          `INSERT INTO Shipment (id, sname, sphone, saddress, semail, cname, cidentity, cphone, caddress, cprovince, weight, npieces, description, cnotes, shipperIdApi, consigneeIdApi, cpkNumber, status, syncedToApi, apiResponse, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          id,
          (data.sname as string) || "",
          (data.sphone as string) || "",
          (data.saddress as string) || "",
          (data.semail as string) || "",
          (data.cname as string) || "",
          (data.cidentity as string) || "",
          (data.cphone as string) || "",
          (data.caddress as string) || "",
          (data.cprovince as string) || "",
          (data.weight as string) || "",
          (data.npieces as string) || "1",
          (data.description as string) || "",
          (data.cnotes as string) || "",
          (data.shipperIdApi as string) || "",
          (data.consigneeIdApi as string) || "",
          (data.cpkNumber as string) || "",
          (data.status as string) || "PENDIENTE",
          data.syncedToApi ? 1 : 0,
          (data.apiResponse as string) || "",
          createdAt,
          updatedAt
        );

      // Convert SQLite integer booleans to JS booleans for consistency
      const row = database
        .prepare("SELECT * FROM Shipment WHERE id = ?")
        .get(id) as Record<string, unknown>;
      row.syncedToApi = Boolean(row.syncedToApi);
      return row;
    },

    findMany(options?: {
      orderBy?: { createdAt: string };
      take?: number;
    }) {
      const database = getDb();
      const orderDir =
        options?.orderBy?.createdAt === "desc" ? "DESC" : "ASC";
      const limit = options?.take ? `LIMIT ${options.take}` : "";

      const rows = database
        .prepare(
          `SELECT * FROM Shipment ORDER BY createdAt ${orderDir} ${limit}`
        )
        .all() as Record<string, unknown>[];

      // Convert SQLite integers to JS booleans
      return rows.map((row) => ({
        ...row,
        syncedToApi: Boolean(row.syncedToApi),
      }));
    },

    findUnique({ where }: { where: { id: string } }) {
      const database = getDb();
      const row = database
        .prepare("SELECT * FROM Shipment WHERE id = ?")
        .get(where.id) as Record<string, unknown> | undefined;
      if (!row) return null;
      row.syncedToApi = Boolean(row.syncedToApi);
      return row;
    },

    update({
      where,
      data,
    }: {
      where: { id: string };
      data: Record<string, unknown>;
    }) {
      const database = getDb();
      const entries = Object.entries(data).filter(([k]) => k !== "id");
      const fields = entries.map(([k]) => `"${k}" = ?`).join(", ");
      const values = entries.map(([k, v]) => {
        if (k === "syncedToApi") return v ? 1 : 0;
        return v;
      });

      const now = new Date().toISOString();
      database
        .prepare(`UPDATE Shipment SET ${fields}, updatedAt = ? WHERE id = ?`)
        .run(...values, now, where.id);

      const row = database
        .prepare("SELECT * FROM Shipment WHERE id = ?")
        .get(where.id) as Record<string, unknown>;
      if (row) row.syncedToApi = Boolean(row.syncedToApi);
      return row;
    },

    delete({ where }: { where: { id: string } }) {
      const database = getDb();
      database.prepare("DELETE FROM Shipment WHERE id = ?").run(where.id);
    },
  },
};
