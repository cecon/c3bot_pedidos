# Research: Attendant Database Persistence and ORM Governance

## Decision: Use Drizzle ORM with the SQLite proxy driver over the existing Tauri SQL plugin

**Rationale**: Drizzle provides typed SQLite table definitions and query builders while
allowing a custom proxy callback for database communication. That fits the current
Tauri architecture because the Tauri SQL plugin already owns the local SQLite
connection inside the desktop runtime. The proxy adapter can translate Drizzle-built
queries to Tauri SQL `select` and `execute` calls while repository code stops writing
raw SQL directly.

**Alternatives considered**:

- Keep direct Tauri SQL calls: rejected because the ADR requires ORM-based
  manipulation and direct repository SQL would continue the drift risk.
- Prisma: rejected for this local Tauri frontend workflow because it usually expects a
  Node/server runtime or generated client engine path that is heavier than the current
  desktop/browser boundary.
- Kysely: rejected because it is primarily a typed query builder and does not satisfy
  the requested ORM governance as cleanly as Drizzle plus Drizzle Kit.

**Primary references**:

- Drizzle Proxy: https://orm.drizzle.team/docs/connect-drizzle-proxy
- Tauri SQL JavaScript API: https://tauri.app/reference/javascript/sql/

## Decision: Use Drizzle Kit command generation for future schema migrations

**Rationale**: Drizzle Kit can compare TypeScript schema definitions with migration
snapshots and generate SQL migrations through a terminal command. This directly
supports the ADR rule that schema migrations must be command-generated and traceable
in review. Generated SQL remains reviewable before it is registered with Tauri.

**Alternatives considered**:

- Continue handwritten `src-tauri/migrations/*.sql`: rejected because it conflicts
  with the new governance rule.
- Use `drizzle-kit push`: rejected for committed schema changes because it applies
  changes directly and does not preserve a reviewed migration file as the durable
  artifact.
- Use a separate Rust migration generator: rejected because the application data
  access layer is TypeScript-facing and Drizzle keeps schema, ORM queries, and
  migration generation in one TypeScript workflow.

**Primary reference**:

- Drizzle Kit generate: https://orm.drizzle.team/docs/drizzle-kit-generate

## Decision: Keep existing historical migrations and bootstrap Drizzle schema for current tables

**Rationale**: The project already has Tauri-registered SQLite migrations that create
the current schema. This feature should not rewrite migration history. Instead, it
adds Drizzle schema declarations that match the current tables and uses generated
migrations only for future schema changes. Existing migrations remain registered so
new installs can still initialize the database.

**Alternatives considered**:

- Replace all historical migrations with a generated baseline: rejected because it
  risks changing already reviewed schema history and complicates upgrades.
- Generate a no-op migration only to prove tooling: rejected because it adds noise
  without changing schema.

## Decision: Remove only runtime attendant mock data; keep test fixtures isolated

**Rationale**: The user requirement is to stop showing mock attendants as operational
employees. Automated tests still need explicit fixtures to validate UI and domain
rules. Fixtures are acceptable when imported only by tests or stories and never by
the runtime application path.

**Alternatives considered**:

- Delete all attendant examples from tests: rejected because it would reduce coverage
  for validation, row actions, and transfer eligibility.
- Keep mock attendants as browser fallback: rejected because the spec requires no
  operational fallback to mock records.

## Decision: Browser-only Vite runtime shows database-unavailable or empty/error state instead of mock attendants

**Rationale**: The current SQL database is only available inside Tauri. When running
in a plain browser, the app must not invent operational attendants. It can still
render the attendants page, form, and tests, but persistence-backed actions should be
blocked or clearly marked unavailable unless a test harness supplies fixtures.

**Alternatives considered**:

- Use localStorage as browser persistence: rejected because it introduces a second
  runtime storage mechanism.
- Keep in-memory attendants in production browser mode: rejected because it recreates
  the mock/fallback problem.
