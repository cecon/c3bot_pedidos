# Tasks: Attendant Database Persistence and ORM Governance

**Input**: Design documents from `/specs/004-attendant-db-orm/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md, ADR 0001

**Tests**: Unit tests and mutation testing are required for domain behavior by the
C3Bot constitution. Component tests are required where user-visible attendant or
session-transfer workflow changes.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks in the same phase when files do not overlap
- **[Story]**: User story label for traceability
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add ORM tooling, command entry points, and migration output structure.

- [X] T001 Add Drizzle ORM, Drizzle Kit, and db script entries in package.json
- [X] T002 [P] Create Drizzle configuration for SQLite schema and generated migration output in drizzle.config.ts
- [X] T003 [P] Create generated migration output directory marker in src-tauri/migrations/drizzle/.gitkeep
- [X] T004 [P] Create database governance checker scaffold in scripts/check-db-governance.mjs

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the ORM access boundary and shared persistence rules before changing user-facing stories.

**CRITICAL**: No user story work can begin until this phase is complete.

### Tests and Guardrails

- [X] T005 [P] Add AttendantPersistenceState domain tests in src/domain/attendantPersistence.test.ts
- [X] T006 [P] Add Tauri SQL proxy adapter tests in src/db/tauriSqlProxy.test.ts
- [X] T007 [P] Add ORM attendant repository mapping tests in src/services/attendantRepository.test.ts
- [X] T008 [P] Add database governance helper tests in src/domain/databaseGovernance.test.ts

### Implementation

- [X] T009 Create Drizzle SQLite table definitions for attendants and referenced workspace tables in src/db/schema.ts
- [X] T010 Implement the Drizzle-to-Tauri SQL proxy adapter in src/db/tauriSqlProxy.ts
- [X] T011 Implement Drizzle client factory using the existing Tauri SQL connection in src/db/client.ts
- [X] T012 Implement attendant persistence state helpers in src/domain/attendantPersistence.ts
- [X] T013 Implement database governance helper rules in src/domain/databaseGovernance.ts
- [X] T014 Add src/domain/attendantPersistence.ts and src/domain/databaseGovernance.ts to mutation coverage in stryker.config.json

**Checkpoint**: ORM access boundary, persistence state rules, and governance helpers are ready for user stories.

---

## Phase 3: User Story 1 - Start With Real Attendant Data (Priority: P1) MVP

**Goal**: A clean workspace opens the attendants page with no mock employees, supports creating the first real attendant, and reloads saved attendants from the database.

**Independent Test**: Open a clean workspace, confirm no mock attendants appear, create a valid attendant, restart/reload the workflow, and confirm the saved attendant remains.

### Tests for User Story 1

- [X] T015 [P] [US1] Add clean empty-state and no-mock component tests in src/components/AttendantsPanel.test.tsx
- [X] T016 [P] [US1] Add repository-backed load, create, and reload hook tests in src/hooks/useAttendantManagement.test.ts
- [X] T017 [P] [US1] Add runtime no-mock import regression tests in src/App.test.tsx

### Implementation for User Story 1

- [X] T018 [US1] Refactor attendant repository reads and writes to use Drizzle ORM in src/services/attendantRepository.ts
- [X] T019 [US1] Refactor attendant management hook to load attendants from the repository instead of initial mock input in src/hooks/useAttendantManagement.ts
- [X] T020 [US1] Extend attendant persistence-related types and async mutation contracts in src/domain/types.ts
- [X] T021 [US1] Render loading, empty, unavailable, and error states for database-backed attendants in src/components/AttendantsPanel.tsx
- [X] T022 [US1] Update add/edit form submit handling for async persistence results in src/components/AttendantForm.tsx
- [X] T023 [US1] Remove the runtime attendants seed import and wire the repository-backed hook in src/App.tsx
- [X] T024 [US1] Remove the exported runtime attendants list from src/domain/mockData.ts
- [X] T025 [US1] Add state styling for persistence error and unavailable messages in src/styles.css

**Checkpoint**: User Story 1 is functional and testable independently as the MVP.

---

## Phase 4: User Story 2 - Prevent Mock Data From Affecting Operations (Priority: P2)

**Goal**: Session transfer targets come only from saved active online attendants, and clean workspaces never show test or sample attendants.

**Independent Test**: In a clean workspace, session transfer shows no eligible target; after creating and marking one saved attendant online, only that attendant appears.

### Tests for User Story 2

- [X] T026 [P] [US2] Add transfer-control tests for no persisted attendants and online-only targets in src/components/SessionPanel.test.tsx
- [X] T027 [P] [US2] Add no-seed transfer eligibility regression tests in src/domain/attendants.test.ts
- [X] T028 [P] [US2] Add workspace routing tests that pass persisted attendant props without fixture fallback in src/components/WorkspaceRoutes.test.tsx

### Implementation for User Story 2

- [X] T029 [US2] Ensure session transfer UI renders blocked state without mock targets in src/components/SessionPanel.tsx
- [X] T030 [US2] Remove mock-attendant fallback assignment when adding sessions in src/App.tsx
- [X] T031 [US2] Reject stale or non-persisted transfer target ids in src/hooks/useAttendantManagement.ts
- [X] T032 [US2] Clear sample session attendant assignments that reference removed mock attendants in src/domain/mockData.ts
- [X] T033 [US2] Thread persisted-only transfer targets through workspace routing in src/components/WorkspaceRoutes.tsx

**Checkpoint**: User Stories 1 and 2 both work with only persisted attendants.

---

## Phase 5: User Story 3 - Record Database Governance Rules (Priority: P3)

**Goal**: Maintainers can verify the ADR policy, ORM access boundary, and command-generated migration workflow during review.

**Independent Test**: A reviewer can locate the ADR, run the governance check, and confirm migration commands and direct SQL exceptions are enforced.

### Tests for User Story 3

- [X] T034 [P] [US3] Add package script and ADR command assertions in src/domain/databaseGovernance.test.ts
- [X] T035 [P] [US3] Add governance checker fixture cases for allowed and disallowed SQL paths in scripts/check-db-governance.test.mjs

### Implementation for User Story 3

- [X] T036 [US3] Implement direct SQL and migration command trace checks in scripts/check-db-governance.mjs
- [X] T037 [US3] Add db:generate and db:check scripts using Drizzle Kit and the governance checker in package.json
- [X] T038 [US3] Update ADR 0001 with the selected Drizzle commands and exception review rules in docs/adr/0001-database-access-and-migrations.md
- [X] T039 [US3] Document the migration command trace requirement in specs/004-attendant-db-orm/quickstart.md

**Checkpoint**: Database governance is documented, scriptable, and reviewable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Finish validation, cleanup, and quickstart verification across all stories.

- [X] T040 [P] Run lint and max-lines validation and record any required fixes against package.json
- [X] T041 [P] Run TypeScript typecheck and fix typed ORM or async contract issues in src/db/client.ts
- [X] T042 [P] Run Vitest suite and fix persistence workflow regressions in src/hooks/useAttendantManagement.ts
- [X] T043 Run Stryker mutation tests and fix surviving mutations in src/domain/attendantPersistence.ts
- [X] T044 Run production build and fix bundling issues in drizzle.config.ts
- [X] T045 Run Cargo check and fix migration registration issues in src-tauri/src/lib.rs
- [X] T046 Execute quickstart scenarios for clean workspace, create attendant, transfer eligibility, and governance commands in specs/004-attendant-db-orm/quickstart.md
- [X] T047 Verify no runtime imports of mock attendants remain and no generated reports are staged in src/domain/mockData.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on Foundational and is the MVP.
- **User Story 2 (Phase 4)**: Depends on Foundational and integrates with persisted attendants from US1.
- **User Story 3 (Phase 5)**: Depends on Foundational and can proceed in parallel after the ORM boundary exists.
- **Polish (Phase 6)**: Depends on all selected user stories.

### User Story Dependencies

- **US1 Start With Real Attendant Data**: First implementation target after Foundational.
- **US2 Prevent Mock Data From Affecting Operations**: Can start after Foundational but should be validated after US1 to use persisted attendants.
- **US3 Record Database Governance Rules**: Can start after Foundational and can be implemented alongside US1/US2 if files do not overlap.

### Within Each User Story

- Tests must be written before implementation tasks.
- ORM schema and client must exist before repository refactor.
- Repository persistence must work before UI reports save success.
- Transfer controls must consume persisted eligibility before removing mock fallback assignments.
- Governance checker must be implemented before db:check is considered valid.

---

## Parallel Opportunities

- T002, T003, and T004 can run in parallel after T001 is understood.
- T005, T006, T007, and T008 can run in parallel because they target different test files.
- T009, T010, T011, T012, and T013 can be split across files after the test expectations are clear.
- US1 tests T015, T016, and T017 can run in parallel.
- US2 tests T026, T027, and T028 can run in parallel.
- US3 tests T034 and T035 can run in parallel.
- Polish validations T040, T041, and T042 can run in parallel if dependencies are installed and generated files are stable.

---

## Parallel Example: User Story 1

```text
Task: "T015 [P] [US1] Add clean empty-state and no-mock component tests in src/components/AttendantsPanel.test.tsx"
Task: "T016 [P] [US1] Add repository-backed load, create, and reload hook tests in src/hooks/useAttendantManagement.test.ts"
Task: "T017 [P] [US1] Add runtime no-mock import regression tests in src/App.test.tsx"
```

## Parallel Example: User Story 2

```text
Task: "T026 [P] [US2] Add transfer-control tests for no persisted attendants and online-only targets in src/components/SessionPanel.test.tsx"
Task: "T027 [P] [US2] Add no-seed transfer eligibility regression tests in src/domain/attendants.test.ts"
Task: "T028 [P] [US2] Add workspace routing tests that pass persisted attendant props without fixture fallback in src/components/WorkspaceRoutes.test.tsx"
```

## Parallel Example: User Story 3

```text
Task: "T034 [P] [US3] Add package script and ADR command assertions in src/domain/databaseGovernance.test.ts"
Task: "T035 [P] [US3] Add governance checker fixture cases for allowed and disallowed SQL paths in scripts/check-db-governance.test.mjs"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational ORM and persistence state boundary.
3. Complete Phase 3: User Story 1.
4. Stop and validate clean empty state, create attendant, and reload persistence.

### Incremental Delivery

1. Setup plus Foundational establishes Drizzle, proxy, repository tests, and persistence rules.
2. US1 removes runtime attendant mocks and makes database-backed attendants usable.
3. US2 ensures transfers cannot use sample or stale attendants.
4. US3 makes the ADR policy enforceable through scripts and review checks.
5. Polish runs the full quality gate and quickstart scenarios.

### Notes

- [P] tasks are safe to run in parallel only when their listed files do not overlap.
- Tests should fail before implementation changes satisfy them.
- Keep generated migration SQL reviewable and do not register duplicate baseline migrations.
- Do not introduce a second browser storage fallback for attendants.
- Commit after each completed phase or logical group during implementation.
