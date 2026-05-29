# Contract: Database Access and Migration Governance

## Scope

Defines review expectations for database access and schema changes after ADR 0001.

## ORM Access Boundary

- Application-owned database reads and writes must go through the approved ORM
  repository boundary.
- UI components, hooks, and domain helpers must not call the database directly.
- Direct SQL is permitted only inside:
  - the ORM proxy/adapter that bridges ORM queries to the Tauri SQL plugin,
  - generated or historical migration files,
  - schema introspection/generation tooling,
  - a documented exception accepted in a future ADR or review note.

## Migration Generation

- Future schema changes must be generated from a terminal command.
- The generation command must be recorded in the plan, task output, PR description, or
  migration review notes.
- `drizzle-kit generate` is the accepted generation path unless planning records a
  replacement.
- Direct schema application commands that do not create a reviewed migration file are
  not accepted for committed schema changes.

## Migration Review

- Generated migrations must be reviewed before commit.
- Manual edits to generated SQL must include the reason for the edit.
- Generated SQL that must run in Tauri must be registered with the Tauri SQL plugin
  migration list.
- Runtime seed/demo operational records are not allowed in migrations unless a future
  explicit demo/import mode is approved.

## Compliance Checks

- Code review checks that repositories use ORM operations.
- Tests cover at least one ORM repository read and write path for attendants.
- CI runs typecheck, tests, mutation tests, build, and Cargo check before a feature is
  marked ready.
