# ADR 0001: Database Access and Migration Generation

**Status**: Accepted

**Date**: 2026-05-29

## Context

C3Bot is a local-first desktop application with application-owned operational data.
Database reads, writes, and schema changes must stay coherent across the user
interface, local persistence, migrations, and tests. Direct ad hoc SQL and manually
authored migration files make it easier for runtime behavior, schema history, and
review expectations to drift.

The attendants workflow also exposed a product risk: mock attendants can be confused
with real operational employees when they are loaded into production runtime paths.

## Decision

Application-owned database manipulation must go through the approved ORM-based access
path. UI, hooks, domain helpers, and services must not perform direct database reads
or writes outside that access path unless a later ADR records a specific exception.

Schema migrations must be generated through terminal commands from the approved
database tooling. Pull requests that include schema changes must retain the command
used to generate the migration in the related plan, task, PR description, or migration
review notes.

Generated migration files must still be reviewed before commit. Manual edits are
allowed only when required to correct or annotate generated output, and the reason for
the edit must be documented with the migration review context.

Runtime code must not seed mock or demo operational records, including attendants,
into the production local database unless a future explicit demo/import mode is
approved.

## Consequences

- Future database work needs an ORM choice and migration command workflow before
  implementation.
- Existing database code touched by new work should be moved behind the approved
  ORM-based access path instead of extending direct SQL usage.
- Automated tests may use fixtures, but those fixtures must remain isolated from
  production runtime data paths.
- Migration review becomes reproducible because reviewers can see both the generated
  file and the command used to produce it.
