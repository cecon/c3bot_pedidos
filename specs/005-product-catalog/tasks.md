---

description: "Task list for Product Catalog (iFood-aligned, destination-mapped)"
---

# Tasks: Product Catalog (iFood-aligned, destination-mapped)

**Input**: Design documents from `/specs/005-product-catalog/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (openapi.yaml, catalog-contract.md)

**Tests**: Included — the constitution (Principle IV) requires unit tests + StrykerJS mutation
coverage (≥85% break threshold) on shared pricing/validation/availability/readiness rules.

**Organization**: Tasks are grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1–US6 maps to the spec's user stories

## Path Conventions

Local-first desktop app (single project): frontend `src/`, Rust shell `src-tauri/`, local
`node:http` API in `scripts/`. The catalog frontend reads/writes through HTTP endpoints on
the API (consumed via `VITE_C3BOT_API_BASE_URL`).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization for the catalog feature

- [ ] T001 Add `swagger-ui-dist` to devDependencies in `package.json` (bundled/offline Swagger UI assets) and run `pnpm install`
- [ ] T002 [P] Create `scripts/api/` directory and extract shared HTTP helpers (CORS, auth, `readJson`, `writeJson`, body-limit) from `scripts/attendant-api.ts` into `scripts/api/http.ts`
- [ ] T003 [P] Add catalog type stubs (Store, Catalog, Category, Product, CatalogItem, OptionGroup, Option, PizzaConfig, PizzaSize, PizzaComponent, PizzaFlavor, PizzaFlavorPrice, ComboComponent, WeeklyHours, MappingReadiness, AvailabilityState) to `src/domain/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, migrations, API scaffolding, and module skeletons shared by all stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Define all catalog Drizzle tables in `src/db/schema.ts`: extend `products` (add `external_code`, `status`, `selling_option`, `pause_until`, `unit_min`, `unit_increment`), add `stores`, `catalogs`, `categories`, `catalog_items`, `option_groups`, `options`, `pizza_configs`, `pizza_sizes`, `pizza_crusts`, `pizza_edges`, `pizza_flavors`, `pizza_flavor_prices`, `combo_components`, `availability_schedules` (per `data-model.md`)
- [ ] T005 Generate the migration with `pnpm db:generate` and finalize `src-tauri/migrations/003_product_catalog.sql`, including the legacy data migration (default store → delivery catalog → one category per distinct legacy `products.category` → one `catalog_item` per legacy product)
- [ ] T006 Register `003_product_catalog.sql` in the `migrations` vec in `src-tauri/src/lib.rs`
- [ ] T007 Register version 3 (`product_catalog`) in `applyMigrations` of `scripts/attendant-api.ts`
- [ ] T008 Author `scripts/api/openapi.ts` — the OpenAPI 3.1 document for ALL endpoints, derived from `specs/005-product-catalog/contracts/openapi.yaml`; serve it at `GET /api/openapi.json`
- [ ] T009 Refactor `scripts/attendant-api.ts` to delegate routing to `scripts/api/*` route modules (keep existing attendant routes working; add a router that dispatches `/api/store`, `/api/catalogs`, `/api/products`, etc.)
- [ ] T010 [P] Create `src/domain/catalogPersistence.ts` mirroring the `attendantPersistence` state machine (`idle | loading | ready | empty | unavailable | error`)
- [ ] T011 [P] Create `src/domain/catalog.ts` skeleton exporting rule signatures: `validateCatalogItem`, `validateOptionGroup`, `validateCnpj`, `resolveAvailability`, `computePizzaPrice`, `computeMappingReadiness`, `canAddToOrder`
- [ ] T012 [P] Create `src/services/catalogApi.ts` client repository with `fetch` wrappers over `VITE_C3BOT_API_BASE_URL` (typed function stubs aligned to the endpoint table)

**Checkpoint**: Schema, migration, API router, and module skeletons ready — user stories can begin

---

## Phase 3: User Story 1 - Maintain core catalog hierarchy + store profile + catalog scheduling (Priority: P1) 🎯 MVP

**Goal**: One installation store (name, alphanumeric CNPJ, address+coords, weekly hours), one+ catalogs (with own hours), ordered categories, and products/items with price, image, status, and an external code — browsable for order assembly, with a "not mapped" indicator.

**Independent Test**: Create the store profile, a delivery catalog, 3 categories and 10 products (one without an external code); browse by category and confirm prices, availability, the "not mapped" badge, and that an alphanumeric CNPJ is accepted while a malformed one is rejected.

### Tests for User Story 1 ⚠️

- [ ] T013 [P] [US1] Unit tests for `validateCatalogItem` (empty name, negative price, `originalPriceCents >= priceCents`) and `validateCnpj` (legacy 14-digit valid/invalid, new alphanumeric valid/invalid, never digits-only) in `src/domain/catalog.test.ts`
- [ ] T014 [P] [US1] Unit tests for `resolveAvailability` across store→catalog scope chain (window in/out, closed day) in `src/domain/catalog.test.ts`

### Implementation for User Story 1

- [ ] T015 [P] [US1] Implement `validateCatalogItem` and `validateCnpj` in `src/domain/catalog.ts`
- [ ] T016 [US1] Implement `resolveAvailability` (scope chain store/catalog; schedule windows; `now` parameter) in `src/domain/catalog.ts`
- [ ] T017 [P] [US1] Implement store endpoints `GET/PUT /api/store`, `PUT /api/store/hours` in `scripts/api/store.ts`
- [ ] T018 [P] [US1] Implement catalog endpoints `GET/POST /api/catalogs`, `GET/PUT/DELETE /api/catalogs/{id}`, `PUT /api/catalogs/{id}/hours` in `scripts/api/catalogs.ts`
- [ ] T019 [P] [US1] Implement category endpoints `GET/POST /api/catalogs/{id}/categories`, `PUT/DELETE /api/categories/{id}`, `PUT /api/categories/{id}/order`, `PUT /api/categories/{id}/hours` in `scripts/api/categories.ts`
- [ ] T020 [P] [US1] Implement product endpoints `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}` in `scripts/api/products.ts` (server-side validation via `validateCatalogItem`/`validateCnpj` where relevant)
- [ ] T021 [P] [US1] Implement item endpoints `POST /api/categories/{id}/items`, `PUT/DELETE /api/items/{id}`, `PUT /api/items/{id}/hours` in `scripts/api/items.ts`
- [ ] T022 [US1] Implement client repo functions (store, catalogs, categories, products, items) in `src/services/catalogApi.ts` and wire load/empty/error states in `src/domain/catalogPersistence.ts`
- [ ] T023 [US1] Build the **Store settings editor** (name, CNPJ field with inline alphanumeric-aware validation, address, latitude/longitude, store external code, weekly hours editor) in `src/components/CatalogPanel.tsx`
- [ ] T024 [US1] Build **Catalog management** (list/create/edit/remove/switch, context, external code, per-catalog weekly hours) in `src/components/CatalogPanel.tsx`
- [ ] T025 [US1] Build the **category tree + product/item editors** (create/reorder, price + promotional price, image, status, `external_code` field, "not mapped" badge) in `src/components/CatalogPanel.tsx`
- [ ] T026 [P] [US1] Reusable **WeeklyHours editor** component (per day, multiple windows, closed day) in `src/components/WeeklyHoursEditor.tsx` + `WeeklyHoursEditor.test.tsx`
- [ ] T027 [P] [US1] Component test for catalog hierarchy + store profile + CNPJ validation feedback in `src/components/CatalogPanel.test.tsx`
- [ ] T028 [US1] Verify the legacy `products` data migration produced the default store/catalog/category/items (manual + a migration assertion in `scripts/api` startup or a test)

**Checkpoint**: MVP — a browsable, store-scoped catalog usable for order assembly

---

## Phase 4: User Story 2 - Complements / option groups (Priority: P2)

**Goal**: Attach option groups (complementos) with min/max rules and required flag; options carry price, status, external code.

**Independent Test**: Add "Pick a side (min 1/max 1)" with three priced options; confirm rules persist, the group shows as mandatory, max<min is rejected, and an option missing its external code is flagged.

### Tests for User Story 2 ⚠️

- [ ] T029 [P] [US2] Unit tests for `validateOptionGroup` (max>=min, required iff min>=1) in `src/domain/catalog.test.ts`

### Implementation for User Story 2

- [ ] T030 [US2] Implement `validateOptionGroup` in `src/domain/catalog.ts`
- [ ] T031 [P] [US2] Implement option-group/option endpoints `POST /api/products/{id}/option-groups`, `PUT/DELETE /api/option-groups/{id}`, `POST /api/option-groups/{id}/options`, `PUT/DELETE /api/options/{id}` in `scripts/api/optionGroups.ts`
- [ ] T032 [US2] Add option-group/option client repo functions in `src/services/catalogApi.ts`
- [ ] T033 [US2] Build option-group editors (min/max/required, options with price + `external_code`, mandatory indicator) in `src/components/CatalogPanel.tsx`
- [ ] T034 [P] [US2] Component test for option groups (rules + mandatory indicator + unmapped option flag) in `src/components/CatalogPanel.test.tsx`

**Checkpoint**: US1 + US2 work independently

---

## Phase 5: User Story 3 - Availability, pausing, and schedules (Priority: P3)

**Goal**: Mark categories/products/options available/unavailable; pause (out of stock) with optional auto-return; per-day schedules at category/item scope; exclude not-sellable elements from new orders.

**Independent Test**: Pause a product with a return time (excluded until it passes, then auto-returns); add a lunch-only category schedule (offered only within the window).

### Tests for User Story 3 ⚠️

- [ ] T035 [P] [US3] Unit tests for pause auto-return, category/item schedule windows in `resolveAvailability`, and `canAddToOrder` (blocks unavailable; warns on unmapped) in `src/domain/catalog.test.ts`

### Implementation for User Story 3

- [ ] T036 [US3] Extend `src/domain/catalog.ts` with pause auto-return logic and `canAddToOrder` (full scope chain store→catalog→category→item)
- [ ] T037 [US3] Implement `PATCH /api/products/{id}/status` (status + `pauseUntil`) in `scripts/api/products.ts` and ensure category/item hours endpoints feed `resolveAvailability`
- [ ] T038 [US3] Build availability UI (status toggle, pause-with-return-time, reuse WeeklyHours editor at category/item scope, visually distinct + excluded-from-order treatment) in `src/components/CatalogPanel.tsx`
- [ ] T039 [P] [US3] Component test for availability/pause/schedule behavior in `src/components/CatalogPanel.test.tsx`

**Checkpoint**: US1–US3 independently functional

---

## Phase 6: User Story 4 - Pizza and combo templates (Priority: P4)

**Goal**: Pizza categories with sizes (slice counts), crusts, edges, flavors and per-size flavor prices, priced by a configurable strategy (highest/average); combo categories bundling component products.

**Independent Test**: Pizza with 2 sizes/2 crusts/4 flavors and per-size prices, strategy `highest` → two-flavor price = higher flavor (for size) + crust + edge; switch to `average` and re-verify. Combo bundles 3 products at a combo price.

### Tests for User Story 4 ⚠️

- [ ] T040 [P] [US4] Unit tests for `computePizzaPrice` (highest, average, per-size lookup, flavor-count bounds 1..maxFlavors) in `src/domain/catalog.test.ts`

### Implementation for User Story 4

- [ ] T041 [US4] Implement `computePizzaPrice` (strategy switch, extensible) in `src/domain/catalog.ts`
- [ ] T042 [P] [US4] Implement pizza endpoints `GET/PUT /api/categories/{id}/pizza-config` and `PUT /api/pizza-config/{id}/{sizes|crusts|edges|flavors|flavor-prices}` in `scripts/api/pizza.ts`
- [ ] T043 [P] [US4] Implement combo endpoint `PUT /api/items/{id}/combo-components` in `scripts/api/combos.ts`
- [ ] T044 [US4] Add pizza + combo client repo functions in `src/services/catalogApi.ts`
- [ ] T045 [US4] Build pizza editor (sizes/crusts/edges/flavors, per-size flavor-price grid, pricing-strategy selector) in `src/components/CatalogPanel.tsx`
- [ ] T046 [US4] Build combo editor (select component products + quantities) in `src/components/CatalogPanel.tsx`
- [ ] T047 [P] [US4] Component test for pizza price computation surfaced in UI in `src/components/CatalogPanel.test.tsx`

**Checkpoint**: US1–US4 independently functional

---

## Phase 7: User Story 5 - Validate destination mapping before handoff (Priority: P5)

**Goal**: Review mapping health — list every unmapped sellable element with its hierarchy path and report overall ready/not-ready; non-blocking warning when adding an unmapped element.

**Independent Test**: With some unmapped products/options, the mapping review lists exactly those and reports "not ready"; a fully mapped catalog reports "ready".

### Tests for User Story 5 ⚠️

- [ ] T048 [P] [US5] Unit tests for `computeMappingReadiness` (all `kind`s, path correctness, ready vs not-ready) in `src/domain/catalog.test.ts`

### Implementation for User Story 5

- [ ] T049 [US5] Implement `computeMappingReadiness` in `src/domain/catalog.ts`
- [ ] T050 [US5] Implement `GET /api/catalogs/{id}/mapping-readiness` in `scripts/api/mapping.ts`
- [ ] T051 [US5] Build the **Mapping review** panel (list unmapped + ready/not-ready status; non-blocking warning when adding an unmapped element) in `src/components/CatalogPanel.tsx`
- [ ] T052 [P] [US5] Component test for mapping review + non-blocking add warning in `src/components/CatalogPanel.test.tsx`

**Checkpoint**: US1–US5 independently functional

---

## Phase 8: User Story 6 - API documentation (Swagger) from the menu (Priority: P3)

**Goal**: Interactive Swagger UI for ALL endpoints, reachable from a workspace menu entry, with an unavailable state when the API is down.

**Independent Test**: Open the "API / Docs" menu entry → Swagger UI lists every endpoint with schemas; `GET /api/openapi.json` matches implemented routes; stopping the API shows the unavailable state.

### Tests for User Story 6 ⚠️

- [ ] T053 [P] [US6] Test that `navigation.ts` exposes the "API / Docs" entry in `src/domain/navigation.test.ts`

### Implementation for User Story 6

- [ ] T054 [US6] Serve Swagger UI at `GET /api/docs` using bundled `swagger-ui-dist` (offline) pointing at `/api/openapi.json` in `scripts/api/docs.ts`
- [ ] T055 [US6] Add the **"API / Docs"** entry to `src/domain/navigation.ts`
- [ ] T056 [US6] Build `src/components/ApiDocsPanel.tsx` embedding Swagger UI (iframe to `${VITE_C3BOT_API_BASE_URL}/api/docs`) with a clear unavailable state, and wire it into `src/components/WorkspaceRoutes.tsx`
- [ ] T057 [P] [US6] Component test for `ApiDocsPanel` (available + unavailable states) in `src/components/ApiDocsPanel.test.tsx`
- [ ] T058 [US6] Coverage check: assert `scripts/api/openapi.ts` documents 100% of implemented routes (a test enumerating the router paths vs the OpenAPI paths)

**Checkpoint**: All endpoints discoverable via in-app Swagger UI (SC-008)

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates and finishing touches across stories

- [ ] T059 [P] Run `pnpm test:mutation` and ensure ≥85% break threshold on `src/domain/catalog.ts` rules; add cases for survivors
- [ ] T060 [P] Add/refresh an ADR note for the catalog schema + API-doc tooling in `docs/adr/`
- [ ] T061 [P] Run `pnpm db:check` (governance), `pnpm max-lines`, and `pnpm lint`; fix violations
- [ ] T062 Run `quickstart.md` end-to-end and then the full gate `pnpm ci` (lint, max-lines, typecheck, test, test:mutation, build, cargo check)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies
- **Foundational (Phase 2)**: depends on Setup — **BLOCKS all user stories** (schema/migration/API router/skeletons)
- **User Stories (Phase 3–8)**: all depend on Foundational
  - US1 (P1) is the MVP and should come first
  - US2–US6 can then proceed in parallel or in priority order
  - US6 documents/serves all routes; its coverage check (T058) is most meaningful after US1–US5 endpoints exist
- **Polish (Phase 9)**: depends on all targeted stories

### User Story Dependencies

- **US1 (P1)**: after Foundational — no dependency on other stories
- **US2 (P2)**: after Foundational — independent (adds option groups to products)
- **US3 (P3)**: after Foundational — reuses WeeklyHours editor (T026) from US1; otherwise independent
- **US4 (P4)**: after Foundational — independent (pizza/combo)
- **US5 (P5)**: after Foundational — readiness reads across all entities; meaningful with US1+ data
- **US6 (P3)**: after Foundational — OpenAPI doc authored in T008; serving/UI independent; T058 verifies coverage of routes added by other stories

### Within Each User Story

- Tests first (write failing) → domain rules → server endpoints → client repo → UI
- `src/domain/catalog.ts` and `src/db/schema.ts` are shared files: tasks editing them within a story are sequential (not [P]) unless noted

### Parallel Opportunities

- Setup: T002, T003 in parallel
- Foundational: T010, T011, T012 in parallel (after T004–T009)
- US1 server endpoints T017–T021 in parallel (different `scripts/api/*` files); domain T015 [P] vs T016 (same file → sequential)
- Tests marked [P] within a story run together
- After Foundational, different developers can take US2/US3/US4/US5/US6 concurrently

---

## Parallel Example: User Story 1

```bash
# Server endpoints (different files) together:
Task: "Store endpoints in scripts/api/store.ts"
Task: "Catalog endpoints in scripts/api/catalogs.ts"
Task: "Category endpoints in scripts/api/categories.ts"
Task: "Product endpoints in scripts/api/products.ts"
Task: "Item endpoints in scripts/api/items.ts"

# Tests together:
Task: "Unit tests for validateCatalogItem + validateCnpj in src/domain/catalog.test.ts"
Task: "Unit tests for resolveAvailability scope chain in src/domain/catalog.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → 4. **STOP & VALIDATE** (browse store-scoped catalog, add to order) → demo.

### Incremental Delivery

US1 (MVP) → US2 (complements) → US3 (availability) → US4 (pizza/combo) → US5 (mapping review) → US6 (Swagger in menu). Each adds value without breaking prior stories; run the relevant tests after each.

### Notes

- [P] = different files, no dependencies
- Domain rules in `src/domain/catalog.ts` carry the mutation-test burden (≥85%)
- The OpenAPI document (`scripts/api/openapi.ts`) is the single source of truth; keep it in sync (T058 guards coverage)
- Commit after each task or logical group
