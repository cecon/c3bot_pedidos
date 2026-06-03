# Implementation Plan: Merchant (Restaurant) Registry — iFood Merchant API-aligned

**Branch**: `006-merchant-registry` | **Date**: 2026-06-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-merchant-registry/spec.md`

## Summary

Enrich the catalog's single `store` (feature 005) into a **merchant** profile modeled on the
iFood Merchant API v1.0, and add opening-hours (shift model), interruptions, and computed
status/availability. The merchant is **single per installation** and **consolidates** the catalog
store: the existing `stores` row becomes the merchant (the catalog's `catalogs.store_id` keeps
pointing at it), enriched with merchant fields plus related tables for operations, shifts, and
interruptions. Pure domain rules (merchant/shift/interruption validation, status resolution) carry
the StrykerJS mutation gate; the HTTP API mirrors the iFood Merchant endpoints (list/details,
status, interruptions, opening-hours) as the OpenAPI source of truth; a presentational Merchant
panel (enriching the store-settings editor) provides maintenance. No iFood synchronization is
built; external references only. Check-in QR is out of scope.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19, Rust 2021 edition.

**Primary Dependencies**: Tauri 2, Vite 7, Mantine 9 (+ form/hooks/notifications), Lucide React,
Tauri SQL plugin, Drizzle ORM + Drizzle Kit, Vitest 4 + Testing Library, StrykerJS 9, `rusqlite`
(migration runner), `swagger-ui-dist` (API docs). No new runtime dependencies expected.

**Storage**: SQLite (`sqlite:c3bot.db`). Drizzle schema in `src/db/*`. Migrations applied by the
unified idempotent runner (ADR-0003) registered in `src-tauri/src/migrations.rs` and
`scripts/migrations.ts` — next file `004_merchant_registry.sql`. Money (average ticket) as integer
cents (BRL).

**Testing**: Vitest unit tests for merchant domain rules + persistence state; component tests for
the merchant UI; StrykerJS mutation (≥85% break) on the shared merchant rules; `pnpm typecheck`,
`pnpm test`, `pnpm test:mutation`, `pnpm build`, `cargo check`/`cargo test`.

**Target Platform**: Windows desktop first via Tauri; Vite browser validation; catalog/merchant DB
operations through the local `node:http` API (`VITE_C3BOT_API_BASE_URL`).

**Project Type**: Local-first desktop admin app (single project; `src/` frontend + `src-tauri/`
Rust shell + `scripts/` local API).

**Performance Goals**: List the registry (single merchant) in under 1 second (SC-002); create the
merchant profile in under 5 minutes (SC-001); status computed at read time, no background job.

**Constraints**: Dark operator UI; single store/merchant per installation (no multi-tenant); no
iFood sync (external-reference fields only); direct SQL limited to the ORM proxy + migration runner;
schema changes via generated command trace; no PII/secrets logged.

**Scale/Scope**: One merchant, a handful of operations/shifts/interruptions. New schema (~3 tables +
`stores` columns), one idempotent migration, one domain rules module, merchant API endpoints +
OpenAPI, client, and a merchant UI panel. No new DB engine, UI framework, or external service.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-Driven Product Slices | Spec + plan + tasks precede code; US1–US4 independently testable; US1 (merchant profile) is the MVP slice. | PASS |
| II. Local-First Desktop Stack | Tauri/Vite/React/TS/Mantine/Rust/SQLite only; merchant persists locally; iFood integration deferred (reference fields). Reuses the idempotent migration runner (ADR-0003). | PASS |
| III. Session Security and Privacy | Merchant data holds no session tokens/credentials; address/CNPJ are operator data, not logged as secrets. The 401/403 model is data shape, not a new auth store. | PASS |
| IV. Test and Mutation Gates | Merchant/shift/interruption validation and status resolution are pure functions with unit tests + StrykerJS at 85% break. | PASS |
| V. Operator-Grade Dark UX | Merchant maintained in the existing dark workspace; dense, keyboard-friendly; enriches the store-settings editor. | PASS |

**Result**: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/006-merchant-registry/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── openapi.yaml          # Merchant endpoints contract (design artifact)
│   └── merchant-contract.md  # Domain/HTTP/UI contract
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks output (not created here)
```

### Source Code (repository root)

```text
src/
├── db/
│   ├── schema.ts                 # re-export merchant schema
│   ├── catalogSchema.ts          # `stores` table — EXTEND with merchant columns
│   └── merchantSchema.ts         # NEW: merchant_operations, merchant_shifts, merchant_interruptions
├── domain/
│   ├── types.ts                  # + merchant value types (OperationName, MerchantState, DayOfWeek…)
│   ├── merchant/
│   │   ├── validation.ts         # NEW: validateMerchant, validateShift, validateInterruption
│   │   ├── status.ts             # NEW: resolveMerchantStatus (open/closed, state, validations)
│   │   ├── interruptions.ts      # NEW: canDeleteInterruption, findInterruptionOverlap
│   │   └── *.test.ts             # unit tests (mutation-covered)
│   └── merchantPersistence.ts    # NEW: load/empty/error/ready state machine
├── services/
│   └── merchantApi.ts            # NEW: typed client (merchant, status, interruptions, hours)
└── components/
    ├── MerchantPanel.tsx         # NEW: profile + operations + hours + interruptions + status
    ├── ShiftEditor.tsx           # NEW: weekly shifts (dayOfWeek/start/duration)
    ├── InterruptionsEditor.tsx   # NEW: list/create/delete interruptions
    └── *.test.tsx

scripts/api/
├── merchant.ts                   # NEW: GET /merchants, GET /merchants/{id}, PUT profile
├── merchantStatus.ts             # NEW: GET /merchants/{id}/status(/{operation})
├── interruptions.ts              # NEW: list/create/delete interruptions
├── openingHours.ts               # NEW: GET/PUT opening-hours (shifts)
├── router.ts                     # wire merchant routes
└── openapi.ts                    # add merchant paths (source of truth)

src-tauri/
├── migrations/004_merchant_registry.sql   # NEW: idempotent (ADR-0003)
├── src/migrations.rs                       # register version 4
└── (scripts/migrations.ts                  # register version 4)
```

**Structure Decision**: Single local-first desktop project, mirroring feature 005. The merchant
**reuses and extends** the catalog's `stores` row (single merchant; preserves `catalogs.store_id`).
Pure rules live in `src/domain/merchant/*` for unit/mutation testing; the API and UI are thin and
follow the established patterns (idempotent migration runner, OpenAPI source of truth, presentational
components + typed client).

## Complexity Tracking

No constitution violations; section intentionally empty.
