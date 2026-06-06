# Implementation Plan: End-to-End Smoke Test — Launch & Navigate

**Branch**: `009-e2e-smoke-test` | **Date**: 2026-06-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-e2e-smoke-test/spec.md`

## Summary

Add an automated **smoke test** that launches the C3Bot admin app, verifies the workspace opens, and
navigates both menus (Dashboard + Atendentes). Two layers share one spec: a cross-platform
**render-layer** run (US1/US2) that drives the served app in a headless browser, and a Windows-only
**native-shell** run (US3) that drives the real Tauri window via `tauri-driver`. **WebdriverIO +
Mocha** is the single framework so the same spec and selectors serve both layers — only the launch
mechanism differs. GitHub CI wiring is deferred; the native run targets a local Windows environment
and skips cleanly elsewhere.

## Technical Context

**Language/Version**: TypeScript 5.8 (E2E specs), Node 24; Rust 2021 (native desktop build, unchanged).

**Primary Dependencies**: **ADD (dev-only)** — WebdriverIO 9 (`@wdio/cli`, `@wdio/local-runner`,
`@wdio/mocha-framework`, `@wdio/spec-reporter`), `edgedriver` (Windows, WebView2 match), and
`tauri-driver` via `cargo install` (not npm). Reuse: `tsx` (server spawn), existing Vite dev
orchestration. **UNCHANGED** — Vitest 4 + Testing Library (unit), StrykerJS 9 (mutation), Tauri 2.

**Storage**: N/A — the smoke asserts rendering/navigation only; no data seeded, no schema/migration
changes.

**Testing**: WebdriverIO + Mocha for E2E (new); Vitest unit + Stryker mutation unchanged. New scripts
`pnpm test:e2e` (web) and `pnpm test:e2e:native` (Windows). Not added to `pnpm ci` yet (deferred).

**Target Platform**: Render-layer — any dev OS (headless Chromium/Edge), incl. macOS. Native — Windows
(WebView2 + msedgedriver + tauri-driver). macOS native is unsupported by the tooling, hence the split.

**Project Type**: Local-first Tauri desktop app; this feature adds a test layer only.

**Performance Goals**: Full render-layer run < 60s on a typical dev machine (SC-003); native run
bounded but slower (build + window launch).

**Constraints**: Shared spec/selectors across layers (FR-013); independently invocable, web run never
needs the native binary (FR-015); skip cleanly on unsupported platform (FR-014); bounded readiness
waits, no fixed sleeps (FR-002); stable accessible/`data-testid` handles (FR-010); self-contained
process/port teardown (FR-009); non-zero exit on failure (FR-008). GitHub CI deferred.

**Scale/Scope**: 1 shared spec, 2 layers, 2 destinations, ~3 assertions per destination. New `e2e/`
tree (~6 files) + 3 `data-testid` hooks + 2 package scripts.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-Driven Product Slices | spec → plan → tasks; US1 (app opens) is the MVP; US1–US3 independently testable. | PASS |
| II. Local-First Desktop Stack | App stack unchanged; WebdriverIO/tauri-driver are dev-only E2E tooling (Vitest stays for unit). No Mantine, no app deps added. | PASS |
| III. Session Security and Privacy | No tokens/PII; smoke seeds no data and logs none. | PASS |
| IV. Test and Mutation Gates | Additive E2E; unit + Stryker mutation gates untouched. Harness is glue (no domain logic), so no new mutation surface. | PASS |
| V. Operator-Grade Dark UX | No UI behavior change; only inert `data-testid` hooks added to existing components. | PASS |

**Result**: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/009-e2e-smoke-test/
├── plan.md            # this file
├── research.md        # Phase 0 — framework & platform decisions
├── data-model.md      # Phase 1 — test-harness constructs (no app data)
├── quickstart.md      # Phase 1 — how to run both layers
├── contracts/
│   ├── test-contract.md   # commands + scenario + failure contract
│   └── ui-handles.md      # stable selector contract
├── checklists/requirements.md
└── tasks.md           # /speckit-tasks output (not created here)
```

### Source Code (repository root) — ADD only

```text
ADD (E2E harness, dev-only):
  e2e/wdio.shared.conf.ts          # specs glob, mocha, spec-reporter, timeouts
  e2e/wdio.web.conf.ts             # browser caps (headless) + onPrepare/onComplete dev-server hooks
  e2e/wdio.native.conf.ts          # Windows: tauri-driver launcher service + tauri:options capability
  e2e/specs/smoke.e2e.ts           # the one shared smoke spec (open + navigate both menus)
  e2e/pageobjects/workspace.page.ts# selectors (accessible names + data-testid) and step actions
  e2e/support/devServer.ts         # spawn/await/teardown of pnpm dev (api+vite) for the web layer
  e2e/support/platform.ts          # isWindows guard + skip helper (FR-014)
  tsconfig.e2e.json (if needed)    # TS config for the e2e tree

ADD (light app groundwork — inert test hooks):
  data-testid="app-shell"        in src/components/AdminShell.tsx
  data-testid="panel-dashboard"  in src/components/DashboardPanel.tsx
  data-testid="panel-attendants" in src/components/AttendantsPanel.tsx

EDIT:
  package.json  → scripts: "test:e2e", "test:e2e:native"; devDependencies for WebdriverIO + edgedriver
  .gitignore    → ignore e2e artifacts (logs, screenshots) if produced

UNCHANGED:
  src/** app code (except the 3 data-testid hooks), src-tauri/**, existing vitest/stryker config
```

**Structure Decision**: Single project; a new top-level `e2e/` directory holds the WebdriverIO
harness, kept out of the Vitest include so unit runs are unaffected. One spec + one page object are
shared between `wdio.web.conf.ts` and `wdio.native.conf.ts`; the configs differ only in capabilities
and launch/teardown. The web layer reuses the existing `pnpm dev` orchestration
([scripts/dev-with-api.mjs](../../scripts/dev-with-api.mjs)); the native layer launches the built
`c3bot.exe` through `tauri-driver` → `msedgedriver`.

## Complexity Tracking

No constitution violations; section intentionally empty.
