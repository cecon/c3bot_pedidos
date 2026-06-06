---
description: "Task list for Minimal shadcn/ui Base — Dashboard + Attendants (008)"
---

# Tasks: Minimal shadcn/ui Base — Dashboard + Attendants

**Input**: Design documents from `/specs/008-shadcn-replatform/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md

**Tests**: Included — attendant pure-rule/repo tests are preserved; component tests are rewritten for
the shadcn/Radix DOM; StrykerJS ≥85% on remaining pure rules.

**Organization**: Grouped by user story (P1→P4). Each story is an independently testable increment;
the app builds at each checkpoint (teardown happens last).

**Status**: ✅ COMPLETE — 41/41 tasks. Implemented 2026-06-06 on branch `008-shadcn-replatform`
(PR https://github.com/cecon/c3bot_pedidos/pull/8). Gates green: typecheck, test (67), lint (0 err),
max-lines, mutation 91.45%, build, cargo. shadcn MCP wired (`.mcp.json`) with a PreToolUse wrapper-
guard hook; review recs applied (Sonner, `data-slot` parity, Button-wrapper nav).

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup (new stack foundation)

- [x] T001 Add deps: `tailwindcss`, `autoprefixer`, `tailwind-merge`, `class-variance-authority`,
      `@tanstack/react-table`, `lucide-react`, required `@radix-ui/react-*`; remove `postcss-preset-mantine`
      from devDeps (keep Mantine installed until US4) in `package.json`.
- [x] T002 [P] Configure Tailwind: `tailwind.config.ts` (`darkMode: "class"`, content globs, token→color map) and PostCSS (`postcss.config`) for tailwind + autoprefixer.
- [x] T003 [P] Add `src/lib/utils.ts` with `cn()` (clsx + tailwind-merge).
- [x] T004 [P] Create `src/theme/themeTokens.ts` (colors/typography/radius/spacing/breakpoints) as the single source.
- [x] T005 Replace global CSS (`src/styles.css` + remove `sidebar-nav.css`/`shell.css` remnants) with Tailwind directives + shadcn CSS-variable tokens for `:root` and `.dark`; self-host Inter `@font-face`.
- [x] T006 [P] Add icon shim: rewrite `src/components/icons.ts` to re-export Lucide under existing local names.

---

## Phase 2: Foundational (blocking primitives + theme + nav)

- [x] T007 [P] Add shadcn primitives in `src/components/ui/`: button, input, label, card, badge, separator, scroll-area.
- [x] T008 [P] Add shadcn overlay primitives in `src/components/ui/`: dialog, sheet, dropdown-menu, tooltip, select, switch, tabs.
- [x] T009 [P] Add `src/components/ui/toast.tsx` + `toaster` + `toast()` (Radix Toast) to replace Mantine notifications.
- [x] T010 [P] Add `src/components/ui/table.tsx` and `src/components/ui/data-table.tsx` (TanStack wrapper: columns, sorting, empty state, row-actions slot).
- [x] T011 Define `AppearanceSettings` + `DEFAULT_APPEARANCE` + migration-safe load/serialize in `src/theme/appearance.ts` (+ `src/theme/appearance.test.ts`).
- [x] T012 Rewrite `src/components/ThemeSettingsProvider.tsx` (now `useAppearance`): apply `dark` class + CSS-variable overrides + persist to localStorage; apply on mount.
- [x] T013 Trim `src/domain/navigation.ts` to exactly two destinations (Dashboard, Atendentes); remove catalog sub-pages and all other destinations; a hash to a removed page resolves to Dashboard. Update `src/domain/navigation.test.ts`.
- [x] T014 Component test `src/components/ThemeSettingsProvider.test.tsx` (apply + persist + reload).

**Checkpoint**: primitives, theme, and 2-item nav exist.

---

## Phase 3: User Story 1 — Minimal shell (Priority: P1) 🎯 MVP

**Goal**: App renders on shadcn shell with only Dashboard + Atendentes; sidebar collapsible; dark default.

**Independent Test**: Two nav items only, sidebar toggle persists, color mode switch persists; no Mantine in shell.

- [x] T015 [US1] Rewrite `src/components/AdminShell.tsx` on shadcn (layout grid, `--app-sidebar-width`, `data-collapsed`).
- [x] T016 [US1] Rewrite `src/components/SidebarNav.tsx`: collapsible icon rail + tooltips, two destinations, active marking.
- [x] T017 [US1] Rewrite `src/components/AppHeader.tsx`: sidebar toggle + logo + color-mode toggle + theme settings trigger (lean header).
- [x] T018 [US1] Rewrite `src/components/ThemeSettingsDrawer.tsx` as a shadcn `Sheet` (color mode, primary/secondary/semantic, font, density, radius).
- [x] T019 [US1] Switch `src/main.tsx` + `src/App.tsx` off the Mantine provider onto the new shell/theme provider; wire hash nav.
- [x] T020 [P] [US1] Component tests for shell + sidebar (collapse/tooltips/active) + header (toggles) in `src/components/*.test.tsx`.

**Checkpoint**: minimal shell boots on shadcn (MVP).

---

## Phase 4: User Story 2 — Attendants registry (Priority: P2)

**Goal**: Rebuild attendants on shadcn + TanStack with persistence intact.

**Independent Test**: CRUD + availability persist across reload; list in DataTable with empty state.

- [x] T021 [US2] Rebuild `src/components/AttendantsPanel.tsx` on shadcn (header, actions, state handling) using `data-table.tsx`.
- [x] T022 [P] [US2] Rebuild `src/components/AttendantForm.tsx` on shadcn form controls (controlled state + validation helpers).
- [x] T023 [P] [US2] Rebuild `src/components/AvailabilityControl.tsx` on shadcn (status not by color alone).
- [x] T024 [US2] Define attendant columns + row actions (edit/availability/delete) for the DataTable; remove old `AttendantsTable.tsx`.
- [x] T025 [US2] Verify attendant persistence path end-to-end (repository/API/migration `002`) unchanged; keep `attendantRepository*`/`attendantRestRepository*` and their tests.
- [x] T026 [P] [US2] Rewrite attendant component tests for the shadcn/Radix DOM (`AttendantsPanel.test.tsx`, form/availability).

**Checkpoint**: Attendants fully functional + persisted on the new stack.

---

## Phase 5: User Story 3 — Simplified Dashboard (Priority: P3)

**Goal**: Clean Dashboard on shadcn with attendant-derived stats only.

**Independent Test**: Dashboard renders with stat cards and no removed-domain references.

- [x] T027 [US3] Add `src/components/ui`-based `StatWidget`/`DashboardCard` (replacing `Metric.tsx`).
- [x] T028 [US3] Rewrite `src/components/DashboardPanel.tsx`: attendant counts/availability + welcome; drop sessions/orders/catalog/campaign KPIs.
- [x] T029 [P] [US3] Rewrite `DashboardPanel.test.tsx` for the new DOM and attendant-only stats.

**Checkpoint**: Dashboard clean and dependency-free of removed domains.

---

## Phase 6: User Story 4 — Strip everything else + remove Mantine (Priority: P4)

**Goal**: Delete all other pages/domains/persistence and Mantine; green gates.

**Independent Test**: Only 2 pages; only attendant data persists; no Mantine/Tabler; suite green.

- [x] T030 [US4] Delete removed page/feature components: Session/Chat, Catalog* , Orders, Customers, Merchant*, Automation*, Campaigns, OpsPanel, ApiDocsPanel, and Product/Item/Option/Combo/Pizza/Shift/Weekly/Interruptions editors; update `WorkspaceRoutes.tsx`.
- [x] T031 [US4] Delete catalog/merchant DB + domain: `src/db/{catalogSchema,merchantSchema,pizzaSchema}.ts`, `src/domain/{catalog,merchant}/**`, `catalogPersistence*`, related `types.ts` entries; keep attendant + appearance + nav types.
- [x] T032 [US4] Delete catalog/merchant services + API: `src/services/{catalogApi,merchantApi,pizzaConfigSync*}.ts`, `scripts/api/*` except shared `{db,http,errors}.ts` used by `scripts/attendant-api.ts`.
- [x] T033 [US4] Remove migrations `003_product_catalog.sql`, `004_merchant_registry.sql` and unregister them in `src-tauri/src/migrations.rs` and `scripts/migrations.ts`; verify `001_init` holds no removed-domain tables (trim if it does).
- [x] T034 [US4] Prune `src/domain/mockData.ts` to attendant/dashboard data only; remove `analytics*` if unused after Dashboard rewrite.
- [x] T035 [US4] Remove deps from `package.json`: `@mantine/core`, `@mantine/form`, `@mantine/hooks`, `@mantine/notifications`, `@tabler/icons-react`, `swagger-ui-dist`; run install.
- [x] T036 [US4] Repo sweep: `grep -r "@mantine" src` and `grep -r "@tabler" src` return nothing; fix any stragglers.

**Checkpoint**: clean minimal base; only Dashboard + Atendentes; only attendant persistence.

---

## Phase 7: Polish & Verification

- [x] T037 [P] Run `pnpm test:mutation` on remaining pure rules (attendants, navigation, appearance) ≥85% break.
- [x] T038 `pnpm max-lines`; split any file over 300 useful lines.
- [x] T039 [P] `/ui-review` (mantine-ux harness drives the preview regardless of framework) on shell + Attendants + Dashboard; fix contrast/density/a11y findings; verify no overlap at desktop+tablet.
- [x] T040 Run quickstart validation + full gates: `pnpm lint && typecheck && test && max-lines && build` and `cargo check`.
- [x] T041 [P] Update `README.md`/`AGENTS.md` to the new stack and minimal scope.

---

## Dependencies & Execution Order

- Setup (P1) → Foundational (P2) block everything.
- US1 (shell) after Foundational; US2/US3 after US1 (they render inside the shell).
- US4 (teardown) LAST — after the kept screens work, so nothing kept breaks. Deletions are large but
  mechanical; do them in one focused pass then green the gates.
- Polish after US4.

## Parallel Opportunities

- Setup: T002, T003, T004, T006 together.
- Foundational: T007, T008, T009, T010 (separate primitive files) together; T011 alongside.
- US1: T020 tests parallel to polish; US2: T022/T023/T026 parallel; US3: T029 parallel.

## Implementation Strategy

### MVP first
Setup → Foundational → US1 (minimal shell) → STOP & VALIDATE (two nav items, dark, sidebar persists).

### Incremental
US1 → US2 (the kept registry, persisted) → US3 (clean dashboard) → US4 (strip the rest + remove
Mantine) → Polish. Gates at each checkpoint; `test:mutation` whenever a kept pure rule changes.

## Notes

- Keep the app buildable at every checkpoint; do the big deletion (US4) only after kept screens pass.
- Only attendant data persists (migration `002`); appearance prefs in localStorage.
- shadcn primitives in `src/components/ui/` (copyable); tables via `data-table.tsx`.
- Deleted domains are recoverable from git history.
