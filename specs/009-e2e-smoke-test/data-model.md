# Phase 1 Data Model: End-to-End Smoke Test — Launch & Navigate

**Feature**: 009-e2e-smoke-test · **Date**: 2026-06-06

This feature introduces **no application data**. The "entities" below are test-harness constructs
(page objects / fixtures), not persisted domain models. There are no migrations and no schema changes.

## Entity: SmokeTarget (test layer)

Represents which surface the shared spec drives.

| Field | Type | Notes |
|-------|------|-------|
| `kind` | `"web" \| "native"` | Selects the WDIO config/capabilities. |
| `readyTimeoutMs` | number | Bounded wait for the workspace to appear (FR-002, FR-004). |
| `baseUrl` | string \| undefined | Web only: `http://localhost:3920`. Native: undefined (binary launch). |

**Validation / behavior**:
- `native` is only valid on Windows; otherwise the run skips (FR-014).
- The same spec + page object run against either target; only `kind` and launch differ (FR-013/FR-015).

## Entity: WorkspacePage (page object)

Stable handles the spec depends on. Full selector contract in
[contracts/ui-handles.md](./contracts/ui-handles.md).

| Element | Handle (primary) | Used for |
|---------|------------------|----------|
| Shell root | `[data-testid="app-shell"]` (added) | App-opened readiness (US1). |
| Navigation | `nav[aria-label="Navegação principal"]` | Shell presence (FR-003). |
| Header title | `header h1` | Active destination label reflects navigation. |
| Nav: Dashboard | `button[aria-label="Dashboard"]` | Navigate to Dashboard (US2). |
| Nav: Attendants | `button[aria-label="Atendentes"]` | Navigate to Attendants (US2). |
| Dashboard panel | `[data-testid="panel-dashboard"]` (added) | Dashboard render assertion (FR-005). |
| Attendants panel | `[data-testid="panel-attendants"]` (added) | Attendants render assertion (FR-006). |

**State transitions** (navigation):
- `not-running → opened`: launch target, wait for `app-shell` within `readyTimeoutMs`.
- `opened → dashboard`: click Dashboard nav → `panel-dashboard` displayed, `h1` == "Dashboard".
- `opened → attendants`: click Attendants nav → `panel-attendants` displayed, `h1` == "Atendentes".

## Entity: SmokeRunResult (reporting)

Per-run outcome surfaced by the test reporter and the process exit code.

| Field | Type | Notes |
|-------|------|-------|
| `opened` | boolean | US1 result. |
| `dashboardReached` | boolean | US2 result for Dashboard. |
| `attendantsReached` | boolean | US2 result for Attendants. |
| `exitCode` | number | `0` pass/skip; non-zero on failure (FR-008, SC-006). |
| `skippedReason` | string \| undefined | Set when native skipped on non-Windows (FR-014). |
