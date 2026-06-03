// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import {
  applyMigrationList,
  applyMigrations,
  checksum,
  columnExists,
  ensureTrackingTable,
  isApplied,
  MIGRATIONS,
  parseAddColumn,
  splitStatements,
  type MigrationSource,
} from "./migrations";

function memoryDb(): DatabaseSync {
  return new DatabaseSync(":memory:");
}

const SAMPLE: MigrationSource[] = [
  { version: 1, description: "init", sql: "CREATE TABLE IF NOT EXISTS t (id TEXT PRIMARY KEY);" },
  { version: 2, description: "add", sql: "ALTER TABLE t ADD COLUMN name TEXT NOT NULL DEFAULT '';" },
];

describe("parseAddColumn", () => {
  it("matches ADD COLUMN only", () => {
    expect(parseAddColumn("ALTER TABLE attendants ADD COLUMN display_name TEXT NOT NULL DEFAULT ''")).toEqual({
      table: "attendants",
      column: "display_name",
    });
    expect(parseAddColumn("CREATE TABLE IF NOT EXISTS x (id TEXT)")).toBeNull();
    expect(parseAddColumn("UPDATE attendants SET name = 'x'")).toBeNull();
  });
});

describe("splitStatements", () => {
  it("splits on ; and strips comments and blanks", () => {
    const sql = "-- header\nCREATE TABLE a (id TEXT); -- inline\n\nALTER TABLE a ADD COLUMN b TEXT;";
    expect(splitStatements(sql)).toEqual(["CREATE TABLE a (id TEXT)", "ALTER TABLE a ADD COLUMN b TEXT"]);
  });
});

describe("checksum", () => {
  it("is deterministic, hex, 16 chars, and content-sensitive", () => {
    const a = checksum("SELECT 1;");
    expect(a).toBe(checksum("SELECT 1;"));
    expect(a).toHaveLength(16);
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(a).not.toBe(checksum("SELECT 2;"));
  });
});

describe("applyMigrationList", () => {
  it("applies once and re-running is a NO-OP", () => {
    const db = memoryDb();
    applyMigrationList(db, "test", SAMPLE);
    applyMigrationList(db, "test", SAMPLE); // must not throw on duplicate column
    expect(columnExists(db, "t", "name")).toBe(true);
    const row = db.prepare("SELECT count(*) AS c FROM __c3bot_migrations").get() as { c: number };
    expect(row.c).toBe(2);
    expect(isApplied(db, 2)).toBe(true);
  });

  it("guards ADD COLUMN when the column already exists (divergence case)", () => {
    const db = memoryDb();
    db.exec("CREATE TABLE t (id TEXT, name TEXT)");
    // Version not yet recorded, but the column is already present -> must skip, not throw.
    expect(() => applyMigrationList(db, "test", [SAMPLE[1]])).not.toThrow();
    expect(columnExists(db, "t", "name")).toBe(true);
  });

  it("applies the real migration files (incl. 003) idempotently", () => {
    const db = memoryDb();
    applyMigrations(db, "test-real");
    applyMigrations(db, "test-real"); // re-run must be a NO-OP across all three

    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{ name: string }>).map(
      (t) => t.name,
    );
    expect(tables).toEqual(
      expect.arrayContaining([
        "stores",
        "catalogs",
        "categories",
        "catalog_items",
        "option_groups",
        "options",
        "pizza_configs",
        "pizza_flavor_prices",
        "availability_schedules",
        "merchant_operations",
        "merchant_shifts",
        "merchant_interruptions",
      ]),
    );
    expect(columnExists(db, "products", "unit_of_measure")).toBe(true);
    expect(columnExists(db, "products", "image_base64")).toBe(true);
    // Feature 006: the stores row is enriched into the merchant.
    expect(columnExists(db, "stores", "corporate_name")).toBe(true);
    expect(columnExists(db, "stores", "merchant_type")).toBe(true);

    const stores = db.prepare("SELECT count(*) AS c FROM stores").get() as { c: number };
    expect(stores.c).toBe(1); // single store seeded, exactly once
    const operations = db.prepare("SELECT count(*) AS c FROM merchant_operations").get() as { c: number };
    expect(operations.c).toBe(1); // default delivery operation seeded exactly once
    const migrations = db.prepare("SELECT count(*) AS c FROM __c3bot_migrations").get() as { c: number };
    expect(migrations.c).toBe(4);
  });

  it("migrates store-scope opening hours into merchant shifts when upgrading from feature 005 (T046)", () => {
    const db = memoryDb();
    // Simulate an existing feature-005 DB: only migrations 1..3 applied.
    applyMigrations(db, "test", MIGRATIONS.slice(0, 3));
    db.prepare(
      "INSERT INTO availability_schedules (id, scope_type, scope_id, day_of_week, start_time, end_time) VALUES (?, 'store', 'store-default', 1, '11:00', '14:00')",
    ).run("sched-1");

    // Upgrade: migration 004 runs once. No "duplicate column" error despite the added stores columns.
    applyMigrations(db, "test", MIGRATIONS);
    const shift = db.prepare("SELECT day_of_week AS d, start AS s, duration_minutes AS m FROM merchant_shifts").get() as {
      d: string;
      s: string;
      m: number;
    };
    expect(shift).toEqual({ d: "MONDAY", s: "11:00", m: 180 });

    // Re-run is a NO-OP: the guarded migration does not duplicate the shift.
    applyMigrations(db, "test", MIGRATIONS);
    const count = db.prepare("SELECT count(*) AS c FROM merchant_shifts").get() as { c: number };
    expect(count.c).toBe(1);
  });

  it("reconciles a legacy __c3bot_migrations schema", () => {
    const db = memoryDb();
    db.exec("CREATE TABLE __c3bot_migrations (version INTEGER PRIMARY KEY, description TEXT NOT NULL, applied_at TEXT NOT NULL)");
    db.prepare("INSERT INTO __c3bot_migrations (version, description, applied_at) VALUES (1, 'init', '2026-01-01')").run();
    ensureTrackingTable(db);
    const cols = (db.prepare("PRAGMA table_info(__c3bot_migrations)").all() as Array<{ name: string }>).map((c) => c.name);
    expect(cols).toEqual(["migration_version", "checksum", "executed_at", "runtime"]);
    expect(isApplied(db, 1)).toBe(true); // legacy version preserved
  });
});
