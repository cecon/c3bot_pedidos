# Merchant Contract: Domain · HTTP · UI

Companion to `openapi.yaml`. Defines the three contract layers and the invariants the
implementation and tests must uphold.

## Domain contract (pure, mutation-gated — `src/domain/merchant/**`)

### `validateMerchant(input): { ok: boolean; errors: string[] }`
- `name` required (non-empty after trim).
- `type` non-empty (default `RESTAURANT`); `status` ∈ {AVAILABLE, UNAVAILABLE}.
- `average_ticket_cents` ≥ 0 when present.
- `latitude` ∈ [-90, 90], `longitude` ∈ [-180, 180] when present.
- "ready for handoff" additionally requires non-empty `cnpj` and `external_code`.

### `validateShift(shift): { ok; errors }`
- `dayOfWeek` ∈ {MONDAY..SUNDAY}.
- `start` matches `^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$`.
- `duration` integer, 1..1440.

### `validateInterruption(input): { ok; errors }`
- `description` non-empty; `start`/`end` valid ISO-8601; `start` < `end`.

### `findInterruptionOverlap(candidate, existing[]): Interruption | null`
- Returns the first existing interruption whose [start,end) intersects the candidate's, else null.

### `canDeleteInterruption(interruption, nowIso, thresholdSeconds = 60): boolean`
- `false` when `now - createdAt < threshold`; else `true`.

### `resolveMerchantStatus(input, nowIso): Status[]`
- One `Status` per enabled+disabled operation.
- `available = merchant.status === AVAILABLE && operation.enabled && withinShift && !activeInterruption`.
- `state`: `ERROR` if merchant UNAVAILABLE or operation disabled; `CLOSED` if outside shift or in an
  active interruption; else `OK`.
- `reopenable = true` when closed only by hours/interruption (a later shift exists), `false` when
  ERROR.
- `validations[]`: one entry per reason with stable `code` (`MERCHANT_UNAVAILABLE`,
  `OPERATION_DISABLED`, `OUTSIDE_OPENING_HOURS`, `ACTIVE_INTERRUPTION`) and human `message`.

## HTTP contract (`scripts/api/**`)

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/merchants?page&size` | Array (single merchant); page≥1, size default 100. |
| GET | `/merchants/{id}` | Detail; 404 if unknown. |
| PUT | `/merchants/{id}` | Validate+persist profile; 400 on invalid. |
| GET | `/merchants/{id}/status` | All operations. |
| GET | `/merchants/{id}/status/{operation}` | One operation; 404 if unknown operation. |
| GET | `/merchants/{id}/opening-hours` | `{ shifts: [...] }`. |
| PUT | `/merchants/{id}/opening-hours` | Replace shifts; 400 on invalid shift. |
| GET | `/merchants/{id}/interruptions` | Current + future. |
| POST | `/merchants/{id}/interruptions` | 201; 400 invalid; 409 `InterruptionOverlap`. |
| DELETE | `/merchants/{id}/interruptions/{iid}` | 204; 404 unknown; 409 `RecentlyCreatedInterruption`. |

- Errors use `{ code, message }`. 401 (unauthenticated) vs 403 (forbidden) shapes are reserved.
- Every route above MUST appear in the generated OpenAPI; a coverage test asserts this.

## UI contract (presentational — `src/components/**`)

- **MerchantPanel**: receives `merchant`, `operations`, `shifts`, `interruptions`, `status[]` via
  props; emits `onSaveProfile`, `onToggleOperation`, `onSaveHours`, `onCreateInterruption`,
  `onDeleteInterruption`. No IO inside the component.
- **ShiftEditor**: edits the weekly shift list; disables save until all shifts pass `validateShift`.
- **InterruptionsEditor**: lists interruptions, create form gated by `validateInterruption`; a
  delete blocked by `canDeleteInterruption` shows a non-blocking warning, not a crash.
- Status surfaces an availability badge per operation (OK green / CLOSED gray / WARNING amber /
  ERROR red) with the validation messages.
- "Not ready for handoff" (missing CNPJ/external code) shows a non-blocking warning badge, mirroring
  the catalog "não mapeado" pattern.

## Test obligations

- Domain: unit tests for each rule above; StrykerJS ≥85% break on `src/domain/merchant/**`.
- API: per-route tests incl. 400/404/409 paths and the OpenAPI coverage test.
- UI: component tests for save-gating, status badges, and the delete-guard warning.
