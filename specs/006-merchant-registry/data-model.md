# Phase 1 Data Model: Merchant Registry

Single merchant per installation. The merchant **is** the catalog's existing `stores` row
(feature 005), enriched with merchant columns, plus three related tables. All money in integer
cents (BRL). Text PKs, snake_case columns, integer booleans (0/1), ISO-8601 timestamps — matching
feature-005 conventions.

## Entity: Merchant (extends `stores`)

The `stores` table from feature 005 already has: `id, name, cnpj, street, number, neighborhood,
city, state, postal_code, complement, latitude, longitude, external_code, status, created_at,
updated_at`. This feature **adds** columns (migration `004`, guarded ADD COLUMN):

| Column | Type | Notes |
|--------|------|-------|
| `corporate_name` | text NULL | Razão social (iFood `corporateName`). |
| `description` | text NULL | Public description. |
| `average_ticket_cents` | integer NULL | Average ticket in cents (iFood `averageTicket`). |
| `exclusive` | integer NOT NULL default 0 | Boolean (iFood `exclusive`). |
| `type` | text NOT NULL default `'RESTAURANT'` | Merchant type (iFood `type`). |
| `country` | text NOT NULL default `'BR'` | Address country (iFood address.country). |

**Reused mapping** (existing → iFood): `name`→name, `neighborhood`→district, `external_code`→
external reference, `status`→AVAILABLE/UNAVAILABLE. `address` is the existing address columns +
`country`. `createdAt`→`created_at`.

**Validation** (`validateMerchant`):
- `name` required, non-empty after trim.
- `cnpj` — alphanumeric, never digits-only validation removed; format per feature 005 (CNPJ
  alfanumérico effective Jul/2026). Required for "ready" but not for draft save.
- `type` in {RESTAURANT, …} (default RESTAURANT); `status` in {AVAILABLE, UNAVAILABLE}.
- `average_ticket_cents` ≥ 0 when present; `latitude`/`longitude` within valid ranges when present.

## Entity: MerchantOperation (`merchant_operations`)

One row per operation/sales-channel the merchant supports.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `store_id` | text NOT NULL FK→stores.id | The merchant. |
| `name` | text NOT NULL | `DELIVERY` \| `INDOOR` (operation name). |
| `sales_channel` | text NOT NULL | e.g. `ifood-app`. |
| `enabled` | integer NOT NULL default 1 | Boolean. |
| `created_at` | text NOT NULL | ISO-8601. |

- **Unique**: (`store_id`, `name`, `sales_channel`).
- **Validation**: `name` ∈ {DELIVERY, INDOOR}; `sales_channel` non-empty.

## Entity: MerchantShift (`merchant_shifts`) — opening hours

Weekly recurring shifts (iFood Opening Hours model).

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `store_id` | text NOT NULL FK→stores.id | |
| `day_of_week` | text NOT NULL | `MONDAY`..`SUNDAY`. |
| `start` | text NOT NULL | `HH:MM` or `HH:MM:SS`. |
| `duration_minutes` | integer NOT NULL | > 0; minutes from `start`. |
| `enabled` | integer NOT NULL default 1 | Boolean. |
| `created_at` | text NOT NULL | ISO-8601. |

- **Validation** (`validateShift`): `day_of_week` valid enum; `start` matches `HH:MM(:SS)?` with
  hours 0–23, minutes/seconds 0–59; `duration_minutes` between 1 and 1440 (a shift may wrap past
  midnight but cannot exceed 24h).
- **Migration of store-scope hours**: feature-005 `availability_schedules` rows with
  `scope_type = 'store'` are converted into `merchant_shifts` (start→start; duration = end−start in
  minutes; per weekday); store-scope schedules are then no longer the source for merchant hours.

## Entity: MerchantInterruption (`merchant_interruptions`)

Temporary closures.

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | |
| `store_id` | text NOT NULL FK→stores.id | |
| `description` | text NOT NULL | |
| `start` | text NOT NULL | ISO-8601 datetime. |
| `end` | text NOT NULL | ISO-8601 datetime; `start` < `end`. |
| `created_at` | text NOT NULL | ISO-8601; used for the recently-created delete guard. |

- **Validation** (`validateInterruption`): `description` non-empty; `start`/`end` valid ISO-8601;
  `start` < `end`.
- **Overlap** (`findInterruptionOverlap`): a new interruption overlapping an existing one →
  `InterruptionOverlap` (409).
- **Delete guard** (`canDeleteInterruption(interruption, now)`): blocks deletion within the
  recently-created threshold (default 60s of `created_at`) → `RecentlyCreatedInterruption` (409).

## Derived: MerchantStatus (computed, not stored)

`resolveMerchantStatus(input, now)` → per operation:

| Field | Notes |
|-------|-------|
| `operation` | DELIVERY \| INDOOR |
| `salesChannel` | e.g. ifood-app |
| `available` | boolean — enabled AND within a shift AND not in an active interruption |
| `state` | `OK` \| `WARNING` \| `CLOSED` \| `ERROR` |
| `reopenable` | boolean |
| `validations[]` | `{ id, code, state, message: { title, subtitle, description } }` |

State rules: merchant `UNAVAILABLE` or operation disabled → `CLOSED`/`ERROR` with a validation;
outside all shifts → `CLOSED` (reopenable when a future shift exists); within an active
interruption → `CLOSED` with an interruption validation; otherwise `OK`/available.

## Relationships

```text
stores (merchant, 1)
  ├─ 1..* merchant_operations   (store_id)
  ├─ 0..* merchant_shifts       (store_id)
  ├─ 0..* merchant_interruptions(store_id)
  └─ 1..* catalogs              (store_id)   ← preserved from feature 005
```

## State machine — merchant persistence (`merchantPersistence.ts`)

`empty → loading → ready | error`; `ready` carries the merchant + operations + shifts +
interruptions snapshot. Mutations (save profile, set hours, add/delete interruption, toggle
operation) re-load into `ready`. Pure reducer for unit/mutation testing.
