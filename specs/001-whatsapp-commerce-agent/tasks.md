# Tasks: WhatsApp Commerce Agent Workspace

**Input**: Design documents from `/specs/001-whatsapp-commerce-agent/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests and mutation testing are required for domain behavior. Component
and integration tests are required when a story changes user-facing workflow,
persistence, or external integration contracts.

**Organization**: Tasks are grouped by user story to enable independent implementation
and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline quality tooling

- [ ] T001 Initialize Spec Kit project artifacts in .specify/ and .agents/
- [ ] T002 Scaffold Tauri 2 + Vite + React TypeScript app in package.json, src/, and src-tauri/
- [ ] T003 Configure Mantine dark theme and global styles in src/theme.ts and src/styles.css
- [ ] T004 Configure Vitest, jsdom, and setup file in vite.config.ts and src/setupTests.ts
- [ ] T005 Configure StrykerJS mutation testing in stryker.config.json
- [ ] T006 Add SQLite plugin dependencies in package.json and src-tauri/Cargo.toml
- [ ] T007 Add SQLite migration schema in src-tauri/migrations/001_init.sql
- [ ] T008 Configure Tauri SQL plugin and preload in src-tauri/src/lib.rs and src-tauri/tauri.conf.json

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared domain, persistence, security, and adapter boundaries

- [ ] T009 Define shared domain entities in src/domain/types.ts
- [ ] T010 [P] Add initial domain fixtures in src/domain/mockData.ts
- [ ] T011 [P] Implement database runtime helper in src/services/database.ts
- [ ] T012 [P] Implement order/session analytics helpers in src/domain/analytics.ts
- [ ] T013 [P] Add unit tests for analytics helpers in src/domain/analytics.test.ts
- [ ] T014 Run mutation test gate for src/domain/analytics.ts using pnpm test:mutation
- [ ] T015 Create provider adapter interfaces from contracts in src/services/adapters.ts
- [ ] T016 Add password hashing and credential verification service in src/services/auth.ts
- [ ] T017 Add repository layer for SQLite CRUD operations in src/services/repositories/

**Checkpoint**: Foundation ready - user story implementation can now begin in priority order.

---

## Phase 3: User Story 1 - Secure WhatsApp Session Chat (Priority: P1)

**Goal**: Users sign in, create WhatsApp sessions by phone number, assign attendants,
and operate a WhatsApp-like chat queue.

**Independent Test**: Create a user, sign in, add a session, select it, send a message,
and verify it appears in the chat.

### Tests for User Story 1

- [ ] T018 [P] [US1] Add auth service unit tests in src/services/auth.test.ts
- [ ] T019 [P] [US1] Add session normalization tests in src/domain/analytics.test.ts
- [ ] T020 [P] [US1] Add chat component tests in src/App.test.tsx

### Implementation for User Story 1

- [ ] T021 [US1] Add login screen state and access guard in src/App.tsx
- [ ] T022 [US1] Persist users and attendants through SQLite repository in src/services/repositories/users.ts
- [ ] T023 [US1] Persist WhatsApp sessions through SQLite repository in src/services/repositories/sessions.ts
- [ ] T024 [US1] Persist chat messages through SQLite repository in src/services/repositories/messages.ts
- [ ] T025 [US1] Wire session API adapter for connect and send operations in src/services/sessionApi.ts
- [ ] T026 [US1] Add duplicate session validation in src/services/repositories/sessions.ts

**Checkpoint**: User Story 1 is usable without catalog, orders, automation, or campaigns.

---

## Phase 4: User Story 2 - Catalog and Scheduled Order Capture (Priority: P2)

**Goal**: Attendants manage a photo catalog and create scheduled orders from chats.

**Independent Test**: Add a product, select it for the current chat customer, schedule
an order, and verify the order total and status.

### Tests for User Story 2

- [ ] T027 [P] [US2] Add product pricing unit tests in src/domain/catalog.test.ts
- [ ] T028 [P] [US2] Add order scheduling unit tests in src/domain/orders.test.ts
- [ ] T029 [P] [US2] Add catalog UI tests in src/App.test.tsx

### Implementation for User Story 2

- [ ] T030 [P] [US2] Implement product repository in src/services/repositories/products.ts
- [ ] T031 [P] [US2] Implement order repository in src/services/repositories/orders.ts
- [ ] T032 [US2] Replace catalog mock state with repository-backed state in src/App.tsx
- [ ] T033 [US2] Add order item selection and quantity controls in src/App.tsx
- [ ] T034 [US2] Add scheduled order creation workflow in src/App.tsx

**Checkpoint**: Catalog and scheduled order flow works independently from automation and campaigns.

---

## Phase 5: User Story 3 - Customers, Addresses, and Orders Dashboard (Priority: P3)

**Goal**: Operators maintain customer records, enrich addresses, and monitor orders.

**Independent Test**: Open a customer by WhatsApp number, verify or fail address
enrichment, and confirm dashboard metrics reflect order status changes.

### Tests for User Story 3

- [ ] T035 [P] [US3] Add customer matching tests in src/domain/customers.test.ts
- [ ] T036 [P] [US3] Add address enrichment adapter tests in src/services/addressEnrichment.test.ts
- [ ] T037 [P] [US3] Add dashboard summary tests in src/domain/analytics.test.ts

### Implementation for User Story 3

- [ ] T038 [P] [US3] Implement customer repository in src/services/repositories/customers.ts
- [ ] T039 [P] [US3] Implement address repository in src/services/repositories/addresses.ts
- [ ] T040 [US3] Add customer profile panel to current chat in src/App.tsx
- [ ] T041 [US3] Add address enrichment adapter in src/services/addressEnrichment.ts
- [ ] T042 [US3] Replace order dashboard mock data with repository-backed metrics in src/App.tsx

**Checkpoint**: Customer, address, and dashboard workflow is independently testable.

---

## Phase 6: User Story 4 - Automation Groups for MCPs, Skills, and Agents (Priority: P4)

**Goal**: Administrators create automation groups and link MCPs, skills, and agents.

**Independent Test**: Create a group, add one binding of each type, link a session, and
verify only enabled bindings are eligible.

### Tests for User Story 4

- [ ] T043 [P] [US4] Add automation binding tests in src/domain/automation.test.ts
- [ ] T044 [P] [US4] Add automation registry adapter tests in src/services/automationRegistry.test.ts

### Implementation for User Story 4

- [ ] T045 [P] [US4] Implement automation group repository in src/services/repositories/automationGroups.ts
- [ ] T046 [P] [US4] Implement automation binding repository in src/services/repositories/automationBindings.ts
- [ ] T047 [US4] Add group create/edit UI in src/App.tsx
- [ ] T048 [US4] Add MCP, skill, and agent binding controls in src/App.tsx
- [ ] T049 [US4] Link WhatsApp sessions to automation groups in src/App.tsx

**Checkpoint**: Automation groups work without campaigns.

---

## Phase 7: User Story 5 - WhatsApp Campaigns (Priority: P5)

**Goal**: Marketing users create segmented campaigns and monitor delivery metrics.

**Independent Test**: Create a campaign, schedule it, pause it, and update metrics.

### Tests for User Story 5

- [ ] T050 [P] [US5] Add campaign status transition tests in src/domain/campaigns.test.ts
- [ ] T051 [P] [US5] Add campaign adapter tests in src/services/campaignAdapter.test.ts

### Implementation for User Story 5

- [ ] T052 [P] [US5] Implement campaign repository in src/services/repositories/campaigns.ts
- [ ] T053 [US5] Add campaign create/edit form in src/App.tsx
- [ ] T054 [US5] Add segment selection from customer tags in src/App.tsx
- [ ] T055 [US5] Wire campaign adapter schedule, pause, and metrics operations in src/services/campaignAdapter.ts

**Checkpoint**: Campaign workflow is testable independently from catalog and automation setup.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Security hardening, quality gates, and operational readiness

- [ ] T056 [P] Add README setup and validation commands in README.md
- [ ] T057 [P] Add .gitignore entries for local databases, logs, and mutation reports in .gitignore
- [ ] T058 Run pnpm typecheck and fix any TypeScript errors
- [ ] T059 Run pnpm test and fix failing unit tests
- [ ] T060 Run pnpm test:mutation and keep mutation score at or above 85%
- [ ] T061 Run pnpm build and fix production build errors
- [ ] T062 Run cargo check --manifest-path src-tauri/Cargo.toml and fix Rust errors
- [ ] T063 Review session credentials, passwords, and customer PII handling before production credentials are added

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies
- Foundational (Phase 2): Depends on Setup
- User Stories (Phase 3-7): Depend on Foundational
- Polish: Depends on selected user stories

### User Story Dependencies

- User Story 1 (P1): First MVP slice after foundation
- User Story 2 (P2): Depends on customer/session context from US1
- User Story 3 (P3): Depends on order and customer data from US1 and US2
- User Story 4 (P4): Depends on sessions from US1
- User Story 5 (P5): Depends on customer segments from US3

### Parallel Opportunities

- T010-T013 can run in parallel after setup.
- Repository tasks in each story can run in parallel with story-specific tests.
- US4 and US5 can proceed in parallel after US1 and foundational repositories exist.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete User Story 1.
3. Validate with typecheck, unit tests, mutation tests, build, and cargo check.
4. Demo session creation and chat message flow.

### Incremental Delivery

1. Add catalog and scheduled orders.
2. Add customer/address enrichment and dashboard.
3. Add automation groups.
4. Add campaigns.
5. Harden security and provider adapters before production credentials.
