---
description: "Task list for Merchant (Restaurant) Registry"
---

# Tasks: Merchant (Restaurant) Registry — iFood Merchant API-aligned

**Input**: Design documents from `/specs/006-merchant-registry/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: INCLUDED — the project constitution (Principle IV, Test & Mutation Gates) and the
contract's test obligations require unit tests + StrykerJS (≥85% break) on `src/domain/merchant/**`,
plus API route tests and UI component tests. Mutation runs locally, NOT in CI.

**Organization**: Grouped by user story (US1–US4) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: US1 / US2 / US3 / US4
- All paths are repository-relative.

## Path Conventions

Single local-first desktop project: `src/` (frontend + domain), `src-tauri/` (Rust shell +
migrations), `scripts/` (local node:http API). Mirrors feature 005.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Schema + migration scaffolding for the merchant registry.

- [ ] T001 Add merchant value types (`OperationName`, `SalesChannelName`, `DayOfWeek`, `MerchantState`, `MerchantType`, `MerchantStatusValue`) to `src/domain/types.ts`
- [ ] T002 [P] Define Drizzle schema for `merchant_operations`, `merchant_shifts`, `merchant_interruptions` in `src/db/merchantSchema.ts` and re-export from `src/db/schema.ts`
- [ ] T003 Extend the `stores` table in `src/db/catalogSchema.ts` with merchant columns (`corporate_name`, `description`, `average_ticket_cents`, `exclusive`, `type`, `country`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The idempotent migration and shared API/client plumbing every story needs.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T004 Author idempotent migration `src-tauri/migrations/004_merchant_registry.sql` (ADR-0003): guarded `ALTER TABLE stores ADD COLUMN` for the new columns; `CREATE TABLE IF NOT EXISTS` for the three merchant tables + indexes; migrate `availability_schedules` rows with `scope_type='store'` into `merchant_shifts` (start→start, duration = end−start minutes); re-runnable
- [ ] T005 Register migration version 4 in the Rust runner `src-tauri/src/migrations.rs` (FNV-1a checksum) and verify `cargo check`/`cargo test`
- [ ] T006 Register migration version 4 in the Node runner `scripts/migrations.ts` (matching checksum) so the dev API applies it identically
- [ ] T007 [P] Create the merchant DB access helpers (load merchant + operations + shifts + interruptions; upsert profile) in `scripts/api/merchant.ts` scaffolding using the shared `scripts/api/db.ts`
- [ ] T008 Add merchant route group registration to `scripts/api/router.ts` (wire the handler modules created per-story)
- [ ] T009 [P] Create the typed client scaffold `src/services/merchantApi.ts` (base URL, fetch helpers, shared error shape `{ code, message }`)
- [ ] T010 [P] Add a "Merchant" entry to the workspace navigation and a placeholder `src/components/MerchantPanel.tsx` shell (presentational, props-only)

**Checkpoint**: Schema migrated on both runtimes; API/client/UI plumbing ready.

---

## Phase 3: User Story 1 — Maintain the merchant profile (Priority: P1) 🎯 MVP

**Goal**: Maintain the single merchant (basic info + address + operations + external reference);
iFood-shaped paginated list + details.

**Independent Test**: Edit the merchant (name, corporate name, type, address, one delivery
operation); open details and the list; confirm fields + external reference (or "not mapped" flag).

### Tests for User Story 1 ⚠️ (write first, ensure they FAIL)

- [ ] T011 [P] [US1] Unit tests for `validateMerchant` (name required, type/status enum, average ticket ≥0, lat/long ranges, ready-for-handoff requires cnpj+external code) in `src/domain/merchant/validation.test.ts`
- [ ] T012 [P] [US1] API tests for `GET /merchants` (pagination page≥1/size default 100), `GET /merchants/{id}` (404), `PUT /merchants/{id}` (200/400) in `scripts/api/merchant.test.ts`
- [ ] T013 [P] [US1] Component tests for `MerchantPanel` profile save-gating + "not mapped to destination" badge in `src/components/MerchantPanel.test.tsx`

### Implementation for User Story 1

- [ ] T014 [P] [US1] Implement `validateMerchant` (+ operation validation) in `src/domain/merchant/validation.ts`
- [ ] T015 [P] [US1] Implement the merchant→iFood-shape mapping (DB row → `Merchant`/`Address`/`Operation`) in `src/domain/merchant/mapping.ts`
- [ ] T016 [US1] Implement `GET /merchants`, `GET /merchants/{id}`, `PUT /merchants/{id}` handlers in `scripts/api/merchant.ts` (validate via domain; persist operations) and wire in `router.ts`
- [ ] T017 [US1] Implement merchant client methods (`listMerchants`, `getMerchant`, `updateMerchant`) in `src/services/merchantApi.ts`
- [ ] T018 [US1] Implement `MerchantPanel` profile + address + operations editor (props/callbacks: `onSaveProfile`, `onToggleOperation`) in `src/components/MerchantPanel.tsx`; wire data/actions in the container
- [ ] T019 [US1] Add the merchant paths (list/detail/PUT + Merchant/Address/Operation schemas) to the generated OpenAPI in `scripts/api/openapi.ts` and extend the OpenAPI coverage test

**Checkpoint**: US1 fully functional — merchant maintainable, listed, detailed; MVP deployable.

---

## Phase 4: User Story 2 — Configure opening hours (Priority: P2)

**Goal**: Define/replace weekly opening-hours shifts (day, start, duration); read current set.

**Independent Test**: Set a Monday lunch shift (start 11:00, duration 180), confirm it reports the
window; remove all Sunday shifts and confirm Sunday reads closed.

### Tests for User Story 2 ⚠️

- [ ] T020 [P] [US2] Unit tests for `validateShift` (day enum, start `HH:MM(:SS)`, duration 1..1440) in `src/domain/merchant/validation.test.ts`
- [ ] T021 [P] [US2] API tests for `GET/PUT /merchants/{id}/opening-hours` (replace set; 400 on invalid shift) in `scripts/api/openingHours.test.ts`
- [ ] T022 [P] [US2] Component tests for `ShiftEditor` save-gating on invalid shifts in `src/components/ShiftEditor.test.tsx`

### Implementation for User Story 2

- [ ] T023 [US2] Implement `validateShift` in `src/domain/merchant/validation.ts` (extends US1 file)
- [ ] T024 [US2] Implement `GET`/`PUT /merchants/{id}/opening-hours` (replace shifts transactionally) in `scripts/api/openingHours.ts` and wire in `router.ts`
- [ ] T025 [US2] Add `getOpeningHours`/`replaceOpeningHours` to `src/services/merchantApi.ts`
- [ ] T026 [P] [US2] Implement presentational `ShiftEditor` (weekly shift list; disable save until all shifts valid) in `src/components/ShiftEditor.tsx` and mount in `MerchantPanel`
- [ ] T027 [US2] Add opening-hours paths + `Shift`/`OpeningHours` schemas to `scripts/api/openapi.ts` and update coverage test

**Checkpoint**: US1 + US2 work independently.

---

## Phase 5: User Story 3 — Manage interruptions (Priority: P3)

**Goal**: Create/list/delete interruptions; reject invalid, recently-created deletion, and overlaps.

**Independent Test**: Create a future interruption, list it, attempt deleting a just-created one
(rejected), delete an older one successfully.

### Tests for User Story 3 ⚠️

- [ ] T028 [P] [US3] Unit tests for `validateInterruption` (start<end, required fields), `findInterruptionOverlap`, `canDeleteInterruption` (60s threshold) in `src/domain/merchant/interruptions.test.ts`
- [ ] T029 [P] [US3] API tests for interruptions list/create/delete incl. 400, 404 (InterruptionNotFound), 409 (InterruptionOverlap, RecentlyCreatedInterruption) in `scripts/api/interruptions.test.ts`
- [ ] T030 [P] [US3] Component tests for `InterruptionsEditor` create-gating + non-blocking delete-guard warning in `src/components/InterruptionsEditor.test.tsx`

### Implementation for User Story 3

- [ ] T031 [P] [US3] Implement `validateInterruption`, `findInterruptionOverlap`, `canDeleteInterruption` in `src/domain/merchant/interruptions.ts`
- [ ] T032 [US3] Implement `GET`/`POST`/`DELETE /merchants/{id}/interruptions` (overlap → 409, recently-created → 409, standardized error codes) in `scripts/api/interruptions.ts` and wire in `router.ts`
- [ ] T033 [US3] Add `listInterruptions`/`createInterruption`/`deleteInterruption` to `src/services/merchantApi.ts`
- [ ] T034 [P] [US3] Implement presentational `InterruptionsEditor` (list + create form gated by `validateInterruption`; surface delete-guard as warning) in `src/components/InterruptionsEditor.tsx` and mount in `MerchantPanel`
- [ ] T035 [US3] Add interruptions paths + `Interruption`/`InterruptionInput` schemas + 409 responses to `scripts/api/openapi.ts` and update coverage test

**Checkpoint**: US1–US3 independently functional.

---

## Phase 6: User Story 4 — View merchant status & availability (Priority: P4)

**Goal**: Report status per operation (available, state OK|WARNING|CLOSED|ERROR, reopenable,
validations); all operations or one; reject invalid operation.

**Independent Test**: With the merchant outside opening hours, status shows available=false, a
CLOSED state, and a validation explaining the closure.

### Tests for User Story 4 ⚠️

- [ ] T036 [P] [US4] Unit tests for `resolveMerchantStatus` covering open/closed across hours × interruption × enabled combinations, state + reopenable + validation codes in `src/domain/merchant/status.test.ts`
- [ ] T037 [P] [US4] API tests for `GET /merchants/{id}/status` and `/status/{operation}` (200 + invalid operation 400/404) in `scripts/api/merchantStatus.test.ts`
- [ ] T038 [P] [US4] Component tests for the status badges per operation in `src/components/MerchantPanel.test.tsx`

### Implementation for User Story 4

- [ ] T039 [P] [US4] Implement `resolveMerchantStatus(input, now)` (state rules, reopenable, validation codes `MERCHANT_UNAVAILABLE`/`OPERATION_DISABLED`/`OUTSIDE_OPENING_HOURS`/`ACTIVE_INTERRUPTION`) in `src/domain/merchant/status.ts`
- [ ] T040 [US4] Implement `GET /merchants/{id}/status` and `/status/{operation}` (invalid operation rejected) in `scripts/api/merchantStatus.ts` and wire in `router.ts`
- [ ] T041 [US4] Add `getStatus`/`getOperationStatus` to `src/services/merchantApi.ts`
- [ ] T042 [US4] Add per-operation status badges + validation messages to `MerchantPanel` (OK green / CLOSED gray / WARNING amber / ERROR red)
- [ ] T043 [US4] Add status paths + `Status`/`Validation` schemas to `scripts/api/openapi.ts` and update coverage test

**Checkpoint**: All four stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Migration safety, persistence state machine, mutation gate, docs.

- [ ] T044 [P] Implement the merchant persistence reducer (`empty→loading→ready|error`) in `src/domain/merchantPersistence.ts` with unit tests
- [ ] T045 [P] Add StrykerJS `mutate` entries for `src/domain/merchant/**` and confirm ≥85% break locally (`pnpm test:mutation`); do NOT add to CI
- [ ] T046 Verify migration idempotency: run the app + dev API twice on an existing feature-005 DB; assert no "duplicate column" error and store-scope hours migrated into shifts
- [ ] T047 [P] Update `docs/adr/0004-product-catalog-architecture.md` (or add a short note) referencing the store→merchant consolidation, and update any catalog docs mentioning the standalone `store`
- [ ] T048 Run `quickstart.md` end-to-end (US1–US4 + API docs Swagger menu) and run gates: `pnpm typecheck && pnpm test && pnpm build` + `cargo check && cargo test`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup; **BLOCKS all user stories** (migration must apply).
- **User Stories (Phase 3–6)**: all depend on Foundational; then proceed in priority order
  (P1→P2→P3→P4) or in parallel if staffed.
- **Polish (Phase 7)**: depends on the desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: after Foundational. No dependency on other stories (MVP).
- **US2 (P2)**: after Foundational. Independent; shares `validation.ts` and `MerchantPanel`.
- **US3 (P3)**: after Foundational. Independent.
- **US4 (P4)**: after Foundational. Logically reads hours (US2) + interruptions (US3) for full
  fidelity, but `resolveMerchantStatus` is independently testable with synthetic inputs.

### Within Each User Story

- Tests written first and FAIL before implementation.
- Domain rules → API handlers → client → UI → OpenAPI.
- Shared files (`src/domain/merchant/validation.ts`, `scripts/api/openapi.ts`, `router.ts`,
  `MerchantPanel.tsx`, `merchantApi.ts`) are NOT marked [P] across stories that touch them.

### Parallel Opportunities

- Setup T002 ‖ (T001, T003 touch different files from T002).
- Foundational T007 ‖ T009 ‖ T010 (after T004–T006).
- Within each story, all test tasks marked [P] run together; domain rule + mapping tasks marked
  [P] run together.
- Different stories can be staffed in parallel once Foundational completes.

---

## Parallel Example: User Story 1

```bash
# Tests first (parallel):
Task: "Unit tests for validateMerchant in src/domain/merchant/validation.test.ts"   # T011
Task: "API tests for /merchants in scripts/api/merchant.test.ts"                     # T012
Task: "Component tests for MerchantPanel in src/components/MerchantPanel.test.tsx"   # T013

# Then domain (parallel):
Task: "Implement validateMerchant in src/domain/merchant/validation.ts"             # T014
Task: "Implement merchant mapping in src/domain/merchant/mapping.ts"                 # T015
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational (CRITICAL: migration on both runtimes) → 3. Phase 3 US1
   → 4. **STOP & VALIDATE** US1 independently → 5. demo.

### Incremental Delivery

Foundation → US1 (MVP) → US2 → US3 → US4, each tested and demoable without breaking the prior.

### Notes

- [P] = different files, no incomplete-task dependency.
- Mutation runs locally only (per project decision — no mutation in CI for now).
- Commit after each task or logical group; the after_implement hook handles the final commit.
- **UI tasks** (T010, T018, T026, T034, T042) — before building each panel run `/ui-plan` and after
  implementing run `/ui-review`; both delegate to the **mantine-ux** agent and the preview harness to
  enforce operator-grade dark UX (presentational purity, domain-gated validation, dense/keyboard,
  accessible names). The PostToolUse hook auto-reminds on `src/components/**/*.tsx` edits.
