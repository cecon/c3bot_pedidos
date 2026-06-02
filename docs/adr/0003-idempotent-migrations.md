# ADR 0003: Idempotent, Unified Migrations Across Runtimes

**Status**: Accepted

**Date**: 2026-06-01

> Filed as `0003-idempotent-migrations.md` following the existing ADR numbering
> (`0001`, `0002`). Referenced elsewhere as "ADR-001 idempotent migrations".

## Context

C3Bot's local SQLite database (`c3bot.db`) is migrated by **two independent runtimes**
that open the **same file**:

- the **Tauri desktop shell** (`src-tauri/src/lib.rs`), and
- the **Node dev API** (`scripts/attendant-api.ts`), used by `pnpm dev` / browser
  validation and headless flows.

Migrations must apply without a shell command at the end user's machine — the desktop
runtime has to migrate the database itself on startup.

## Problem

The two runtimes tracked applied migrations in **different** tables:

- the Tauri SQL plugin used its own internal `sqlx` migrations table;
- the dev API used `__c3bot_migrations` with a bespoke guard.

`002_delivery_attendants.sql` performs `ALTER TABLE attendants ADD COLUMN …`, and SQLite
has **no `IF NOT EXISTS` for `ADD COLUMN`**. When one runtime had already advanced the
schema, the other's tracking table did not reflect it, so the plugin **re-ran `002`** and
panicked:

```text
PluginInitialization("sql", "while executing migration 2: error returned from database:
(code: 1) duplicate column name: display_name")
```

This blocked application startup and would recur with `003_product_catalog.sql` (≈15
tables plus new columns on `products`).

## Decision

Adopt a **single, unified, idempotent migration mechanism** shared in semantics by all
runtimes:

1. **One shared tracking table** `__c3bot_migrations`:

   ```sql
   CREATE TABLE IF NOT EXISTS __c3bot_migrations (
     migration_version INTEGER PRIMARY KEY,
     checksum          TEXT NOT NULL,   -- FNV-1a 64-bit hex of the migration SQL
     executed_at       TEXT NOT NULL,
     runtime           TEXT NOT NULL    -- "tauri" | "dev-api" | "legacy"
   );
   ```

2. **Version gating**: a migration already recorded by *any* runtime is skipped (NO-OP).
   This removes the cross-runtime divergence that caused the panic.

3. **Per-statement guards** when applying a migration:
   - before `ALTER TABLE <t> ADD COLUMN <c> …`, check `PRAGMA table_info(<t>)` and skip
     the statement if `<c>` already exists;
   - all other DDL uses `CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`.

4. **Implementations** (kept in lock-step; the same migration list and the same FNV-1a
   checksum in both, so a file yields the same checksum everywhere):
   - Rust: `src-tauri/src/migrations.rs`, invoked from `lib.rs` `setup()`. The Tauri SQL
     plugin **no longer owns migrations** (`add_migrations` removed); it is used only for
     runtime queries from the frontend. The runner resolves the same path the plugin uses
     (`app_config_dir()/c3bot.db`).
   - Node: `scripts/migrations.ts`, used by `scripts/attendant-api.ts`. It also reconciles
     a pre-existing legacy `__c3bot_migrations` (version/description/applied_at) into the
     shared shape.

5. **`rusqlite` dependency** (feature `bundled`, pinned to `0.32` so `libsqlite3-sys 0.30`
   unifies with the version pulled by `tauri-plugin-sql`'s `sqlx 0.8`). This is the
   structural change required to give the Rust runtime synchronous, guarded SQLite access
   at startup, since the plugin's `add_migrations` cannot guard `ADD COLUMN` or use a
   shared tracking table.

6. **Authoring rule for future migrations** (e.g. `003_product_catalog.sql`): use
   `CREATE TABLE/INDEX IF NOT EXISTS`; express column additions so the `ADD COLUMN` guard
   applies; make data seeds re-runnable (`INSERT … WHERE NOT EXISTS`); avoid `;` inside
   string literals (the statement splitter splits on `;`).

Migrations continue to be **generated** via the ADR-0001 command trace
(`pnpm db:generate`); this ADR governs how they are **applied**.

## Consequences

- Re-running migrations (in either order, across both runtimes) is a safe NO-OP; the
  startup panic is eliminated.
- New migrations must be registered in **both** `src-tauri/src/migrations.rs` and
  `scripts/migrations.ts` (a divergence risk mitigated by the shared checksum and tests).
- A second SQLite linkage (`rusqlite`) is compiled into the desktop binary; pinning keeps
  `libsqlite3-sys` unified, avoiding a duplicate native build.
- The migration mechanism is covered by tests: `src-tauri/src/migrations.rs` (`#[cfg(test)]`)
  and `scripts/migrations.test.ts` (idempotent re-run, `ADD COLUMN` guard, legacy
  reconciliation, checksum determinism).

## Alternatives considered

- **Keep the plugin's `add_migrations` and only make SQL idempotent** — rejected: raw
  SQLite cannot guard `ADD COLUMN`, and the plugin runs SQL without inspecting the schema.
- **Make the dev API write the plugin's internal `sqlx` table** — rejected: depends on
  plugin internals and is fragile.
- **Generate OpenAPI/migrations from annotations / add an ORM migrate-at-runtime layer** —
  rejected as heavier than a small guarded runner; `drizzle-kit` cannot run at the end
  user's machine without a shell.
- **Delete the dev DB on mismatch** — rejected as a band-aid that loses data and does not
  prevent recurrence.
