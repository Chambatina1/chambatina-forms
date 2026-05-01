import { mkdirSync, existsSync, readdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const DATA_DIR = join(process.cwd(), "data", "shipments");

function ensureDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveShipment(id: string, data: Record<string, unknown>) {
  ensureDir();
  writeFileSync(join(DATA_DIR, `${id}.json`), JSON.stringify(data, null, 2), "utf-8");
}

function readShipment(id: string): Record<string, unknown> | null {
  ensureDir();
  const path = join(DATA_DIR, `${id}.json`);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8"));
}

function readAllShipments(): Record<string, unknown>[] {
  ensureDir();
  try {
    const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));
    return files.map((f) => {
      const raw = readFileSync(join(DATA_DIR, f), "utf-8");
      return JSON.parse(raw);
    });
  } catch {
    return [];
  }
}

// Prisma-compatible wrapper — all existing API routes work without changes
export const db = {
  shipment: {
    create({ data }: { data: Record<string, unknown> }) {
      const id = (data.id as string) || randomUUID();
      const now = new Date().toISOString();
      const record = {
        ...data,
        id,
        createdAt: (data.createdAt as string) || now,
        updatedAt: (data.updatedAt as string) || now,
      };
      saveShipment(id, record);
      return record;
    },

    findMany(options?: {
      orderBy?: { createdAt: string };
      take?: number;
    }) {
      let rows = readAllShipments();
      const orderDir = options?.orderBy?.createdAt === "desc" ? "desc" : "asc";
      rows.sort((a, b) => {
        const ta = new Date(a.createdAt as string).getTime();
        const tb = new Date(b.createdAt as string).getTime();
        return orderDir === "desc" ? tb - ta : ta - tb;
      });
      if (options?.take) rows = rows.slice(0, options.take);
      return rows;
    },

    findUnique({ where }: { where: { id: string } }) {
      return readShipment(where.id);
    },

    update({
      where,
      data,
    }: {
      where: { id: string };
      data: Record<string, unknown>;
    }) {
      const existing = readShipment(where.id);
      if (!existing) throw new Error(`Shipment ${where.id} not found`);
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      saveShipment(where.id, updated);
      return updated;
    },

    delete({ where }: { where: { id: string } }) {
      ensureDir();
      const path = join(DATA_DIR, `${where.id}.json`);
      if (existsSync(path)) unlinkSync(path);
    },
  },
};
