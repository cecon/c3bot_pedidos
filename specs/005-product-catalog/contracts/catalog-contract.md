# Contract: Product Catalog

This feature exposes four contracts: pure **domain rules**, an **HTTP API** (the C3Bot local
API, documented via OpenAPI/Swagger), a **persistence/repository** boundary (ORM-backed,
server-side), and a **UI** contract. The HTTP API is the same `node:http` server that already
serves the attendant endpoints; the catalog frontend reads/writes through it via
`VITE_C3BOT_API_BASE_URL`. No external/destination synchronization is built in this feature.

The authoritative, machine-readable API contract is [`openapi.yaml`](./openapi.yaml).

## 1. Domain rules contract (`src/domain/catalog.ts`)

Pure, side-effect-free functions; deterministic; unit- and mutation-tested.

```text
validateCatalogItem(input): { ok: true } | { ok: false; errors: string[] }
  - name non-empty; price_cents >= 0; original_price_cents >= price_cents when set.

validateOptionGroup(input): { ok: true } | { ok: false; errors: string[] }
  - max_quantity >= min_quantity; required === (min_quantity >= 1).

validateCnpj(value): { ok: true } | { ok: false; reason: string }
  - Accepts legacy 14-digit numeric CNPJ AND new alphanumeric CNPJ (12 alphanumeric + 2
    numeric check digits, effective Jul/2026). Never assumes digits-only. Verifies check
    digits via official mod-11 over each char value (ASCII - 48). (FR-028)

resolveAvailability(element, scopeSchedules, now): "available" | "unavailable"
  - scopeSchedules = schedules for every applicable scope (store, catalog, category, item).
  - "available" only if element.status === "available", no active pause (pause_until in
    past/null), and for EACH scope that has schedule rows, `now` falls within one of its
    windows. A past pause_until auto-returns. (FR-019, FR-020, FR-029, FR-030)

computePizzaPrice(selection, config): number   // cents
  - selection = { sizeId, crustId?, edgeId?, flavorIds[] }
  - "highest": max flavor price (for size) + crust + edge
  - "average": round(mean of flavor prices (for size)) + crust + edge
  - flavorIds length must be 1..size.max_flavors (else error).

computeMappingReadiness(catalog): {
    ready: boolean,
    unmapped: Array<{ kind, id, path }>   // kind: product|item|option|crust|edge|flavor|combo
  }
  - lists every sellable element with null/blank external_code, with its hierarchy path.

canAddToOrder(element, schedules, now): {
    allowed: boolean,            // false only when not sellable now (unavailable/paused/off-schedule)
    warnings: string[]           // includes "not mapped to destination" when external_code missing
  }
```

## 2. HTTP API contract (C3Bot local API — see `openapi.yaml`)

All endpoints live under `/api`, return JSON, and reuse the existing CORS/auth/body-limit
behavior of `scripts/attendant-api.ts`. Every endpoint is described in `openapi.yaml`
(OpenAPI 3.1) — the single source of truth (FR-032, FR-033).

| Resource | Endpoints |
|----------|-----------|
| Health | `GET /api/health` |
| Attendants (existing) | `GET/POST /api/attendants`, `PATCH/DELETE /api/attendants/{id}`, `PATCH /api/attendants/{id}/availability` |
| Store | `GET /api/store`, `PUT /api/store`, `PUT /api/store/hours` |
| Catalogs | `GET/POST /api/catalogs`, `GET/PUT/DELETE /api/catalogs/{id}`, `PUT /api/catalogs/{id}/hours` |
| Categories | `GET/POST /api/catalogs/{id}/categories`, `PUT/DELETE /api/categories/{id}`, `PUT /api/categories/{id}/order`, `PUT /api/categories/{id}/hours` |
| Products | `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}`, `PATCH /api/products/{id}/status` |
| Items | `POST /api/categories/{id}/items`, `PUT/DELETE /api/items/{id}`, `PUT /api/items/{id}/hours` |
| Option groups | `POST /api/products/{id}/option-groups`, `PUT/DELETE /api/option-groups/{id}` |
| Options | `POST /api/option-groups/{id}/options`, `PUT/DELETE /api/options/{id}` |
| Pizza | `GET/PUT /api/categories/{id}/pizza-config`, `PUT /api/pizza-config/{id}/{sizes\|crusts\|edges\|flavors\|flavor-prices}` |
| Combos | `PUT /api/items/{id}/combo-components` |
| Mapping | `GET /api/catalogs/{id}/mapping-readiness` |
| Docs | `GET /api/openapi.json` (the spec), `GET /api/docs` (Swagger UI) |

**Guarantees**:

- Writes are validated by the domain rules **server-side** before persistence; invalid input
  returns `400` with messages (no partial writes).
- Reads never mutate stored status; pause auto-return and schedule windows are computed at
  read time from `now`.
- No catalog mutation alters existing `order_items` (price already snapshotted).
- `GET /api/openapi.json` always reflects the implemented routes (single source of truth).

## 2b. Persistence/repository boundary (server-side, `scripts/api/*` via Drizzle)

The server-side handlers operate through the Drizzle proxy. The frontend calls these via the
HTTP endpoints above; the client repository mirrors them as typed functions and reuses the
`attendantPersistence` state machine (`idle | loading | ready | empty | unavailable | error`)
in `src/domain/catalogPersistence.ts`:

```text
loadStore / updateStore / setStoreHours
loadCatalog(catalogId?) / listCatalogs / createCatalog / updateCatalog / removeCatalog / setCatalogHours
createCategory / updateCategory / reorderCategories / setCategoryHours / setItemHours
createProduct / updateProduct / setProductStatus(pauseUntil?)
createCatalogItem / updateCatalogItem(price, original?, order, externalCode)
createOptionGroup / updateOptionGroup / createOption / updateOption
createPizzaConfig / setPizzaSizes / setPizzaCrusts / setPizzaEdges / setPizzaFlavors / setPizzaFlavorPrices
setComboComponents
listMappingReadiness(catalogId): MappingReadiness       // wraps computeMappingReadiness
```

## 3. UI contract (`src/components/CatalogPanel.tsx`)

- Opens directly into the dark workspace catalog view (no landing page).
- **Store settings editor**: name, CNPJ (free-text input with inline alphanumeric-aware
  validation feedback), full address (street, number, neighborhood, city, state, postal
  code, complement), latitude/longitude, store external code, and a **weekly hours editor**
  (per day of week, multiple windows, "closed" supported).
- **Catalog management**: list/create/edit/remove catalogs and switch the active catalog;
  each catalog has a name, context, external code, and its **own weekly hours editor**.
- Renders the hierarchy as a navigable tree: catalog → categories (ordered) → products/items,
  with editors for products, option groups, pizza config, and combos.
- **Every editor (store, catalog, category, item, product, option, pizza crust/edge/flavor,
  combo) exposes an `external_code` field** — it is required for automation/integration and
  editable in place.
- **Pizza editor** includes a **per-size flavor price** grid (each flavor priced for each
  size) and the pricing-strategy selector.
- **Weekly hours editor** is reused at store, catalog, category, and item scope.
- Each sellable row shows price, availability state, and a **"not mapped"** badge when
  `external_code` is missing.
- Provides a **Mapping review** panel listing unmapped elements and an overall
  **ready / not ready for handoff** status.
- Reordering categories/items persists the new `display_order`.
- Unavailable/paused/off-schedule elements are visually distinct and excluded from new-order
  selection; unmapped elements remain selectable but surface a non-blocking warning.

### API documentation menu entry (`ApiDocsPanel.tsx` + `navigation.ts`)

- A workspace menu entry **"API / Docs"** opens an in-app panel embedding the interactive
  **Swagger UI** (iframe to `${VITE_C3BOT_API_BASE_URL}/api/docs`).
- When the API is unreachable, the panel shows a clear **unavailable** state (same pattern as
  attendant persistence), not a broken iframe (FR-034).
- The docs always reflect the running API's OpenAPI document (FR-033).

## Acceptance mapping

| Requirement | Contract element |
|-------------|------------------|
| FR-005 (validation) | `validateCatalogItem` |
| FR-006 (promo price) | `catalog_items.original_price_cents` + `validateCatalogItem` |
| FR-007 (reuse) | product referenced by items/options/flavors |
| FR-009–011 (mapping) | `computeMappingReadiness` / Mapping review panel |
| FR-012 (order guard) | `canAddToOrder` |
| FR-013–016 (option groups) | `validateOptionGroup`, option editors |
| FR-017–020 (availability) | `resolveAvailability`, schedules, pause_until |
| FR-021–023 (pizza) | `computePizzaPrice`, pizza config tables |
| FR-024 (combo) | `setComboComponents`, combo_components |
| FR-025 (order integrity) | snapshot on `order_items`; no cascade to history |
| FR-027 (store profile) | Store settings editor; `updateStore` |
| FR-028 (alphanumeric CNPJ) | `validateCnpj`; CNPJ text field |
| FR-029 (store hours) | `setStoreHours`; weekly hours editor (scope=store) |
| FR-030 (catalog hours/multi-catalog) | `setCatalogHours`, catalog management; `resolveAvailability` scope chain |
| FR-031 (catalog CRUD) | `listCatalogs`/`createCatalog`/`updateCatalog`/`removeCatalog` |
| FR-032 (endpoints) | HTTP API table above; `scripts/api/*` |
| FR-033 (OpenAPI source of truth) | `openapi.yaml`; `GET /api/openapi.json` |
| FR-034 (Swagger UI in menu) | `GET /api/docs`; `ApiDocsPanel` + `navigation.ts` entry |
