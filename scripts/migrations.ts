// Unified, idempotent SQLite migration runner for the Node dev API.
//
// This mirrors the Rust runner (`src-tauri/src/migrations.rs`) so that whichever
// runtime touches `c3bot.db` first records the migration in the SAME shared tracking
// table `__c3bot_migrations`, and the other runtime treats it as a NO-OP. Before an
// `ALTER TABLE ... ADD COLUMN` (which has no `IF NOT EXISTS` in SQLite) the target
// column is checked via `PRAGMA table_info` and skipped if it already exists.
//
// Keep the migration list in sync with `src-tauri/src/migrations.rs`. The FNV-1a 64-bit
// checksum matches the Rust implementation byte-for-byte for the same file.
// See docs/adr/ADR-001-idempotent-migrations.md.

import { readFileSync } from "node:fs";
import path from "node:path";
import type { DatabaseSync } from "node:sqlite";

export interface MigrationFile {
  version: number;
  description: string;
  file: string;
}

export interface MigrationSource {
  version: number;
  description?: string;
  sql: string;
}

/** Ordered migration list. Append new migrations here AND in `src-tauri/src/migrations.rs`. */
export const MIGRATIONS: MigrationFile[] = [
  { version: 1, description: "create_c3bot_schema", file: "src-tauri/migrations/001_init.sql" },
  { version: 2, description: "delivery_attendants", file: "src-tauri/migrations/002_delivery_attendants.sql" },
  { version: 3, description: "product_catalog", file: "src-tauri/migrations/003_product_catalog.sql" },
];

/** Read each migration file and apply it idempotently. */
export function applyMigrations(db: DatabaseSync, runtime = "dev-api", migrations = MIGRATIONS): void {
  const sources: MigrationSource[] = migrations.map((m) => ({
    version: m.version,
    description: m.description,
    sql: readFileSync(path.resolve(m.file), "utf8"),
  }));
  applyMigrationList(db, runtime, sources);
}

/** Apply an in-memory list of migrations idempotently (used by `applyMigrations` and tests). */
export function applyMigrationList(db: DatabaseSync, runtime: string, sources: MigrationSource[]): void {
  ensureTrackingTable(db);
  for (const source of sources) {
    if (isApplied(db, source.version)) continue; // recorded by some runtime -> NO-OP
    applyOne(db, source.sql);
    record(db, source.version, checksum(source.sql), runtime);
  }
}

/** Create the shared tracking table, reconciling any legacy schema. */
export function ensureTrackingTable(db: DatabaseSync): void {
  const columns = db.prepare("PRAGMA table_info(__c3bot_migrations)").all() as Array<{ name: string }>;

  if (columns.length === 0) {
    db.exec(
      "CREATE TABLE __c3bot_migrations (" +
        "migration_version INTEGER PRIMARY KEY, " +
        "checksum TEXT NOT NULL, " +
        "executed_at TEXT NOT NULL, " +
        "runtime TEXT NOT NULL)",
    );
    return;
  }

  const names = columns.map((c) => c.name);
  if (!names.includes("migration_version")) {
    // Legacy schema (version/description/applied_at) -> migrate to the shared shape.
    // Idempotent migrations make this safe even though checksum history is lost.
    db.exec("ALTER TABLE __c3bot_migrations RENAME TO __c3bot_migrations_legacy");
    db.exec(
      "CREATE TABLE __c3bot_migrations (" +
        "migration_version INTEGER PRIMARY KEY, " +
        "checksum TEXT NOT NULL, " +
        "executed_at TEXT NOT NULL, " +
        "runtime TEXT NOT NULL)",
    );
    db.exec(
      "INSERT OR IGNORE INTO __c3bot_migrations (migration_version, checksum, executed_at, runtime) " +
        "SELECT version, '', COALESCE(applied_at, datetime('now')), 'legacy' FROM __c3bot_migrations_legacy",
    );
    db.exec("DROP TABLE __c3bot_migrations_legacy");
  }
}

export function isApplied(db: DatabaseSync, version: number): boolean {
  return Boolean(db.prepare("SELECT 1 FROM __c3bot_migrations WHERE migration_version = ?").get(version));
}

function record(db: DatabaseSync, version: number, sum: string, runtime: string): void {
  db.prepare(
    "INSERT OR IGNORE INTO __c3bot_migrations (migration_version, checksum, executed_at, runtime) " +
      "VALUES (?, ?, datetime('now'), ?)",
  ).run(version, sum, runtime);
}

/** Apply one migration in a transaction, guarding each statement so re-runs are safe. */
function applyOne(db: DatabaseSync, sql: string): void {
  db.exec("BEGIN");
  try {
    for (const statement of splitStatements(sql)) {
      const addColumn = parseAddColumn(statement);
      if (addColumn && columnExists(db, addColumn.table, addColumn.column)) {
        continue; // ADD COLUMN has no IF NOT EXISTS -> skip when present
      }
      db.exec(statement);
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function columnExists(db: DatabaseSync, table: string, column: string): boolean {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return rows.some((row) => row.name.toLowerCase() === column.toLowerCase());
}

/**
 * Split a SQL script into statements on `;`, dropping comments and blank lines.
 * Migration files MUST NOT contain `;` inside string literals (they do not).
 */
export function splitStatements(sql: string): string[] {
  return sql
    .split(";")
    .map(stripLineComments)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function stripLineComments(statement: string): string {
  return statement
    .split(/\r?\n/)
    .map((line) => {
      const index = line.indexOf("--");
      return index === -1 ? line : line.slice(0, index);
    })
    .join("\n");
}

/** If `statement` is `ALTER TABLE <t> ADD COLUMN <c> ...`, return `{ table, column }`. */
export function parseAddColumn(statement: string): { table: string; column: string } | null {
  const normalized = statement.split(/\s+/).join(" ").trim();
  const lower = normalized.toLowerCase();
  if (!lower.startsWith("alter table ")) return null;

  const addIndex = lower.indexOf(" add column ");
  if (addIndex === -1) return null;

  const table = normalized.slice("alter table ".length, addIndex).trim().replace(/^"|"$/g, "");
  const rest = normalized.slice(addIndex + " add column ".length);
  const column = (rest.split(/\s+/)[0] ?? "").replace(/^"|"$/g, "");
  if (!table || !column) return null;
  return { table, column };
}

/**
 * FNV-1a 64-bit checksum (hex). Matches `checksum` in `src-tauri/src/migrations.rs`
 * so the same file produces the same checksum across runtimes.
 */
export function checksum(sql: string): string {
  const mask = (1n << 64n) - 1n;
  let hash = 0xcbf29ce484222325n;
  for (const byte of Buffer.from(sql, "utf8")) {
    hash = (hash ^ BigInt(byte)) & mask;
    hash = (hash * 0x100000001b3n) & mask;
  }
  return hash.toString(16).padStart(16, "0");
}
