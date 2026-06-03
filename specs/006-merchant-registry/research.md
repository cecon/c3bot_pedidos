# Phase 0 Research: Merchant Registry

All Technical Context unknowns resolved against the codebase (feature 005 conventions),
the iFood Merchant API v1.0 shape, and the spec clarifications. No open NEEDS CLARIFICATION.

## R1. Consolidation — extend the existing `stores` row into the merchant

- **Decision**: The merchant is the existing single `stores` row (feature 005). Extend `stores`
  with merchant columns (`corporate_name`, `description`, `average_ticket_cents`, `exclusive`,
  `type`) rather than creating a separate `merchants` table. The catalog's `catalogs.store_id`
  keeps pointing at it unchanged. API/UI use "merchant" terminology mapping to this row.
- **Rationale**: Honors the clarification ("consolidate"); single-store; preserves catalog FKs and
  the seeded default row; one model, no dual source of truth. Minimal migration risk.
- **Alternatives considered**: New `merchants` table + FK from catalogs — rejected: breaks/duplicates
  the store relationship and the seeded row for no benefit in a single-store product.

## R2. Opening hours — shift model supersedes store-scope schedules

- **Decision**: Opening hours are **shifts** in `merchant_shifts` (id, day_of_week MONDAY..SUNDAY,
  start "HH:MM" or "HH:MM:SS", duration minutes, enabled, created_at), per the iFood model. This is
  the canonical store/merchant hours. The catalog's `availability_schedules` rows with
  `scope_type = 'store'` are **migrated** into `merchant_shifts` (start→start, duration = end−start
  in minutes) and store-scope is no longer written there; catalog/category/item schedules remain in
  `availability_schedules`.
- **Rationale**: Aligns store hours with the iFood shift representation and the spec; one place for
  merchant hours. Catalog availability resolution reads merchant shifts for the store scope.
- **Alternatives considered**: Keep store hours only in `availability_schedules` (start/end) —
  rejected: diverges from the iFood shift model the spec mandates and splits merchant hours.

## R3. Interruptions

- **Decision**: `merchant_interruptions` (id, description, start ISO-8601, end ISO-8601, created_at).
  Pure rules: `validateInterruption` (start < end, required fields), `findInterruptionOverlap`
  (against existing), and `canDeleteInterruption(interruption, now)` blocking deletion within a
  **recently-created threshold** (default 60 seconds, configurable in planning). List returns
  current + future (end ≥ now).
- **Rationale**: Mirrors the iFood interruption endpoints and error cases (InterruptionOverlap,
  RecentlyCreatedInterruption, InvalidInterruption). Rules are pure and mutation-testable.
- **Alternatives considered**: No deletion guard — rejected: spec requires the recently-created
  conflict (409).

## R4. Status / availability resolution

- **Decision**: A pure `resolveMerchantStatus(input, now)` computes, per operation/sales channel:
  `available` (boolean), `state` (OK | WARNING | CLOSED | ERROR), `reopenable`, and `validations`
  (id, code, state, message{title,subtitle,description}). Inputs: merchant status, the operation's
  enabled flag, shifts, and active interruptions. "Available now" = operation enabled AND within a
  shift AND not within an active interruption; otherwise CLOSED with a validation explaining why.
- **Rationale**: Mirrors the iFood Status schema; centralizes open/closed logic in one
  mutation-tested function (FR-013..015, SC-006). No background job — computed on read.
- **Alternatives considered**: Persisting a status flag — rejected: derivable and would drift.

## R5. Pagination with a single merchant

- **Decision**: `GET /merchants?page&size` returns an array containing the single merchant; echo
  validated pagination (page ≥ 1, default size 100). `GET /merchants/{id}` returns details.
- **Rationale**: Keeps the iFood-shaped contract while honoring single-store; trivial but
  future-proof if multi-merchant is ever revisited.
- **Alternatives considered**: Drop pagination — rejected: diverges from the iFood contract for no
  gain.

## R6. Reuse feature-005 conventions

- **Decision**: Drizzle schema in `src/db/*` (text PKs, snake_case, integer-boolean, money cents);
  migration `004_merchant_registry.sql` authored idempotent per ADR-0003 (CREATE TABLE/INDEX IF NOT
  EXISTS, guarded ADD COLUMN, re-runnable seeds) and registered in BOTH runners (`migrations.rs`,
  `scripts/migrations.ts`). HTTP endpoints in `scripts/api/*` via the shared db/http modules and the
  router; OpenAPI (`scripts/api/openapi.ts`) documents them (single source of truth, coverage test).
  Pure rules in `src/domain/merchant/*` with colocated tests + Stryker mutate entries; typed client
  `src/services/merchantApi.ts`; presentational UI + a workspace nav entry.
- **Rationale**: Consistency with the catalog feature, the migration-safety ADR, and the test/mutation
  gates.
- **Alternatives considered**: New patterns — rejected; the established stack is sufficient.

## R7. Authorization model (401 vs 403)

- **Decision**: Model the error shape (standardized code/message; distinguish unauthenticated 401
  from forbidden 403) at the contract level. The actual identity provider is out of scope; the local
  API keeps its existing optional bearer-token behavior.
- **Rationale**: Matches the iFood contract surface without introducing an auth system now.
- **Alternatives considered**: Build an auth provider — rejected: out of scope per spec.
