# Quickstart: Product Catalog

Local-first desktop catalog. No synchronization is built in this feature — the goal is the
iFood-shaped data model plus the operator maintenance UI, with external-reference fields
reserved for a future integration.

## Prerequisites

- Node/pnpm and Rust toolchain installed (same as the rest of C3Bot).
- Run inside the Tauri runtime for database-backed operations: `pnpm tauri dev`
  (Vite-only `pnpm dev` does not persist catalog data).

## Apply the schema

1. Edit `src/db/schema.ts` to add the catalog tables (see `data-model.md`).
2. Generate the migration with Drizzle Kit (writes to `src-tauri/migrations/drizzle`),
   then add `003_product_catalog.sql` to `src-tauri/migrations/` and register it in the
   `migrations` vec in `src-tauri/src/lib.rs` (after `002_delivery_attendants.sql`).
3. Launch `pnpm tauri dev`; the Tauri SQL plugin applies pending migrations on startup,
   including the legacy `products` data migration (default store/catalog/category/items).

## Build a minimal catalog (validates SC-001)

1. Open the **Catálogo** workspace panel.
2. Open **Store settings**: fill name, **CNPJ** (try an alphanumeric value — it must be
   accepted), address + latitude/longitude, store external code, and the **weekly hours**
   (per day, with a closed day). Confirm a malformed CNPJ is rejected.
3. Confirm the default delivery catalog exists; create a second catalog "Café da Manhã" with
   its own **weekly hours** (mornings only) and external code.
4. Create 3 categories (default template) and reorder them.
5. Add 10 products with name, price, image, and an external code; leave one without a code.
6. Verify the product without a code shows a **"not mapped"** badge and appears in the
   **Mapping review** as the only unmapped element (SC-003).

## Exercise the rules

- **Validation**: try saving a product with an empty name or negative price → rejected
  (FR-005).
- **Option group**: add "Pick a side" with min 1 / max 1 and three priced options; set max
  below min → rejected (FR-014); confirm it shows as mandatory (FR-016).
- **Availability**: pause a product with a return time → excluded from new orders; after the
  time passes it auto-returns (SC-006). Add a lunch-only schedule to a category → offered
  only within the window.
- **Pizza**: create a pizza category with 2 sizes, 2 crusts, 4 flavors and per-size flavor
  prices; set strategy to `highest`, pick two flavors → price = higher flavor (for the size)
  + crust + edge (SC-005); switch to `average` and re-verify.
- **Combo**: bundle 3 products into a combo item at a combo price.
- **Handoff guard**: as an attendant, adding an unavailable item is blocked; adding an
  unmapped item shows a non-blocking warning (FR-012, SC-004).

## Browse the API docs (validates SC-008)

1. With the API running (`pnpm dev` or `pnpm tauri dev`), open the **API / Docs** menu entry.
2. Confirm the embedded **Swagger UI** lists every endpoint (health, attendants, store,
   catalogs, categories, products, items, option groups, options, pizza, combos, mapping,
   docs) with request/response schemas.
3. Fetch the raw spec at `${VITE_C3BOT_API_BASE_URL}/api/openapi.json` and confirm it matches
   the implemented routes.
4. Stop the API and reopen the panel → a clear **unavailable** state is shown (FR-034).

## Quality gates (run before marking ready)

```bash
pnpm typecheck
pnpm test
pnpm test:mutation   # ≥85% break threshold on catalog domain rules
pnpm build
cargo check          # from src-tauri/
```

## Scope reminders

- Single store per installation — no store/tenant picker.
- No import/export or live sync with iFood or any provider in this feature.
- Pizza pricing strategy is a config value; new strategies = new enum value + a branch in
  `computePizzaPrice`, no catalog schema change.
