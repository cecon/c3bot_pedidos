# Phase 0 Research: Product Catalog

All Technical Context unknowns were resolved against the existing codebase (004 ORM
conventions) and the iFood Food catalog structure used as a blueprint. No open
NEEDS CLARIFICATION remain.

## R1. Catalog domain shape — adopt the iFood hierarchy

- **Decision**: Model the catalog as `store → catalog (context) → category (template) →
  product` with a separate `catalog_item` linking a product into a category with commercial
  attributes (price, status, order). Attach `option_group → option` to products. Use a
  per-category `pizza_config` (sizes, crusts, edges, flavors, flavor prices per size) and a
  `combo` composition for combo categories.
- **Rationale**: This mirrors iFood's proven separation of a reusable **product** definition
  from its priced **listing/item**, satisfying FR-007 (reuse without duplication) and giving
  every sellable element a natural place for an external reference. Following a working model
  reduces the risk of a redesign when integration arrives.
- **Alternatives considered**: A flat `products` table with a free-text `category` (today's
  schema) — rejected: cannot express complements, pizza, reuse, or per-context catalogs.
  A single denormalized JSON blob per product — rejected: not queryable, not mutation-test
  friendly, and diverges from the iFood shape.

## R2. Product vs. Item split and migrating the existing `products` table

- **Decision**: Evolve `products` into the **base definition** (name, description, image,
  external_code, status, selling option) and introduce `catalog_items` for category
  placement + price. A data migration creates a default store, a default delivery catalog,
  one category per distinct legacy `products.category` text, and one `catalog_item` per
  legacy product carrying its `price_cents`/`active`. `order_items.product_id` continues to
  reference `products.id`, so historical orders are unaffected (FR-025).
- **Rationale**: Preserves existing references and order history while reaching the
  iFood-aligned shape. Keeps the change to one generated migration.
- **Alternatives considered**: Dropping/recreating `products` — rejected: breaks
  `order_items` FK and loses history. Keeping price on `products` AND `catalog_items` —
  rejected: dual source of truth for price is ambiguous; price lives on the item.

## R3. Pricing units and promotional price

- **Decision**: Store all money as integer **cents** in BRL (matching `price_cents`,
  `total_cents`, `unit_price_cents`). `catalog_items` carry `price_cents` and an optional
  `original_price_cents` to express a promotional discount without losing the reference
  price (FR-006).
- **Rationale**: Consistent with the existing schema; avoids floating-point rounding.
- **Alternatives considered**: `real`/decimal prices — rejected: rounding risk and
  inconsistency with the rest of the codebase.

## R4. Pizza pricing strategy as configuration

- **Decision**: Store `pricing_strategy` on the per-category `pizza_config` as an enum
  seeded with `highest` and `average`; resolve price in a pure function
  `computePizzaPrice(selection, config)` that switches on the strategy. Flavor prices are
  stored **per size** (`pizza_flavor_prices`), as iFood prices vary by size.
- **Rationale**: Satisfies clarification #3 — strategy is a config, and the strategy set is
  extensible by adding an enum value + a branch, with no schema change to the catalog tables.
- **Alternatives considered**: Hard-coding a single strategy — rejected: not configurable.
  A pluggable strategy registry/table — rejected as premature for two strategies; the enum +
  pure-function switch keeps it testable and simple.

## R5. Availability, pausing, and schedules

- **Decision**: A shared `status` enum (`available`, `unavailable`, `paused`) on categories,
  items, and options, plus a nullable `pause_until` timestamp for out-of-stock auto-return.
  Availability windows go in an `availability_schedules` table (scope_type, scope_id,
  day_of_week, start_time, end_time). A pure `resolveAvailability(element, schedules, now)`
  function determines what is sellable now; auto-return is evaluated on read against `now`.
- **Rationale**: Centralizes the rule in one mutation-tested function (FR-017–020, SC-006);
  no background job needed because availability is computed at query/read time.
- **Alternatives considered**: A scheduler/cron to flip statuses — rejected: adds a runtime
  process; computing on read is simpler and deterministic for tests.
- **Scope chain**: `scope_type` is generalized to `store | catalog | category | item`. Store
  business hours and per-catalog hours (e.g. a breakfast catalog) reuse the same table and
  the same `resolveAvailability`, which requires `now` to fall inside a window at every scope
  that defines windows (FR-029, FR-030).

## R9. Alphanumeric CNPJ (effective Jul/2026)

- **Decision**: Store `stores.cnpj` as **text** and validate with a pure `validateCnpj` that
  accepts both the legacy 14-digit numeric CNPJ and the **new alphanumeric CNPJ** (12
  alphanumeric positions + 2 numeric check digits). Check digits use the official mod-11 rule
  over each character's numeric value (ASCII − 48), per Receita Federal / Serpro guidance.
- **Rationale**: The alphanumeric format becomes valid in Jul/2026 ("next month" relative to
  this plan); assuming digits-only would reject legitimate CNPJs and break integration codes.
- **Alternatives considered**: Numeric-only validation/storage — rejected: incompatible with
  the new format. Skipping validation — rejected: silently accepts malformed CNPJs that would
  fail downstream automation.

## R6. External destination mapping & readiness (no sync now)

- **Decision**: Add a nullable `external_code` column to every sellable table (products,
  catalog_items, options, pizza crusts/edges/flavors, combos). Readiness is a pure
  `computeMappingReadiness(catalog)` that lists elements with a null/blank `external_code`
  and returns a `ready`/`not_ready` summary. A missing code yields a **non-blocking warning**
  in the order flow; only `unavailable` blocks adding to an order (FR-009–012, SC-003/004).
- **Rationale**: Realizes "we are not the final destination" purely in the data model and a
  read-only review, with zero integration code, matching clarification #1.
- **Alternatives considered**: A separate `external_mapping` table — rejected: a column per
  sellable row is simpler for single-store and avoids polymorphic joins. Blocking orders on
  missing codes — rejected: there is no live destination yet, so blocking is premature.

## R7. Single store / single tenant

- **Decision**: A `stores` table that conventionally holds exactly one row (the
  installation's store). No tenant column on child tables; the UI never shows a store/tenant
  picker.
- **Rationale**: Matches clarification #2 (one store per installation) while keeping the
  iFood-shaped `store` anchor for a future external identifier.
- **Alternatives considered**: Omitting the store entirely — rejected: loses the natural
  anchor for the store-level external identifier and the iFood shape.

## R8. ORM, migration, and test conventions (reuse 004)

- **Decision**: Define tables in `src/db/schema.ts` with Drizzle (`text` PKs, snake_case
  columns, boolean-as-integer, `references` with `onDelete`, `index`/`uniqueIndex`).
  Generate `003_product_catalog.sql` via Drizzle Kit and register it in `src-tauri/src/lib.rs`.
  Pure rules in `src/domain/catalog.ts` with colocated `.test.ts`; persistence state in
  `src/domain/catalogPersistence.ts` following the attendant persistence pattern.
- **Rationale**: Consistency with the established ORM governance (ADR + generated migrations)
  and the test/mutation gates.
- **Alternatives considered**: Handwritten SQL migration — rejected: 004 governance requires
  a generated command trace.

## R10. HTTP API surface + OpenAPI/Swagger docs in the menu

- **Decision**: The catalog frontend reads/writes through HTTP endpoints on the existing
  C3Bot local API (`scripts/attendant-api.ts`, `node:http`), mirroring the attendant feature.
  Author a single **OpenAPI 3.1** document covering all endpoints (existing + catalog),
  served at `GET /api/openapi.json`; serve **Swagger UI** at `GET /api/docs` using bundled
  `swagger-ui-dist` assets (offline). Add an in-app **"API / Docs"** menu entry
  (`navigation.ts`) opening an `ApiDocsPanel` that embeds the Swagger UI and shows an
  unavailable state when the API is down. (FR-032–034, SC-008)
- **Rationale**: Consistency with the attendant HTTP boundary; OpenAPI as the single source
  of truth makes the catalog discoverable for the future automations that depend on
  `external_code`. Bundling Swagger UI keeps the local-first app offline-capable.
- **Alternatives considered**: Adding Express/Fastify + a swagger generator — rejected: heavy
  framework change vs. the existing tiny server. CDN-hosted Swagger UI — rejected: breaks
  offline. Generating OpenAPI from code annotations — rejected as premature; a hand-authored
  spec validated against the route table is simpler and is the contract in `contracts/openapi.yaml`.
- **Note**: `swagger-ui-dist` is a new dependency; justified and recorded in the Constitution
  Check (API-doc tooling, not a UI framework/DB/session-store change).
