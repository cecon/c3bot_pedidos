# Quickstart: Merchant Registry

Bring up the merchant registry locally and exercise the four user stories.

## Prerequisites

- Dependencies installed (`pnpm install`); feature 005 (catalog) already on `main`.
- Two terminals: the local API and the Vite/Tauri app.

## 1. Apply migrations

Migration `004_merchant_registry.sql` is registered in both runners (`src-tauri/src/migrations.rs`
and `scripts/migrations.ts`) and is idempotent (ADR-0003). It runs automatically on app/API start;
re-running is safe. It enriches the existing `stores` row, creates `merchant_operations`,
`merchant_shifts`, `merchant_interruptions`, and migrates store-scope `availability_schedules` into
shifts.

## 2. Start the local API and app

```bash
pnpm api      # node:http API on :3922
pnpm dev      # Vite on :3920 (VITE_C3BOT_API_BASE_URL → :3922)
```

Open the app, go to the **Merchant** entry in the workspace nav.

## 3. US1 — Maintain the merchant profile (MVP)

- Edit public name, corporate name (razão social), description, average ticket, type, exclusive,
  address (incl. coordinates), CNPJ (alphanumeric), and the external reference code.
- Save. The profile validates required fields; "ready for handoff" requires CNPJ + external code.

Verify via API:

```bash
curl localhost:3922/merchants                 # paginated list (single merchant)
curl localhost:3922/merchants/<merchantId>     # detail
```

## 4. US2 — Opening hours (shifts)

- Add weekly shifts per weekday: day, start (HH:MM), duration (minutes), enabled.
- Save.

```bash
curl localhost:3922/merchants/<id>/opening-hours
curl -X PUT localhost:3922/merchants/<id>/opening-hours \
  -H 'content-type: application/json' \
  -d '{"shifts":[{"dayOfWeek":"MONDAY","start":"18:00:00","duration":300}]}'
```

## 5. US3 — Interruptions

- Create an interruption (description + start/end ISO-8601, start < end). Overlapping an existing
  one is rejected (409 InterruptionOverlap). Deleting one created seconds ago is rejected (409
  RecentlyCreatedInterruption).

```bash
curl -X POST localhost:3922/merchants/<id>/interruptions \
  -H 'content-type: application/json' \
  -d '{"description":"Manutenção","start":"2026-06-03T14:00:00Z","end":"2026-06-03T16:00:00Z"}'
curl localhost:3922/merchants/<id>/interruptions
curl -X DELETE localhost:3922/merchants/<id>/interruptions/<interruptionId>
```

## 6. US4 — Status / availability

```bash
curl localhost:3922/merchants/<id>/status
curl localhost:3922/merchants/<id>/status/DELIVERY
```

Returns availability per operation with `state` (OK|WARNING|CLOSED|ERROR), `reopenable`, and
`validations` explaining closures (disabled, outside hours, active interruption).

## 7. API docs

The merchant endpoints appear in the in-app **API Docs** (Swagger) menu, served from the OpenAPI
single source of truth (`scripts/api/openapi.ts`); a coverage test asserts every merchant route is
documented.

## 8. Quality gates

```bash
pnpm typecheck && pnpm test && pnpm build
pnpm test:mutation     # StrykerJS ≥85% on src/domain/merchant/** (run locally; not in CI)
cargo check && cargo test --manifest-path src-tauri/Cargo.toml
```
