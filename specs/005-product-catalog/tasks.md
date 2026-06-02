---

description: "Task list for Product Catalog (iFood-aligned, destination-mapped)"
---

# Tasks: Product Catalog (iFood-aligned, destination-mapped)

**Input**: Design documents from `/specs/005-product-catalog/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (openapi.yaml, catalog-contract.md)

**Tests**: Included — the constitution (Principle IV) requires unit tests + StrykerJS mutation
coverage (≥85% break threshold) on shared pricing/validation/availability/readiness rules.

**Organization**: Tasks are grouped by user story and broken into small, independently
executable units (one rule / one endpoint group / one editor per task). `[x]` = already
delivered (data foundation + migration safety increments).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US6 maps to the spec's user stories

## Path Conventions

Local-first desktop app: frontend `src/`, Rust shell `src-tauri/`, local `node:http` API in
`scripts/`. The catalog frontend reads/writes through HTTP endpoints (via `VITE_C3BOT_API_BASE_URL`).
Pure domain rules live under `src/domain/catalog/` (split by concern for SRP + the 300-line gate).

---

## Phase 1: Setup

- [x] T001 Add `swagger-ui-dist` devDependency in `package.json`
- [x] T002 Extract shared HTTP helpers (CORS, auth, `readJson`, `writeJson`, body-limit) from `scripts/attendant-api.ts` into `scripts/api/http.ts`
- [x] T003 [P] Add catalog value types (`AvailabilityState`, `UnitOfMeasure`, `PizzaPricingStrategy`, `ScheduleWindow`, `WeeklyHours`) to `src/domain/types.ts`

---

## Phase 2: Foundational — Schema & Migration (DONE)

- [x] T004 Core catalog Drizzle tables in `src/db/catalogSchema.ts` (stores, catalogs, categories, catalog_items, option_groups, options, combo_components, availability_schedules)
- [x] T005 Pizza Drizzle tables in `src/db/pizzaSchema.ts` (pizza_configs/sizes/crusts/edges/flavors/flavor_prices)
- [x] T006 Extend `products` (image_base64, external_code, status, pause_until, unit_of_measure, reference_weight_grams) + re-export catalog/pizza schema in `src/db/schema.ts`
- [x] T007 Idempotent `src-tauri/migrations/003_product_catalog.sql` (IF NOT EXISTS, guarded ADD COLUMN, partial unique external_code indexes, re-runnable legacy data seed)
- [x] T008 Register migration v3 in `src-tauri/src/migrations.rs`
- [x] T009 Register migration v3 in `scripts/migrations.ts`
- [x] T010 Migration 003 idempotency tests (Rust `migrations.rs` + Node `scripts/migrations.test.ts`)

## Phase 2A: Migration Safety (DONE)

- [x] T011 Unified idempotent runner `src-tauri/src/migrations.rs` (shared `__c3bot_migrations`, PRAGMA guard, FNV checksum) + tests
- [x] T012 Wire runner into `src-tauri/src/lib.rs` setup(); remove plugin add_migrations; add `rusqlite`
- [x] T013 Shared Node runner `scripts/migrations.ts` + refactor `scripts/attendant-api.ts`; legacy table reconciliation
- [x] T014 Guard `src/setupTests.ts` for node-environment tests
- [x] T015 ADR `docs/adr/0003-idempotent-migrations.md`

## Phase 2B: Foundational — scaffolding (blocking US1+)

- [x] T016 [P] Create `src/domain/catalogPersistence.ts` (state machine `idle|loading|ready|empty|unavailable|error`, mirroring `attendantPersistence`)
- [x] T017 [P] Create `src/services/catalogApi.ts` client (typed `fetch` wrappers over `VITE_C3BOT_API_BASE_URL`, one function per endpoint)
- [x] T018 Create `scripts/api/router.ts` dispatcher and wire it into `scripts/attendant-api.ts` (keep attendant routes working; dispatch `/api/store|catalogs|categories|products|items|option-groups|options|pizza-config|combo|mapping`)
- [x] T019 Create `scripts/api/openapi.ts` (OpenAPI 3.1 doc object) and serve `GET /api/openapi.json` via the router

**Checkpoint**: API router + client + persistence skeletons ready; user stories can begin.

---

## Phase 3: User Story 1 — Core hierarchy + store profile + scheduling (P1) 🎯 MVP

**Goal**: Single store (name, alphanumeric CNPJ, address+coords, weekly hours), catalogs (own hours), ordered categories, products/items (Base64 image, unit/weight, price, status, external code), browsable with "not mapped" badge.
**Independent Test**: Create store + delivery catalog + 3 categories + 10 products (one unmapped); browse; alphanumeric CNPJ accepted, malformed rejected; weight product carries reference weight.

### Domain rules (tests first)

- [x] T020 [P] [US1] Unit tests for `validateCnpj` (legacy 14-digit valid/invalid; alphanumeric valid/invalid; never digits-only) in `src/domain/catalog/validation.test.ts`
- [x] T021 [US1] Implement `validateCnpj` in `src/domain/catalog/validation.ts`
- [x] T022 [P] [US1] Unit tests for `validateProduct` (empty name rejected; weight requires reference_weight_grams>0) in `src/domain/catalog/validation.test.ts`
- [x] T023 [US1] Implement `validateProduct` in `src/domain/catalog/validation.ts`
- [x] T024 [P] [US1] Unit tests for `validateCatalogItem` (price≥0; original≥price) in `src/domain/catalog/validation.test.ts`
- [x] T025 [US1] Implement `validateCatalogItem` in `src/domain/catalog/validation.ts`
- [x] T026 [P] [US1] Unit tests for `resolveAvailability` store→catalog scope chain (window in/out, closed day) in `src/domain/catalog/availability.test.ts`
- [x] T027 [US1] Implement `resolveAvailability` (store→catalog scope; `now`) in `src/domain/catalog/availability.ts`
- [x] T028 [US1] Register `src/domain/catalog/*.ts` rule files in `stryker.config.json` mutate list

### Server endpoints

- [x] T029 [P] [US1] Store endpoints `GET/PUT /api/store`, `PUT /api/store/hours` in `scripts/api/store.ts` (server-side `validateCnpj`)
- [x] T030 [P] [US1] Catalog endpoints `GET/POST /api/catalogs`, `GET/PUT/DELETE /api/catalogs/{id}`, `PUT /api/catalogs/{id}/hours` in `scripts/api/catalogs.ts`
- [x] T031 [P] [US1] Category endpoints `GET/POST /api/catalogs/{id}/categories`, `PUT/DELETE /api/categories/{id}`, `PUT /api/categories/{id}/order|hours` in `scripts/api/categories.ts`
- [x] T032 [P] [US1] Product endpoints `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}` (image_base64, unit_of_measure, reference_weight_grams) in `scripts/api/products.ts`
- [x] T033 [P] [US1] Item endpoints `POST /api/categories/{id}/items`, `PUT/DELETE /api/items/{id}`, `PUT /api/items/{id}/hours` in `scripts/api/items.ts`
- [x] T034 [US1] Add US1 paths/schemas to `scripts/api/openapi.ts`

### Client + persistence

- [x] T035 [US1] Store/catalog/category/product/item functions in `src/services/catalogApi.ts`
- [x] T036 [US1] Wire load/empty/error states in `src/domain/catalogPersistence.ts`

### UI (dark CatalogPanel)

- [x] T037 [P] [US1] Reusable `src/components/WeeklyHoursEditor.tsx` (per-day windows, closed day) + `WeeklyHoursEditor.test.tsx`
- [x] T038 [US1] Store settings editor (name, CNPJ inline validation, address, lat/long, external code, weekly hours) in `src/components/CatalogPanel.tsx`
- [x] T039 [US1] Catalog management (list/create/edit/remove/switch, context, external code, per-catalog hours) in `src/components/CatalogPanel.tsx`
- [x] T040 [US1] Category tree + reorder in `src/components/CatalogPanel.tsx`
- [x] T041 [US1] Product editor (Base64 image upload, unit/weight + reference weight, external code, "not mapped" badge) in `src/components/CatalogPanel.tsx`
- [x] T042 [US1] Item editor (price + promotional price, status, external code) in `src/components/CatalogPanel.tsx`
- [x] T043 [P] [US1] Component test for hierarchy + store profile + CNPJ feedback in `src/components/CatalogPanel.test.tsx`

### Integrity

- [x] T044 [P] [US1] `findDuplicateExternalCodes` (per-kind) test + impl in `src/domain/catalog/mapping.ts` (FR-026)
- [ ] T045 [P] [US1] Product-reuse test (one product in 2 categories + as option + pizza flavor) in `src/domain/catalog/validation.test.ts` (FR-007)
- [ ] T046 [US1] Verify legacy `products` data migration (default store/catalog/category/items) via a startup assertion or test

**Checkpoint**: MVP — browsable store-scoped catalog usable for order assembly.

---

## Phase 4: User Story 2 — Complements / option groups (P2)

**Independent Test**: "Pick a side (min1/max1)" + 3 priced options; rules persist; max<min rejected; mandatory shown; unmapped option flagged.

- [x] T047 [P] [US2] Unit tests for `validateOptionGroup` (max≥min; required iff min≥1; no per-option quantity) in `src/domain/catalog/validation.test.ts`
- [x] T048 [US2] Implement `validateOptionGroup` in `src/domain/catalog/validation.ts`
- [x] T049 [P] [US2] Option-group endpoints `POST /api/products/{id}/option-groups`, `PUT/DELETE /api/option-groups/{id}` in `scripts/api/optionGroups.ts`
- [x] T050 [P] [US2] Option endpoints `POST /api/option-groups/{id}/options`, `PUT/DELETE /api/options/{id}` in `scripts/api/optionGroups.ts`
- [x] T051 [US2] Add option-group/option paths to `scripts/api/openapi.ts`
- [x] T052 [US2] Option-group/option client functions in `src/services/catalogApi.ts`
- [x] T053 [US2] Option-group editor (min/max/required, options with price + external code, mandatory indicator) in `src/components/CatalogPanel.tsx`
- [x] T054 [P] [US2] Component test for option groups in `src/components/CatalogPanel.test.tsx`

**Checkpoint**: US1 + US2 independently functional.

---

## Phase 5: User Story 3 — Availability, pausing, schedules (P3)

**Independent Test**: Pause a product with return time (excluded until it passes, then auto-returns); lunch-only category schedule offered only in window.

- [x] T055 [P] [US3] Unit tests for pause auto-return + category/item schedule windows in `src/domain/catalog/availability.test.ts`
- [x] T056 [US3] Extend `resolveAvailability` with pause auto-return + full scope chain (category/item) in `src/domain/catalog/availability.ts`
- [x] T057 [P] [US3] Unit tests for `canAddToOrder` (blocks unavailable; warns unmapped; bypass attempts) in `src/domain/catalog/availability.test.ts`
- [x] T058 [US3] Implement `canAddToOrder` in `src/domain/catalog/availability.ts`
- [x] T059 [US3] `PATCH /api/products/{id}/status` (status + pauseUntil) in `scripts/api/products.ts` + openapi path
- [ ] T060 [US3] Availability UI (status toggle, pause-with-return-time, reuse WeeklyHoursEditor at category/item scope, excluded-from-order styling) in `src/components/CatalogPanel.tsx`
- [ ] T061 [P] [US3] Component test for availability/pause/schedule in `src/components/CatalogPanel.test.tsx`
- [ ] T062 [US3] Wire `canAddToOrder` into the order-assembly flow (`src/components/OpsPanel.tsx`/order path); block unavailable, warn unmapped (FR-012)
- [ ] T063 [P] [US3] Order-integrity regression tests (catalog change/pause/remove leaves existing order_items intact; invalid/blocked/duplicate/empty/post-close) (FR-025)

**Checkpoint**: US1–US3 independently functional.

---

## Phase 6: User Story 4 — Pizza & combo templates (P4)

**Independent Test**: Pizza 2 sizes/2 crusts/4 flavors per-size prices; `highest` → max flavor (for size) + crust + edge; switch `average`; combo bundles 3 products.

- [x] T064 [P] [US4] Unit tests for `computePizzaPrice` (highest, average, per-size lookup, min 1 flavor, ≤ maxFlavors, flavor without per-size price rejected) in `src/domain/catalog/pizza.test.ts`
- [x] T065 [US4] Implement `computePizzaPrice` (strategy switch, extensible) in `src/domain/catalog/pizza.ts`
- [x] T066 [P] [US4] Pizza-config endpoint `GET/PUT /api/categories/{id}/pizza-config` in `scripts/api/pizza.ts`
- [x] T067 [P] [US4] Pizza sub-resource endpoints `PUT /api/pizza-config/{id}/{sizes|crusts|edges|flavors|flavor-prices}` in `scripts/api/pizza.ts`
- [x] T068 [P] [US4] Combo endpoint `PUT /api/items/{id}/combo-components` in `scripts/api/combos.ts`
- [x] T069 [US4] Add pizza/combo paths to `scripts/api/openapi.ts`
- [x] T070 [US4] Pizza + combo client functions in `src/services/catalogApi.ts`
- [ ] T071 [US4] Pizza editor (sizes/crusts/edges/flavors, per-size flavor-price grid, strategy selector; enforce ≥1 flavor, block flavor without per-size price) in `src/components/CatalogPanel.tsx`
- [ ] T072 [US4] Combo editor (component products + quantities) in `src/components/CatalogPanel.tsx`
- [ ] T073 [P] [US4] Component test for pizza price in UI in `src/components/CatalogPanel.test.tsx`

**Checkpoint**: US1–US4 independently functional.

---

## Phase 7: User Story 5 — Mapping readiness review (P5)

**Independent Test**: Some unmapped products/options → review lists exactly those + reports "not ready"; fully mapped → "ready".

- [x] T074 [P] [US5] Unit tests for `computeMappingReadiness` (all kinds, path, ready vs not-ready) in `src/domain/catalog/mapping.test.ts`
- [x] T075 [US5] Implement `computeMappingReadiness` in `src/domain/catalog/mapping.ts`
- [x] T076 [US5] `GET /api/catalogs/{id}/mapping-readiness` in `scripts/api/mapping.ts` + openapi path
- [x] T077 [US5] Mapping review panel (list unmapped + ready/not-ready; non-blocking add warning) in `src/components/CatalogPanel.tsx`
- [x] T078 [P] [US5] Component test for mapping review in `src/components/CatalogPanel.test.tsx`

**Checkpoint**: US1–US5 independently functional.

---

## Phase 8: User Story 6 — API docs (Swagger) in the menu (P3)

**Independent Test**: Open "API / Docs" menu → Swagger UI lists every endpoint; `/api/openapi.json` matches routes; API down → unavailable state.

- [x] T079 [US6] Serve Swagger UI at `GET /api/docs` (bundled `swagger-ui-dist`, points at `/api/openapi.json`) in `scripts/api/docs.ts`
- [x] T080 [P] [US6] Add "API / Docs" entry to `src/domain/navigation.ts` + `navigation.test.ts`
- [x] T081 [US6] `src/components/ApiDocsPanel.tsx` (embed Swagger UI iframe + unavailable state) wired into `src/components/WorkspaceRoutes.tsx`
- [x] T082 [P] [US6] Component test for `ApiDocsPanel` (available + unavailable) in `src/components/ApiDocsPanel.test.tsx`
- [x] T083 [P] [US6] Coverage test: every router path appears in `scripts/api/openapi.ts`

**Checkpoint**: All endpoints discoverable via in-app Swagger UI (SC-008).

---

## Phase 9: Polish & Cross-Cutting

- [ ] T084 [P] Run `pnpm test:mutation`; ensure ≥85% on `src/domain/catalog/*`; add cases for survivors
- [ ] T085 [P] Large-catalog smoke check for SC-002 (≥200 products: browse + add < target) — quickstart step or light perf test
- [ ] T086 [P] Refresh ADR/README notes for the catalog schema + API-doc tooling in `docs/adr/`
- [ ] T087 Run `quickstart.md` end-to-end, then the full gate `pnpm ci`

---

## Dependencies & Execution Order

- **Setup (P1)** → **Foundational schema/migration (P2/2A) [DONE]** → **Foundational scaffolding (2B)** blocks all stories.
- **US1 (P1)** is the MVP; **US2–US6** follow (parallelizable across devs after 2B).
- Within a story: tests → domain rule → endpoints → client → UI. Files under `src/domain/catalog/` are split by concern; tasks touching different files run in parallel `[P]`.
- **US6** documents all routes; its coverage test (T083) is meaningful after US1–US5 endpoints exist.
- **Polish (P9)** after target stories.

### Parallel example (US1)

```bash
# domain rule tests (different files) together:
Task: "validateCnpj tests in src/domain/catalog/validation.test.ts"
Task: "resolveAvailability tests in src/domain/catalog/availability.test.ts"
# endpoints (different files) together:
Task: "store.ts" ; "catalogs.ts" ; "categories.ts" ; "products.ts" ; "items.ts"
```

## Implementation Strategy

1. Finish **Setup + Foundational scaffolding (2B)**.
2. **US1 MVP**: domain validation/availability → endpoints → client → UI → validate independently.
3. Layer US2 → US3 → US4 → US5 → US6, testing each independently.
4. Polish + `pnpm ci`.

## Notes

- `[x]` tasks were completed in prior increments (data foundation + migration safety), verified green (cargo test, vitest, typecheck, lint, max-lines).
- Domain rules carry the StrykerJS mutation gate (≥85%).
- `scripts/api/openapi.ts` is the runtime source of truth; T083 guards route coverage.
