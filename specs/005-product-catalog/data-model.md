# Data Model: Product Catalog (iFood-aligned, destination-mapped)

Conventions (from existing `src/db/schema.ts`): `text` primary keys (app-generated ids),
snake_case columns, booleans stored as integer mode, money as integer **cents** (BRL),
timestamps as text (`CURRENT_TIMESTAMP`). All `external_code` columns are **nullable**;
a null/blank value means "not mapped to destination". `status` enum across sellable
entities: `available | unavailable | paused`.

## Entity overview

```text
stores (1 row)
  └── catalogs (per sales context)
        └── categories (template: default | pizza | combo; optional schedule)
              ├── catalog_items ──► products            (price lives here)
              │      └── (combo) combo_components ──► products
              └── pizza_configs (when template = pizza)
                     ├── pizza_sizes
                     ├── pizza_crusts
                     ├── pizza_edges
                     └── pizza_flavors ──► products
                            └── pizza_flavor_prices (per size)
products
  └── option_groups
        └── options ──► products
availability_schedules (scope: category | item)
```

## Store

- `id`, `name`, `external_code` (store/merchant id at destination), `status`,
  `created_at`, `updated_at`
- **Rule**: exactly one row per installation (single-tenant). No store picker in the UI.

## Catalog

- `id`, `store_id` → stores, `context` (`delivery | indoor | takeout`), `status`,
  `created_at`, `updated_at`
- **Rule**: a store may own multiple catalogs (one per context).

## Category

- `id`, `catalog_id` → catalogs, `name`, `display_order` (int), `status`,
  `template` (`default | pizza | combo`), `external_code`, `created_at`, `updated_at`
- **Rules**: ordered within a catalog; `pizza` categories must have a `pizza_config`;
  `combo` categories hold combo items.

## Product (base definition)

- `id`, `name`, `description` (nullable), `image_url` (nullable), `external_code`,
  `status`, `pause_until` (nullable timestamp), `selling_option` (`unit | weight`),
  `unit_min` (nullable), `unit_increment` (nullable), `created_at`, `updated_at`
- **Migration of legacy `products`**: keep `id`/`name`/`description`/`image_url`; legacy
  `price_cents`/`category`/`active` are migrated into the default catalog/category and a
  `catalog_item` (see Data Migration). Reusable across categories, options, and pizza flavors
  (FR-007).
- **Validation**: name non-empty (FR-005).

## Catalog Item (product placed in a category)

- `id`, `category_id` → categories, `product_id` → products, `price_cents`,
  `original_price_cents` (nullable, promotional reference — FR-006), `display_order` (int),
  `status`, `external_code`, `created_at`, `updated_at`
- **Validation**: `price_cents >= 0` (FR-005); `original_price_cents >= price_cents` when set.
- **Uniqueness**: unique (`category_id`, `product_id`).

## Option Group (Complemento)

- `id`, `product_id` → products, `name`, `min_quantity` (int ≥ 0), `max_quantity` (int ≥ 1),
  `required` (bool), `status`, `display_order`, `external_code`, `created_at`, `updated_at`
- **Validation**: `max_quantity >= min_quantity` (FR-014); `required` is true iff
  `min_quantity >= 1` (FR-013, FR-016).

## Option

- `id`, `option_group_id` → option_groups (cascade), `product_id` → products (nullable),
  `name`, `price_cents` (≥ 0), `status`, `display_order`, `external_code`,
  `created_at`, `updated_at`
- **Rule**: belongs to one group; carries its own price and external reference (FR-015).

## Pizza Config (per pizza category)

- `id`, `category_id` → categories (unique), `pricing_strategy` (`highest | average`,
  extensible), `created_at`, `updated_at`

### Pizza Size

- `id`, `pizza_config_id` → pizza_configs (cascade), `name`, `slices` (int),
  `max_flavors` (int ≥ 1), `display_order`, `external_code`

### Pizza Crust / Pizza Edge

- `id`, `pizza_config_id` → pizza_configs (cascade), `name`, `price_cents` (≥ 0),
  `status`, `display_order`, `external_code`

### Pizza Flavor

- `id`, `pizza_config_id` → pizza_configs (cascade), `product_id` → products (nullable),
  `name`, `status`, `display_order`, `external_code`

### Pizza Flavor Price (per size)

- `id`, `pizza_flavor_id` → pizza_flavors (cascade), `pizza_size_id` → pizza_sizes (cascade),
  `price_cents` (≥ 0)
- **Uniqueness**: unique (`pizza_flavor_id`, `pizza_size_id`).

## Combo Component

- `id`, `catalog_item_id` → catalog_items (the combo item, cascade),
  `component_product_id` → products, `quantity` (int ≥ 1), `display_order`
- **Rule**: only items whose category `template = combo` may have components (FR-024).

## Availability Schedule

- `id`, `scope_type` (`category | item`), `scope_id` (id of the category or catalog_item),
  `day_of_week` (0–6), `start_time` (HH:MM), `end_time` (HH:MM)
- **Rule**: an element is sellable now only if `status = available`, not within an active
  pause, and (if any schedule rows exist for it) the current day/time falls inside a window
  (FR-019, FR-020).

## State & derived rules (implemented as pure functions in `src/domain/catalog.ts`)

- **Availability**: `paused` with a future `pause_until` → unavailable until that time, then
  auto-returns to `available` (evaluated on read; FR-018, SC-006).
- **Mapping readiness**: any sellable row (product, catalog_item, option, pizza
  crust/edge/flavor, combo) with null/blank `external_code` is "not mapped"; the catalog is
  `ready` only when all are mapped (FR-009–011, SC-003).
- **Pizza price**: `highest` = max selected-flavor price (per chosen size) + crust + edge;
  `average` = mean of selected-flavor prices + crust + edge (FR-022–023, SC-005).
- **Order guard**: adding an `unavailable`/paused/out-of-schedule element is blocked; adding
  an unmapped element raises a non-blocking warning (FR-012, SC-004).

## Relationship to existing entities

- `order_items.product_id` continues to reference `products.id`; existing orders keep their
  captured `unit_price_cents` and are unaffected by later catalog changes (FR-025).
- Catalog elements feed new `order_items` (item price snapshotted onto the order item).

## Data Migration (003)

1. Insert one `stores` row (the installation store).
2. Insert one default `catalogs` row (`context = delivery`).
3. For each distinct legacy `products.category` text, insert a `categories` row
   (`template = default`).
4. For each legacy product, insert a `catalog_items` row into its category with the legacy
   `price_cents` and `status` derived from legacy `active`.
5. Retain legacy product columns only as needed for the migration; new product columns
   (`external_code`, `status`, `selling_option`, `pause_until`) default to null/`available`/
   `unit`.
