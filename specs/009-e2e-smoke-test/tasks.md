---
description: "Task list for End-to-End Smoke Test — Launch & Navigate"
---

# Tasks: End-to-End Smoke Test — Launch & Navigate

**Input**: Design documents from `/specs/009-e2e-smoke-test/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Note**: For this feature the smoke **tests are the deliverable** — the E2E spec/harness IS the
implementation. There is no separate "production code" beyond the harness plus three inert
`data-testid` hooks on existing components.

**Organization**: Tasks are grouped by user story (US1 → US3) so each layer can be implemented and
demonstrated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 / US2 / US3 (Setup, Foundational, Polish carry no story label)
- Paths are repo-root relative.

## Path Conventions

- App code: `src/` (only 3 `data-testid` edits)
- E2E harness: new top-level `e2e/` tree
- Scripts: `package.json`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Bring in the E2E toolchain and scaffold the harness without touching app behavior.

- [x] T001 Add WebdriverIO dev dependencies (`@wdio/cli`, `@wdio/local-runner`, `@wdio/mocha-framework`, `@wdio/spec-reporter`) to `package.json` devDependencies, then run `pnpm install`. Note: `edgedriver`/`msedgedriver` is a **Windows-host prerequisite** for the native layer (kept out of cross-platform devDependencies so `pnpm install` stays clean on macOS/Linux)
- [x] T002 [P] Create the `e2e/` directory structure: `e2e/specs/`, `e2e/pageobjects/`, `e2e/support/`
- [x] T003 [P] Add `e2e/tsconfig.e2e.json` (TS config for the e2e tree with WebdriverIO + Mocha types; not part of the app build)
- [x] T004 [P] Ensure the `e2e/` tree is excluded from unit/build gates: add `"e2e/**"` to `test.exclude` in `vite.config.ts` and confirm app `tsconfig`/`tsc` does not compile `e2e/` (keep `pnpm test`, `pnpm typecheck`, `pnpm build` unaffected)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared selectors, app test hooks, platform guard, and the WDIO base config that every
story builds on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T005 [P] Add `data-testid="app-shell"` to the root element of `src/components/AdminShell.tsx`
- [x] T006 [P] Add `data-testid="panel-dashboard"` to the root element of `src/components/DashboardPanel.tsx`
- [x] T007 [P] Add `data-testid="panel-attendants"` to the root element of `src/components/AttendantsPanel.tsx`
- [x] T008 [P] Create `e2e/support/platform.ts` — `isWindows` guard + `skipUnlessWindows()` helper that prints "native smoke skipped — Windows only" and exits `0` (FR-014/FR-015)
- [x] T009 Create `e2e/pageobjects/workspace.page.ts` — selectors from [contracts/ui-handles.md](./contracts/ui-handles.md) (`app-shell`, `nav[aria-label="Navegação principal"]`, `header h1`, nav buttons `Dashboard`/`Atendentes`, `panel-dashboard`, `panel-attendants`) plus actions: `waitForReady(timeoutMs)`, `gotoDashboard()`, `gotoAttendants()`, `headerTitle()`
- [x] T010 Create `e2e/wdio.shared.conf.ts` — Mocha framework, `spec` reporter, specs glob `e2e/specs/**/*.e2e.ts`, bounded `waitforTimeout` and `mochaOpts.timeout` (shared base both layer configs extend; TS is transpiled by WDIO's built-in tsx loader)

**Checkpoint**: Handles, page object, platform guard, and base config exist — story layers can begin.

---

## Phase 3: User Story 1 - App launches and the workspace opens (Priority: P1) 🎯 MVP

**Goal**: A single command launches the served app and asserts the workspace shell opens (FR-001..004).

**Independent Test**: Run `pnpm test:e2e`; it starts the app, waits for `app-shell`, and passes only
if the shell (navigation + header + content) is visible — failing with "did not open" on timeout.

- [x] T011 [US1] Create `e2e/support/devServer.ts` — spawn `pnpm dev` (attendant API `:3922` + Vite `:3920`) reusing the orchestration pattern in `scripts/dev-with-api.mjs`, poll `http://localhost:3920` until ready, tear down on completion; honor `E2E_BASE_URL` and `E2E_NO_SERVER=1` to attach to an already-running server (FR-009)
- [x] T012 [US1] Create `e2e/wdio.web.conf.ts` — extends `wdio.shared.conf.ts`; headless Chrome/Edge capability; `baseUrl` from `E2E_BASE_URL` or `http://localhost:3920`; `onPrepare` starts `devServer` (unless `E2E_NO_SERVER`), `onComplete` stops it
- [x] T013 [US1] Create `e2e/specs/smoke.e2e.ts` — the "app opens" test: navigate to baseUrl, `page.waitForReady()`, assert `nav[aria-label="Navegação principal"]`, `header h1`, and `main` are displayed; assert the nav exposes exactly Dashboard + Atendentes; on timeout fail with an explicit "app did not open" message (FR-003/FR-004, SC-004)
- [x] T014 [US1] Add `"test:e2e": "wdio run e2e/wdio.web.conf.ts"` to `package.json` scripts (FR-001/FR-008)

**Checkpoint**: `pnpm test:e2e` proves the app boots — MVP shippable on its own.

---

## Phase 4: User Story 2 - Both menu destinations are reachable (Priority: P2)

**Goal**: The same web run navigates to Dashboard and Attendants and asserts each panel renders
(FR-005..007).

**Independent Test**: Run `pnpm test:e2e`; after opening, it clicks each nav item and passes only if
both panels render their distinguishing content, failing naming the destination otherwise.

- [x] T015 [US2] Extend `e2e/specs/smoke.e2e.ts` (after the US1 open assertions): call `gotoDashboard()` → assert `panel-dashboard` displayed and `header h1` text is "Dashboard" (FR-005); call `gotoAttendants()` → assert `panel-attendants` displayed and `header h1` text is "Atendentes" (FR-006); wrap each in a step that fails naming the destination (FR-007, SC-005)
- [x] T016 [US2] Add secondary copy assertions as defense-in-depth in `e2e/specs/smoke.e2e.ts`: Dashboard shows "Bem-vindo ao C3Bot"; Attendants shows the `h2` "Atendentes" and the "Adicionar atendente" button (per [contracts/ui-handles.md](./contracts/ui-handles.md))

**Checkpoint**: `pnpm test:e2e` proves the app opens AND both menus work (full render-layer smoke).

---

## Phase 5: User Story 3 - Native desktop window smoke on Windows (Priority: P3)

**Goal**: Run the *same* spec against the built native window via `tauri-driver` on Windows; skip
cleanly elsewhere (FR-012..015, SC-007/008).

**Independent Test**: On Windows, `pnpm tauri build` then `pnpm test:e2e:native` launches the real
window and runs the smoke spec; on non-Windows it prints "skipped — Windows only" and exits `0`.

> Reuses `e2e/specs/smoke.e2e.ts` unchanged (FR-013) — only the launch config differs. Depends on the
> spec from US1/US2 existing.

- [x] T017 [US3] Create `e2e/support/tauriDriver.ts` — a WDIO launcher service that spawns `tauri-driver` (with `--native-driver` pointing at `msedgedriver` from `edgedriver`) before the session and stops it after (research.md Decision 3)
- [x] T018 [US3] Create `e2e/wdio.native.conf.ts` — extends `wdio.shared.conf.ts`; registers the `tauriDriver` service; `tauri:options.application` → `src-tauri/target/release/c3bot.exe` (productName C3Bot); same specs glob, no `baseUrl`/devServer
- [x] T019 [US3] Add `"test:e2e:native"` to `package.json` scripts: guard via `e2e/support/platform.ts` — on non-Windows print the skip message and exit `0`; on Windows run `wdio run e2e/wdio.native.conf.ts` (FR-014/FR-015)
- [x] T020 [US3] Align native prerequisites in [quickstart.md](./quickstart.md) with the actual `msedgedriver` discovery path used in `tauriDriver.ts` (cargo install tauri-driver, `edgedriver`)

**Checkpoint**: All three layers functional; native runs on Windows, skips elsewhere.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T021 [P] Add `.gitignore` entries for E2E artifacts (e.g. `e2e/**/logs/`, screenshots, `wdio` output)
- [x] T022 [P] Add a brief `e2e/README.md` pointing to [quickstart.md](./quickstart.md) and the two commands
- [x] T023 Run `pnpm test:e2e` and confirm green end-to-end on the dev machine (quickstart render-layer validation, SC-001/SC-003); note native validation must run on a Windows host
- [x] T024 Confirm gates are unaffected: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` still pass with `e2e/` excluded, and `pnpm ci` is unchanged (E2E intentionally not wired into CI)
- [x] T025 Add a failure-path verification (`e2e/verify-failure-path.ts` + `e2e/fixtures/shell-no-panels.html` + `test:e2e:verify-failure`): assert the smoke fails with non-zero exit and "did not open" when the app never renders (SC-004), and "did not render" naming the destination when the shell loads but panels are absent (SC-005)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately.
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all stories.
- **US1 (Phase 3)**: depends on Foundational. The MVP.
- **US2 (Phase 4)**: depends on Foundational; edits the same spec file created in US1, so runs after T013.
- **US3 (Phase 5)**: depends on Foundational and on the shared spec from US1/US2 (it reuses it verbatim).
- **Polish (Phase 6)**: after the desired stories are complete.

### Within Each User Story

- US1: devServer (T011) → web config (T012) → spec open test (T013) → script (T014).
- US2: T015 then T016 (same spec file — sequential, not parallel).
- US3: tauriDriver service (T017) → native config (T018) → guarded script (T019) → docs (T020).

### Parallel Opportunities

- Setup: T002, T003, T004 in parallel after T001.
- Foundational: T005, T006, T007, T008 in parallel (different files); T009 then T010.
- US1 internal tasks are mostly sequential (shared files). US3 T017/T018 touch different files but T018 references T017.
- Polish: T021, T022 in parallel.

---

## Parallel Example: Foundational

```bash
# After Setup, launch the independent foundational tasks together:
Task: "Add data-testid=app-shell in src/components/AdminShell.tsx"          # T005
Task: "Add data-testid=panel-dashboard in src/components/DashboardPanel.tsx" # T006
Task: "Add data-testid=panel-attendants in src/components/AttendantsPanel.tsx" # T007
Task: "Create e2e/support/platform.ts (Windows guard)"                       # T008
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → Phase 2 Foundational → Phase 3 US1.
2. **STOP and VALIDATE**: `pnpm test:e2e` proves the app opens. Shippable.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → "does it boot?" gate (MVP).
3. US2 → adds menu-navigation coverage (full render-layer smoke).
4. US3 → adds native Windows coverage (reuses the same spec).
5. Polish → docs, ignores, gate verification.

---

## Notes

- The render-layer layer (US1/US2) is cross-platform and the everyday gate; US3 is Windows-only.
- One spec file (`e2e/specs/smoke.e2e.ts`) serves all layers — only the WDIO config/launch differs.
- E2E is additive: Vitest unit + Stryker mutation gates and `pnpm ci` stay unchanged.
- Commit after each task or logical group.
