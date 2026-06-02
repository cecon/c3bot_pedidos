//! Unified, idempotent SQLite migration runner.
//!
//! Both C3Bot runtimes apply schema migrations against the SAME `c3bot.db` file:
//! the Tauri desktop shell (this module) and the Node dev API
//! (`scripts/migrations.ts`). Previously each used a different tracking table and the
//! Tauri side ran raw SQL with no guard, so a re-run of `002` (which does
//! `ALTER TABLE ... ADD COLUMN`, a statement that has no `IF NOT EXISTS` in SQLite)
//! panicked with `duplicate column name`.
//!
//! This runner removes that class of failure:
//! - a single shared tracking table `__c3bot_migrations`
//!   (`migration_version`, `checksum`, `executed_at`, `runtime`);
//! - a migration already recorded by ANY runtime is skipped (NO-OP);
//! - before an `ALTER TABLE ... ADD COLUMN`, the target column is checked via
//!   `PRAGMA table_info` and skipped if it already exists;
//! - `CREATE TABLE/INDEX IF NOT EXISTS` keep the remaining statements idempotent.
//!
//! Keep the migration list in sync with `scripts/migrations.ts`. See
//! `docs/adr/ADR-001-idempotent-migrations.md`.

use rusqlite::{params, Connection};
use std::path::Path;

/// A versioned migration; `sql` is the raw migration file content.
pub struct MigrationDef {
    pub version: i64,
    /// Human-readable label kept in parity with `scripts/migrations.ts`; recorded for
    /// traceability but not required by the runner itself.
    #[allow(dead_code)]
    pub description: &'static str,
    pub sql: &'static str,
}

/// Ordered migration list. Append new migrations here AND in `scripts/migrations.ts`.
pub fn migrations() -> Vec<MigrationDef> {
    vec![
        MigrationDef {
            version: 1,
            description: "create_c3bot_schema",
            sql: include_str!("../migrations/001_init.sql"),
        },
        MigrationDef {
            version: 2,
            description: "delivery_attendants",
            sql: include_str!("../migrations/002_delivery_attendants.sql"),
        },
        MigrationDef {
            version: 3,
            description: "product_catalog",
            sql: include_str!("../migrations/003_product_catalog.sql"),
        },
    ]
}

/// Open `db_path` and apply every pending migration idempotently.
pub fn run_migrations(db_path: &Path, runtime: &str) -> rusqlite::Result<()> {
    let mut conn = Connection::open(db_path)?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    apply_all(&mut conn, &migrations(), runtime)
}

fn apply_all(conn: &mut Connection, migs: &[MigrationDef], runtime: &str) -> rusqlite::Result<()> {
    ensure_tracking_table(conn)?;
    for m in migs {
        if is_applied(conn, m.version)? {
            continue; // already recorded by some runtime -> NO-OP
        }
        apply_one(conn, m)?;
        record(conn, m, runtime)?;
    }
    Ok(())
}

/// Tracking table shared across runtimes (columns mandated by ADR-001).
fn ensure_tracking_table(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS __c3bot_migrations (\n\
         \x20 migration_version INTEGER PRIMARY KEY,\n\
         \x20 checksum TEXT NOT NULL,\n\
         \x20 executed_at TEXT NOT NULL,\n\
         \x20 runtime TEXT NOT NULL\n\
         );",
    )
}

fn is_applied(conn: &Connection, version: i64) -> rusqlite::Result<bool> {
    let mut stmt = conn.prepare("SELECT 1 FROM __c3bot_migrations WHERE migration_version = ?1")?;
    stmt.exists(params![version])
}

fn record(conn: &Connection, m: &MigrationDef, runtime: &str) -> rusqlite::Result<()> {
    conn.execute(
        "INSERT OR IGNORE INTO __c3bot_migrations \
         (migration_version, checksum, executed_at, runtime) \
         VALUES (?1, ?2, datetime('now'), ?3)",
        params![m.version, checksum(m.sql), runtime],
    )?;
    Ok(())
}

/// Apply one migration in a transaction, guarding each statement so re-runs are safe.
fn apply_one(conn: &mut Connection, m: &MigrationDef) -> rusqlite::Result<()> {
    let tx = conn.transaction()?;
    for stmt in split_statements(m.sql) {
        if let Some((table, column)) = parse_add_column(&stmt) {
            if column_exists(&tx, &table, &column)? {
                continue; // ADD COLUMN has no IF NOT EXISTS -> skip when present
            }
        }
        tx.execute_batch(&stmt)?;
    }
    tx.commit()
}

fn column_exists(conn: &Connection, table: &str, column: &str) -> rusqlite::Result<bool> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({table})"))?;
    let mut rows = stmt.query([])?;
    while let Some(row) = rows.next()? {
        let name: String = row.get(1)?; // index 1 = column name
        if name.eq_ignore_ascii_case(column) {
            return Ok(true);
        }
    }
    Ok(false)
}

/// Split a SQL script into statements on `;`, dropping comments and blank lines.
/// Migration files MUST NOT contain `;` inside string literals (they do not).
fn split_statements(sql: &str) -> Vec<String> {
    sql.split(';')
        .map(strip_line_comments)
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect()
}

fn strip_line_comments(stmt: &str) -> String {
    stmt.lines()
        .map(|line| match line.find("--") {
            Some(i) => &line[..i],
            None => line,
        })
        .collect::<Vec<_>>()
        .join("\n")
}

/// If `stmt` is `ALTER TABLE <t> ADD COLUMN <c> ...`, return `(table, column)`.
fn parse_add_column(stmt: &str) -> Option<(String, String)> {
    let normalized = stmt.split_whitespace().collect::<Vec<_>>().join(" ");
    let lower = normalized.to_ascii_lowercase();
    if !lower.starts_with("alter table ") {
        return None;
    }
    let add_idx = lower.find(" add column ")?;
    let table = normalized["alter table ".len()..add_idx]
        .trim()
        .trim_matches('"')
        .to_string();
    let rest = &normalized[add_idx + " add column ".len()..];
    let column = rest.split_whitespace().next()?.trim_matches('"').to_string();
    if table.is_empty() || column.is_empty() {
        None
    } else {
        Some((table, column))
    }
}

/// FNV-1a 64-bit checksum (hex). Matches the JS implementation in
/// `scripts/migrations.ts` so the same file yields the same checksum in both runtimes.
fn checksum(sql: &str) -> String {
    let mut hash: u64 = 0xcbf29ce484222325;
    for b in sql.as_bytes() {
        hash ^= *b as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    format!("{hash:016x}")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn mem() -> Connection {
        Connection::open_in_memory().unwrap()
    }

    #[test]
    fn parses_add_column_only() {
        assert_eq!(
            parse_add_column("ALTER TABLE attendants ADD COLUMN display_name TEXT NOT NULL DEFAULT ''"),
            Some(("attendants".into(), "display_name".into()))
        );
        assert_eq!(parse_add_column("CREATE TABLE IF NOT EXISTS x (id TEXT)"), None);
        assert_eq!(parse_add_column("UPDATE attendants SET name = 'x'"), None);
    }

    #[test]
    fn checksum_is_deterministic_and_hex16() {
        let a = checksum("SELECT 1;");
        assert_eq!(a, checksum("SELECT 1;"));
        assert_eq!(a.len(), 16);
        assert_ne!(a, checksum("SELECT 2;"));
    }

    #[test]
    fn rerun_is_a_noop() {
        let migs = vec![
            MigrationDef {
                version: 1,
                description: "init",
                sql: "CREATE TABLE IF NOT EXISTS t (id TEXT PRIMARY KEY);",
            },
            MigrationDef {
                version: 2,
                description: "add",
                sql: "ALTER TABLE t ADD COLUMN name TEXT NOT NULL DEFAULT '';",
            },
        ];
        let mut c = mem();
        apply_all(&mut c, &migs, "test").unwrap();
        // Second run must not error and must keep exactly two tracked versions.
        apply_all(&mut c, &migs, "test").unwrap();
        assert!(column_exists(&c, "t", "name").unwrap());
        let count: i64 = c
            .query_row("SELECT count(*) FROM __c3bot_migrations", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 2);
    }

    #[test]
    fn guard_skips_already_existing_column() {
        // Simulates the divergence that caused the panic: schema already has the
        // column, but this migration version was never recorded for this runtime.
        let mut c = mem();
        c.execute_batch("CREATE TABLE t (id TEXT, name TEXT);").unwrap();
        let migs = vec![MigrationDef {
            version: 1,
            description: "add",
            sql: "ALTER TABLE t ADD COLUMN name TEXT;",
        }];
        apply_all(&mut c, &migs, "test").unwrap(); // must not panic with duplicate column
        assert!(column_exists(&c, "t", "name").unwrap());
    }

    #[test]
    fn applies_real_migrations_idempotently() {
        let mut c = mem();
        apply_all(&mut c, &migrations(), "test").unwrap();
        apply_all(&mut c, &migrations(), "test").unwrap(); // re-run is a NO-OP across all 3
        let catalog_items: i64 = c
            .query_row(
                "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='catalog_items'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(catalog_items, 1);
        assert!(column_exists(&c, "products", "unit_of_measure").unwrap());
        let versions: i64 = c
            .query_row("SELECT count(*) FROM __c3bot_migrations", [], |r| r.get(0))
            .unwrap();
        assert_eq!(versions, 3);
    }
}
