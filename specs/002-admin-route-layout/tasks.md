# Tasks: Admin Route Layout

**Input**: Design documents from `/specs/002-admin-route-layout/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests and mutation testing are REQUIRED for route resolution and
navigation metadata because this feature adds shared workflow behavior. Component
tests are included for the admin shell because the feature changes user-facing
navigation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the existing React workspace for route-driven admin navigation.

- [X] T001 Create admin shell component file in src/components/AdminShell.tsx
- [X] T002 [P] Create header component file in src/components/AppHeader.tsx
- [X] T003 [P] Create sidebar navigation component file in src/components/SidebarNav.tsx
- [X] T004 [P] Create dashboard component file in src/components/DashboardPanel.tsx
- [X] T005 [P] Create customers component file in src/components/CustomersPanel.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish tested route metadata and mutation coverage before user-story implementation.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T006 [P] Add route metadata and fallback tests in src/domain/navigation.test.ts
- [X] T007 [P] Add navigation grouping and direct-destination tests in src/domain/navigation.test.ts
- [X] T008 Implement navigation destination types, groups, and route resolution in src/domain/navigation.ts
- [X] T009 Update mutation coverage to include src/domain/navigation.ts in stryker.config.json
- [X] T010 Export or import navigation helper types where needed from src/domain/navigation.ts

**Checkpoint**: Route catalog, grouping, and fallback behavior are tested and ready for UI integration.

---

## Phase 3: User Story 1 - Navigate an Admin Workspace (Priority: P1) MVP

**Goal**: Operators can use a persistent admin menu and header to move between primary functions instead of one crowded screen.

**Independent Test**: Open the workspace, see the persistent header/sidebar, select each primary menu item, and confirm only the selected section is shown as the primary content.

### Tests for User Story 1

- [X] T011 [P] [US1] Add AdminShell active-section rendering tests in src/components/AdminShell.test.tsx
- [X] T012 [P] [US1] Add SidebarNav active-item and keyboard navigation tests in src/components/SidebarNav.test.tsx

### Implementation for User Story 1

- [X] T013 [US1] Implement persistent shell layout props and main-content slot in src/components/AdminShell.tsx
- [X] T014 [US1] Implement global title, status badges, and SQLite action in src/components/AppHeader.tsx
- [X] T015 [US1] Implement grouped primary navigation with active state in src/components/SidebarNav.tsx
- [X] T016 [US1] Replace the all-in-one workspace grid with AdminShell routing composition in src/App.tsx
- [X] T017 [US1] Add admin shell, header, sidebar, active item, and focused content styles in src/styles.css
- [X] T018 [US1] Verify dashboard, sessions, catalog, orders, customers, automation groups, campaigns, and settings routes render from src/App.tsx

**Checkpoint**: MVP navigation shell is usable and every primary destination is reachable.

---

## Phase 4: User Story 2 - Work in Focused Function Pages (Priority: P2)

**Goal**: Each function page shows page-specific content and actions without unrelated modules competing for attention.

**Independent Test**: Open sessions, catalog, orders, automation groups, and campaigns and verify each page contains only relevant controls and summaries by default.

### Tests for User Story 2

- [X] T019 [P] [US2] Add focused workspace-section tests in src/components/AdminShell.test.tsx
- [X] T020 [P] [US2] Add customer summary rendering tests in src/components/CustomersPanel.test.tsx

### Implementation for User Story 2

- [X] T021 [US2] Compose sessions route from SessionPanel and ChatPanel in src/App.tsx
- [X] T022 [US2] Compose catalog route from CatalogPanel in src/App.tsx
- [X] T023 [US2] Compose orders route from OrdersPanel in src/App.tsx
- [X] T024 [US2] Compose automation groups route from AutomationGroupsPanel in src/App.tsx
- [X] T025 [US2] Compose campaigns route from CampaignsPanel in src/App.tsx
- [X] T026 [US2] Implement focused customer list and address state summary in src/components/CustomersPanel.tsx
- [X] T027 [US2] Implement operational dashboard metrics and shortcuts in src/components/DashboardPanel.tsx
- [X] T028 [US2] Remove OpsPanel tab dependency from the default primary workspace flow in src/App.tsx

**Checkpoint**: Primary functions are separated into focused pages and no page shows all other modules by default.

---

## Phase 5: User Story 3 - Keep Navigation Context Stable (Priority: P3)

**Goal**: Route changes preserve useful in-session state, handle unknown destinations safely, and protect in-progress work.

**Independent Test**: Select a session or enter draft values, navigate away and back, and confirm relevant state is retained; open an unknown route and confirm safe fallback.

### Tests for User Story 3

- [X] T029 [P] [US3] Add unknown-route fallback and message tests in src/domain/navigation.test.ts
- [X] T030 [P] [US3] Add context-preservation component tests in src/components/AdminShell.test.tsx

### Implementation for User Story 3

- [X] T031 [US3] Add hash route synchronization and fallback notification handling in src/App.tsx
- [X] T032 [US3] Preserve selected session, session search, product draft, and campaign draft state above routed sections in src/App.tsx
- [X] T033 [US3] Add dirty-section guard helper for future unsaved-edit warnings in src/domain/navigation.ts
- [X] T034 [US3] Wire safe fallback messaging for unknown destinations in src/components/AdminShell.tsx
- [X] T035 [US3] Ensure missing selected entities choose a valid default without blank content in src/App.tsx

**Checkpoint**: Navigation is predictable, recoverable, and does not lose useful context during normal route switches.

---

## Phase 6: User Story 4 - Scale the Admin Menu (Priority: P4)

**Goal**: The menu is grouped, compact, keyboard-accessible, and ready for additional admin modules.

**Independent Test**: Review menu organization at normal and narrower desktop sizes and confirm operations and administration items stay clear and accessible.

### Tests for User Story 4

- [X] T036 [P] [US4] Add navigation group visibility tests in src/domain/navigation.test.ts
- [X] T037 [P] [US4] Add responsive sidebar rendering tests in src/components/SidebarNav.test.tsx

### Implementation for User Story 4

- [X] T038 [US4] Finalize operations and administration grouping metadata in src/domain/navigation.ts
- [X] T039 [US4] Add settings destination placeholder content in src/App.tsx
- [X] T040 [US4] Refine sidebar responsive behavior and compact labels in src/styles.css
- [X] T041 [US4] Separate global header actions from page-specific actions in src/components/AppHeader.tsx
- [X] T042 [US4] Validate no empty navigation groups render in src/components/SidebarNav.tsx

**Checkpoint**: Navigation organization remains clear as the workspace adds more functions.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full workflow, visual quality, and documentation after all user stories are complete.

- [X] T043 [P] Update quickstart navigation notes if implementation changes validation steps in specs/002-admin-route-layout/quickstart.md
- [X] T044 Run pnpm typecheck and fix type errors in src/App.tsx and src/components/
- [X] T045 Run pnpm test and fix failing tests in src/domain/navigation.test.ts and src/components/
- [X] T046 Run pnpm test:mutation and keep the break threshold at 85% for src/domain/navigation.ts and src/domain/analytics.ts
- [X] T047 Run pnpm build and fix production build issues in src/
- [X] T048 Run cargo check --manifest-path src-tauri/Cargo.toml and fix desktop shell issues if any
- [X] T049 Run manual quickstart validation from specs/002-admin-route-layout/quickstart.md
- [X] T050 Capture desktop and narrower-window screenshots for overlap checks in reports/

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundational and is the MVP.
- **US2 (Phase 4)**: Depends on US1 shell composition.
- **US3 (Phase 5)**: Depends on US1 route shell and can proceed after US2 route composition is stable.
- **US4 (Phase 6)**: Depends on US1 navigation and can run after US2 destinations exist.
- **Polish (Phase 7)**: Depends on desired user stories being complete.

### User Story Dependencies

- **US1**: No dependency on other stories after Foundational.
- **US2**: Requires US1 shell and active-route rendering.
- **US3**: Requires US1 route state and benefits from US2 destination composition.
- **US4**: Requires US1 route metadata and US2 destination list.

### Within Each User Story

- Tests must be written and fail before implementation tasks in that story.
- Domain route helper changes happen before components consume them.
- Shell components are implemented before App.tsx replaces the old grid.
- Focused pages are composed before responsive polish.

## Parallel Opportunities

- T002 through T005 can run in parallel after T001.
- T006 and T007 can run in parallel before T008.
- T011 and T012 can run in parallel for US1.
- T019 and T020 can run in parallel for US2.
- T021 through T027 touch separate page responsibilities and can be split once App.tsx integration order is coordinated.
- T029 and T030 can run in parallel for US3.
- T036 and T037 can run in parallel for US4.
- T043 can run in parallel with validation commands after implementation stabilizes.

## Parallel Example: User Story 1

```bash
# Component and navigation tests can be prepared together:
Task: "T011 [P] [US1] Add AdminShell active-section rendering tests in src/components/AdminShell.test.tsx"
Task: "T012 [P] [US1] Add SidebarNav active-item and keyboard navigation tests in src/components/SidebarNav.test.tsx"
```

## Parallel Example: User Story 2

```bash
# Focused page work can be split after the shell exists:
Task: "T022 [US2] Compose catalog route from CatalogPanel in src/App.tsx"
Task: "T026 [US2] Implement focused customer list and address state summary in src/components/CustomersPanel.tsx"
Task: "T027 [US2] Implement operational dashboard metrics and shortcuts in src/components/DashboardPanel.tsx"
```

## Parallel Example: User Story 4

```bash
# Menu rules and responsive rendering tests are independent:
Task: "T036 [P] [US4] Add navigation group visibility tests in src/domain/navigation.test.ts"
Task: "T037 [P] [US4] Add responsive sidebar rendering tests in src/components/SidebarNav.test.tsx"
```

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Setup and Foundational route helper tasks.
2. Implement US1 to provide the admin shell, header, sidebar, active state, and route switching.
3. Validate that every primary destination can be reached and only one primary section renders at a time.

### Incremental Delivery

1. Add US1 for the navigable shell.
2. Add US2 to split existing functions into focused pages.
3. Add US3 to harden context preservation and unknown-route behavior.
4. Add US4 to refine menu grouping, responsiveness, and admin scalability.

### Validation Gates

1. Run `pnpm typecheck`.
2. Run `pnpm test`.
3. Run `pnpm test:mutation`.
4. Run `pnpm build`.
5. Run `cargo check --manifest-path src-tauri/Cargo.toml`.

## Notes

- Keep changes inside the existing Tauri/Vite app; do not add a routing package unless a later plan amendment records the reason.
- Keep the first screen operational and dark-themed.
- Keep route behavior in `src/domain/navigation.ts` so it remains testable and mutation-covered.
- Avoid reintroducing a default all-modules workspace grid after the admin shell exists.
