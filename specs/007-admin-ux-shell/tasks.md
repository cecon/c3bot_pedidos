---
description: "Task list for Premium Admin UX Shell (007-admin-ux-shell)"
---

# Tasks: Premium Admin UX Shell

**Input**: Design documents from `/specs/007-admin-ux-shell/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ux-shell-contract.md

**Tests**: Included — the constitution (Principle IV) requires unit tests for domain behavior and
StrykerJS ≥85% on shared pure rules; presentational components get Testing Library tests.

**Organization**: Grouped by user story (P1→P4). Each story is an independently testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- All paths are repo-relative; frontend-only feature (no Rust/API/SQLite changes)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Token source, settings model, fonts, and CSS scaffolds reused by all stories.

- [ ] T001 [P] Create `src/theme/themeTokens.ts` — single token source (colors/typography/radius/shadows/spacing/breakpoints), importing existing values from `src/theme.ts` and `src/themePalettes.ts` and re-exporting them as one object.
- [ ] T002 [P] Add self-hosted fonts: place curated `woff2` (Inter/Poppins/Roboto/Open Sans/Montserrat, weights 400/500/700) under `src/styles/fonts/`, declare `@font-face` in `src/styles/fonts/fonts.css`, and import it in `src/main.tsx`.
- [ ] T003 [P] Create `src/styles/shell.css` scaffold (header `fixed`/`static`, container `full`/`boxed`, `--app-shadow-*`) and import it in `src/main.tsx`.
- [ ] T004 Define `AppearanceSettings`, `DEFAULT_APPEARANCE`, `loadAppearance(raw)`, `serializeAppearance()` in `src/theme/appearance.ts` (migration-safe deep-merge over defaults; legacy `primary/radius/font` mapping), seeded from `themeTokens.ts`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Pure resolvers + theme/provider wiring that every story reads from.

**⚠️ CRITICAL**: No user story work begins until this phase is complete.

- [ ] T005 [P] Implement `resolveDensity(density)` in `src/theme/resolvers/density.ts`.
- [ ] T006 [P] Implement `resolveRadius(preset)` in `src/theme/resolvers/radius.ts`.
- [ ] T007 [P] Implement `resolveShadow(level)` in `src/theme/resolvers/shadow.ts`.
- [ ] T008 [P] Unit tests (totality + values) for the three resolvers in `src/theme/resolvers/density.test.ts`, `radius.test.ts`, `shadow.test.ts`.
- [ ] T009 [P] Unit tests for `loadAppearance` (defaults, malformed JSON, missing keys, legacy migration) in `src/theme/appearance.test.ts`.
- [ ] T010 Extend `buildTheme` in `src/theme.ts` to consume `themeTokens` + `secondaryColor`/`semantic` overrides + density/radius inputs (keep existing dark surfaces and component overrides).
- [ ] T011 Extend `src/components/ThemeSettingsProvider.tsx` to hold the full `AppearanceSettings`, expose `update(key, value)`, and apply CSS variables + `data-*` attributes + Mantine color scheme on mount and on every change (persist via `serializeAppearance`).
- [ ] T012 Component test `src/components/ThemeSettingsProvider.test.tsx` — applying a setting updates CSS vars/attrs and persists; reload restores from storage.

**Checkpoint**: Settings flow + resolvers ready; stories can begin.

---

## Phase 3: User Story 1 — Collapsible sidebar (Priority: P1) 🎯 MVP

**Goal**: Toggle the sidebar between full and icon-only rail; tooltips + catalog flyout when
collapsed; state persisted and restored.

**Independent Test**: Collapse → only icons + tooltips + working catalog flyout → reload → still
collapsed.

- [ ] T013 [US1] Add `--app-sidebar-width` and `[data-collapsed]` rail rules (icon-only, hidden labels, reduced brand) in `src/styles/sidebar-nav.css`.
- [ ] T014 [US1] Extend `src/components/SidebarNav.tsx` with a `collapsed` prop: icon-only items, label tooltips, reduced brand mark; preserve active-state marking.
- [ ] T015 [US1] Render the catalog submenu as a flyout (Mantine `Menu`/`HoverCard`) when collapsed in `src/components/SidebarNav.tsx`; inline when expanded.
- [ ] T016 [US1] Add a sidebar toggle control to `src/components/AppHeader.tsx` wired to `update("sidebarCollapsed", …)`.
- [ ] T017 [US1] Wire `src/components/AdminShell.tsx` to set `data-collapsed` + the width var from settings.
- [ ] T018 [P] [US1] Component tests in `src/components/SidebarNav.test.tsx`: collapsed rail shows tooltips, catalog flyout reachable, active item marked in both states.

**Checkpoint**: US1 fully functional and testable on its own (MVP).

---

## Phase 4: User Story 2 — Expanded appearance customization (Priority: P2)

**Goal**: Sectioned appearance drawer for colors, typography, density, radius, shadow, color mode,
header position, container width — live + persisted.

**Independent Test**: Change density/colors/radius/shadow/font live → reload → all persisted.

- [ ] T019 [US2] Restructure `src/components/ThemeSettingsDrawer.tsx` into scannable sections; extract section bodies into small subcomponents under `src/components/themeDrawer/` to respect the 300-line limit.
- [ ] T020 [P] [US2] Color controls (primary/secondary/semantic) in `src/components/themeDrawer/ColorsSection.tsx` using `PRIMARY_OPTIONS`.
- [ ] T021 [P] [US2] Typography controls (font family + density) in `src/components/themeDrawer/TypographySection.tsx`.
- [ ] T022 [P] [US2] Layout controls (color mode, header position, container width) in `src/components/themeDrawer/LayoutSection.tsx`.
- [ ] T023 [P] [US2] Borders + shadows controls (radius preset, shadow level) in `src/components/themeDrawer/BordersShadowsSection.tsx`.
- [ ] T024 [US2] Apply `headerPosition`/`containerWidth` via `data-app-header`/`data-app-container` rules in `src/styles/shell.css` and set them in `src/components/AdminShell.tsx`.
- [ ] T025 [P] [US2] Component tests for each drawer section updating settings live (`src/components/themeDrawer/*.test.tsx`).

**Checkpoint**: US1 + US2 both work independently.

---

## Phase 5: User Story 3 — Complete top navigation header (Priority: P3)

**Goal**: Menu toggle, logo, breadcrumb, global search, notifications, and user menu alongside the
existing status indicators.

**Independent Test**: Breadcrumb reflects location; global search jumps to a section; notifications +
user menus open with empty states.

- [ ] T026 [P] [US3] Add `buildBreadcrumb(destination, subPageId)` and `searchDestinations(query, …)` to `src/domain/navigation.ts`.
- [ ] T027 [P] [US3] Unit tests for breadcrumb + search (empty query, no-match, diacritics, sub-pages) in `src/domain/navigation.test.ts`.
- [ ] T028 [P] [US3] `src/components/Breadcrumbs.tsx` (presentational, `onNavigate`).
- [ ] T029 [US3] `src/components/GlobalSearch.tsx` — Mantine `Modal` + `TextInput` + filtered list over `searchDestinations`, hotkey via `useHotkeys`, empty state.
- [ ] T030 [P] [US3] `src/components/NotificationMenu.tsx` — mock items via props, unread count, empty state.
- [ ] T031 [P] [US3] `src/components/UserMenu.tsx` — mock account actions (no auth).
- [ ] T032 [US3] Compose toggle + logo + `Breadcrumbs` + `GlobalSearch` + `NotificationMenu` + `UserMenu` into `src/components/AppHeader.tsx`, keeping existing status badges/SQLite/Theme controls.
- [ ] T033 [P] [US3] Component tests for breadcrumb, search navigation, notifications, and user menu (`src/components/*.test.tsx`).

**Checkpoint**: US1–US3 independently functional.

---

## Phase 6: User Story 4 — Design tokens + reusable building blocks (Priority: P4)

**Goal**: Reusable `PageContainer`/`StatWidget`/`DashboardCard`/`DataTable` driven by the shared
tokens; existing pages adopt them with no behavior change. (Token source already created in T001.)

**Independent Test**: Migrate one page to the blocks → same data/behavior, consistent styling.

- [ ] T034 [P] [US4] `src/components/PageContainer.tsx` (title + optional breadcrumb + actions + responsive body).
- [ ] T035 [P] [US4] `src/components/StatWidget.tsx` (evolution of `Metric.tsx`; keep `Metric` until pages migrate).
- [ ] T036 [P] [US4] `src/components/DashboardCard.tsx`.
- [ ] T037 [P] [US4] `src/components/DataTable.tsx` (generic Mantine `Table` wrapper following the `AttendantsTable.tsx` pattern; empty state).
- [ ] T038 [P] [US4] Component tests for the four blocks (`src/components/*.test.tsx`).
- [ ] T039 [US4] Migrate `src/components/DashboardPanel.tsx` to `PageContainer`/`StatWidget`/`DashboardCard` without changing data or behavior; update `DashboardPanel.test.tsx` selectors if needed.
- [ ] T040 [US4] Migrate one table page (`src/components/OrdersPanel.tsx` or `AttendantsPanel.tsx`) to `DataTable`/`PageContainer` without behavior change; update its tests.

**Checkpoint**: All four stories independently functional; pages consistent.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T041 [P] Run `pnpm test:mutation` on `src/theme/resolvers/*` and the new `navigation` rules; raise coverage to ≥85% break.
- [ ] T042 Run `pnpm max-lines`; split any file over 300 useful lines (drawer/header/sidebar are the risks).
- [ ] T043 [P] Run `/ui-review` (mantine-ux + preview) on sidebar (collapsed), header, and drawer; fix contrast/density/fatigue findings; verify no header/nav/content overlap at desktop+tablet widths.
- [ ] T044 Run `quickstart.md` validation in the preview (US1–US4) and the full gate set: `pnpm lint && pnpm typecheck && pnpm test && pnpm max-lines && pnpm build`.
- [ ] T045 [P] Update `README.md`/`AGENTS.md` notes if the appearance settings or shell behavior need documenting.

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: start immediately; T001–T003 parallel, T004 after T001.
- **Foundational (Phase 2)**: after Setup; blocks all stories. T005–T009 parallel; T010 after T001;
  T011 after T004/T005–T007/T010; T012 after T011.
- **User stories (Phases 3–6)**: after Foundational. Can proceed in priority order or in parallel by
  different developers; each is independently testable.
  - US3's nav rules (T026/T027) are independent and can even start during Foundational.
  - US4's blocks (T034–T038) are independent; migrations (T039/T040) come after the blocks exist.
- **Polish (Phase 7)**: after the desired stories are complete.

## Parallel Opportunities

- Setup: T001, T002, T003 together.
- Foundational: T005, T006, T007, T008, T009 together.
- US1: T018 parallel to doc/test polish; T013 (CSS) parallel to T014 logic.
- US2: T020–T023 (separate section files) together; T025 tests parallel.
- US3: T026/T027 (nav rules+tests), T028, T030, T031 together; T029/T032 compose after.
- US4: T034–T038 together; then T039/T040.

## Implementation Strategy

### MVP First (User Story 1)
1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **STOP & VALIDATE** (collapse/persist)
→ demo. This is the smallest shippable premium-UX win.

### Incremental Delivery
Setup+Foundational → US1 (MVP) → US2 → US3 → US4, validating and committing after each story. Each
adds value without breaking the previous. Run gates (`lint/typecheck/test/max-lines/build`, plus
`test:mutation` when a pure rule changed) at every checkpoint.

## Notes

- Frontend-only; no Rust/API/SQLite changes.
- Reuse, don't recreate: `theme.ts`, `themePalettes.ts`, `ThemeSettingsProvider`, `AdminShell`,
  `SidebarNav`, `AppHeader`, `Metric`, `AttendantsTable`, `domain/navigation.ts`, `icons.ts`.
- No new runtime dependencies (self-hosted fonts; custom global search modal).
- Commit after each task or logical group; keep dark as the default at all times.
