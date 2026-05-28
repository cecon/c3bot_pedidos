# Tasks: Delivery Attendants

**Input**: Design documents from `/specs/003-delivery-attendants/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests and mutation testing are REQUIRED for attendant validation,
availability transitions, deletion guards, and transfer eligibility because these are
shared workflow rules. Component tests are included because the feature adds a new
admin page and visible list/form/status actions.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add the files and scaffolding needed for the attendants feature without changing behavior yet.

- [X] T001 Create attendants panel component scaffold in src/components/AttendantsPanel.tsx
- [X] T002 [P] Create attendants panel test scaffold in src/components/AttendantsPanel.test.tsx
- [X] T003 [P] Create attendant domain helper scaffold in src/domain/attendants.ts
- [X] T004 [P] Create attendant domain test scaffold in src/domain/attendants.test.ts
- [X] T005 [P] Create attendant repository scaffold in src/services/attendantRepository.ts
- [X] T006 [P] Create delivery attendants migration scaffold in src-tauri/migrations/002_delivery_attendants.sql

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the data model, schema, and shared domain rules that all user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T007 [P] Extend attendant-related TypeScript types with displayName, whatsappNumber, availabilityStatus, photoBase64, active, createdAt, and updatedAt in src/domain/types.ts
- [X] T008 [P] Add validation, normalization, initial offline status, photo guardrail, deletion guard, and transfer eligibility tests in src/domain/attendants.test.ts
- [X] T009 Implement attendant validation, WhatsApp normalization, initial record creation, availability status transitions, deletion checks, and eligible transfer target helpers in src/domain/attendants.ts
- [X] T010 Update sample attendants to include displayName, whatsappNumber, availabilityStatus, photoBase64, active, createdAt, and updatedAt in src/domain/mockData.ts
- [X] T011 Add SQLite migration columns, constraints, and active WhatsApp uniqueness support for attendants in src-tauri/migrations/002_delivery_attendants.sql
- [X] T012 Register migration version 2 for sqlite:c3bot.db in src-tauri/src/lib.rs
- [X] T013 Implement list, create, update, status update, and soft-delete SQL mapping in src/services/attendantRepository.ts
- [X] T014 Add src/domain/attendants.ts to mutation coverage in stryker.config.json

**Checkpoint**: Attendant entities, persistence shape, and shared business rules are ready for UI stories.

---

## Phase 3: User Story 1 - View Delivery Attendants (Priority: P1) MVP

**Goal**: Administrators can open a dedicated Atendentes menu item and see the attendants list first with add and row action affordances.

**Independent Test**: Open the admin workspace, select Atendentes, confirm the first view is the attendants list, and verify populated and empty states show the required identity, status, photo/placeholder, add action, and row controls.

### Tests for User Story 1

- [X] T015 [P] [US1] Add navigation destination tests for #/delivery-attendants in src/domain/navigation.test.ts
- [X] T016 [P] [US1] Add attendants list, empty state, status text, photo placeholder, add action, and row action rendering tests in src/components/AttendantsPanel.test.tsx

### Implementation for User Story 1

- [X] T017 [US1] Add delivery-attendants destination metadata, route, label, group placement, and icon mapping type in src/domain/navigation.ts
- [X] T018 [US1] Map the delivery attendants navigation icon in src/components/SidebarNav.tsx
- [X] T019 [US1] Implement the attendants list, empty state, add action, photo/placeholder cell, status badge, and accessible row action icons in src/components/AttendantsPanel.tsx
- [X] T020 [US1] Render AttendantsPanel for the delivery-attendants destination in src/components/WorkspaceRoutes.tsx
- [X] T021 [US1] Thread attendant rows and no-op list action handlers through the routed workspace in src/App.tsx
- [X] T022 [US1] Add responsive attendants table, avatar, status, and row action styles in src/styles.css

**Checkpoint**: MVP list page is reachable from navigation and testable independently.

---

## Phase 4: User Story 2 - Create and Edit Attendants (Priority: P2)

**Goal**: Administrators can create and edit attendants with required name, display name, WhatsApp phone, and optional Base64 photo.

**Independent Test**: Add a valid attendant with a photo, confirm it appears offline in the list, edit it, and verify invalid or duplicate WhatsApp values are blocked with field-level feedback.

### Tests for User Story 2

- [X] T023 [P] [US2] Add create/edit validation and duplicate WhatsApp tests in src/domain/attendants.test.ts
- [X] T024 [P] [US2] Add add form, edit form, required field, duplicate phone, and image validation component tests in src/components/AttendantsPanel.test.tsx

### Implementation for User Story 2

- [X] T025 [US2] Implement add/edit form state, required field messages, save/cancel behavior, and edit mode in src/components/AttendantsPanel.tsx
- [X] T026 [US2] Implement image file validation and Base64 conversion helpers for attendant photos in src/domain/attendants.ts
- [X] T027 [US2] Wire create and update handlers, duplicate phone feedback, and offline default status in src/App.tsx
- [X] T028 [US2] Persist create and update operations through src/services/attendantRepository.ts
- [X] T029 [US2] Ensure saved displayName and photo updates are reflected in the list and routed workspace props in src/components/WorkspaceRoutes.tsx

**Checkpoint**: Attendants can be created and edited with validated data and persisted photo payloads.

---

## Phase 5: User Story 3 - Control Transfer Availability (Priority: P3)

**Goal**: Administrators can toggle attendants online/offline, delete eligible attendants, and session transfer choices exclude offline attendants.

**Independent Test**: Toggle an attendant offline, attempt a session transfer, confirm the attendant is not selectable, then toggle online and confirm the attendant becomes eligible; deletion is blocked when active assigned sessions exist.

### Tests for User Story 3

- [X] T030 [P] [US3] Add online/offline transition, no eligible target, inactive attendant, and deletion guard tests in src/domain/attendants.test.ts
- [X] T031 [P] [US3] Add status toggle, delete confirmation, blocked delete, and accessible action tests in src/components/AttendantsPanel.test.tsx

### Implementation for User Story 3

- [X] T032 [US3] Implement online/offline toggle and deletion guard UI flows in src/components/AttendantsPanel.tsx
- [X] T033 [US3] Wire status toggle, soft delete, blocked delete notification, and active session checks in src/App.tsx
- [X] T034 [US3] Persist status updates and soft deletes in src/services/attendantRepository.ts
- [X] T035 [US3] Add eligible transfer target filtering and no-online-attendant message support in src/components/SessionPanel.tsx
- [X] T036 [US3] Pass eligible transfer targets and transfer handlers through src/components/WorkspaceRoutes.tsx
- [X] T037 [US3] Update selected session assignedAttendantId on successful transfer and preserve assignment history in src/App.tsx

**Checkpoint**: Availability controls work from the list, and offline or inactive attendants cannot receive transferred sessions.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the full workflow, privacy boundary, and desktop/browser behavior after the user stories are complete.

- [X] T038 [P] Update implementation notes if manual validation steps change in specs/003-delivery-attendants/quickstart.md
- [X] T039 [P] Review phone/photo privacy handling and remove accidental diagnostic exposure in src/domain/attendants.ts
- [X] T040 Run pnpm typecheck and fix TypeScript issues in src/
- [X] T041 Run pnpm test and fix failing tests in src/domain/attendants.test.ts and src/components/AttendantsPanel.test.tsx
- [X] T042 Run pnpm test:mutation and keep the 85% break threshold for src/domain/attendants.ts in stryker.config.json
- [X] T043 Run pnpm build and fix production build issues in src/
- [X] T044 Run cargo check --manifest-path src-tauri/Cargo.toml and fix migration registration issues in src-tauri/src/lib.rs
- [X] T045 Run the manual attendants smoke test from specs/003-delivery-attendants/quickstart.md against http://localhost:3920

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **US1 (Phase 3)**: Depends on Foundational and is the MVP.
- **US2 (Phase 4)**: Depends on US1 list page and Foundational validation/persistence.
- **US3 (Phase 5)**: Depends on US1 row actions and Foundational transfer eligibility helpers; can begin after US2 create/edit data flow is stable.
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **US1**: Can start after Foundational; no dependency on US2 or US3.
- **US2**: Requires US1 page shell and list props so new/edit records can appear immediately.
- **US3**: Requires the attendant list and shared eligibility helpers; integrates with session assignment.

### Within Each User Story

- Tests must be written and fail before implementation tasks in that story.
- Domain helpers and types must exist before components consume them.
- Repository mappings must follow the migration shape.
- App state wiring must happen before route components can exercise the workflow.
- Story checkpoint validation should pass before moving to the next priority.

## Parallel Opportunities

- T002 through T006 can run in parallel after T001 is started.
- T007 and T008 can run in parallel before T009.
- T011 and T012 can be prepared while TypeScript domain work proceeds, then verified together.
- T015 and T016 can run in parallel for US1.
- T023 and T024 can run in parallel for US2.
- T030 and T031 can run in parallel for US3.
- T038 and T039 can run in parallel during polish.

## Parallel Example: User Story 1

```bash
Task: "T015 [P] [US1] Add navigation destination tests for #/delivery-attendants in src/domain/navigation.test.ts"
Task: "T016 [P] [US1] Add attendants list, empty state, status text, photo placeholder, add action, and row action rendering tests in src/components/AttendantsPanel.test.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "T023 [P] [US2] Add create/edit validation and duplicate WhatsApp tests in src/domain/attendants.test.ts"
Task: "T024 [P] [US2] Add add form, edit form, required field, duplicate phone, and image validation component tests in src/components/AttendantsPanel.test.tsx"
```

## Parallel Example: User Story 3

```bash
Task: "T030 [P] [US3] Add online/offline transition, no eligible target, inactive attendant, and deletion guard tests in src/domain/attendants.test.ts"
Task: "T031 [P] [US3] Add status toggle, delete confirmation, blocked delete, and accessible action tests in src/components/AttendantsPanel.test.tsx"
```

## Implementation Strategy

### MVP First (US1 Only)

1. Complete Phase 1 setup.
2. Complete Phase 2 foundational domain, migration, repository, and mutation coverage tasks.
3. Complete Phase 3 to expose the Atendentes destination and list page.
4. Stop and validate US1 independently from the admin menu before adding create/edit.

### Incremental Delivery

1. Deliver US1 so administrators can see attendants in a dedicated destination.
2. Deliver US2 so administrators can create and edit attendants with validated Base64 photos.
3. Deliver US3 so online/offline state controls transfer eligibility and delete safety.
4. Run polish validation after the desired story set is complete.

### Validation Gates

1. Run `pnpm typecheck`.
2. Run `pnpm test`.
3. Run `pnpm test:mutation`.
4. Run `pnpm build`.
5. Run `cargo check --manifest-path src-tauri/Cargo.toml`.
6. Run the manual smoke test in `specs/003-delivery-attendants/quickstart.md`.

## Notes

- Keep the feature inside the existing Tauri/Vite app; do not add a router or UI framework.
- Keep availability separate from active/deleted state.
- Keep phone numbers and Base64 photo payloads out of logs and diagnostics.
- Preserve historical session accountability when attendants are deleted from active management.
- Each task is intentionally scoped to a concrete file so implementation can proceed without rediscovering the plan.
