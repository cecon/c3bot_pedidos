import { existsSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import type { AsyncRemoteCallback } from "drizzle-orm/sqlite-proxy";
import * as schema from "../../src/db/schema";
import { applyMigrations } from "../migrations";

// Single shared SQLite connection + Drizzle client for the dev API. Migrations run through
// the unified idempotent runner (ADR-0003). Route modules import `db` from here.

function getDefaultDatabasePath(): string {
  if (process.platform === "win32") {
    return path.join(process.env.APPDATA ?? os.homedir(), "br.com.c3bot.app", "c3bot.db");
  }
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Application Support", "br.com.c3bot.app", "c3bot.db");
  }
  return path.join(process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share"), "br.com.c3bot.app", "c3bot.db");
}

function createNodeSqliteProxy(database: DatabaseSync): AsyncRemoteCallback {
  return async (sql, params, method) => {
    const statement = database.prepare(sql);
    const values = params.map((value) => (typeof value === "boolean" ? Number(value) : value));

    if (method === "run") {
      statement.run(...values);
      return { rows: [] };
    }

    const rows = method === "get" ? [statement.get(...values)].filter(Boolean) : statement.all(...values);
    const mappedRows = rows.map((row) => (row && typeof row === "object" ? Object.values(row) : [row]));
    return { rows: method === "get" ? (mappedRows[0] ?? undefined) : mappedRows };
  };
}

const databasePath = path.resolve(process.env.C3BOT_DB_PATH ?? getDefaultDatabasePath());
if (path.dirname(databasePath) !== "." && !existsSync(path.dirname(databasePath))) {
  mkdirSync(path.dirname(databasePath), { recursive: true });
}

export const sqlite = new DatabaseSync(databasePath);
sqlite.exec("PRAGMA foreign_keys = ON");
applyMigrations(sqlite, "dev-api");

export const db = drizzle(createNodeSqliteProxy(sqlite), { schema });
export { schema };
