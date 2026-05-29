# Implementation Plan: Delivery Attendants

**Branch**: `003-delivery-attendants` | **Date**: 2026-05-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-delivery-attendants/spec.md`

## Summary

Add a dedicated admin destination for human delivery attendants. The implementation
will extend the existing attendant domain and SQLite schema with display name,
required WhatsApp phone, online/offline availability, and Base64 photo data; add a
focused attendants list/form page; and centralize transfer eligibility so offline or
inactive attendants cannot receive delivery session transfers.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19, Rust 2021 edition

**Primary Dependencies**: Existing Tauri 2, Vite 7, Mantine 9, Mantine form/hooks,
Lucide React, Tauri SQL plugin, Vitest 4, Testing Library, and StrykerJS 9. No new UI
framework, database, or routing dependency is required.

**Storage**: SQLite local database (`sqlite:c3bot.db`) with Rust-registered migrations.
The existing `attendants` table will be migrated rather than creating a parallel
employee table.

**Testing**: Vitest unit tests for attendant validation, photo handling limits,
availability transitions, transfer eligibility, and navigation metadata; component
tests for the attendants panel; StrykerJS mutation coverage extended to the new
attendant domain helper; TypeScript typecheck, Vite build, and Cargo check.

**Target Platform**: Windows desktop first through Tauri; Vite browser validation
remains supported at `http://localhost:3920`.

**Project Type**: Local-first desktop admin application.

**Performance Goals**: Opening the attendants destination and toggling status should
show local UI feedback in under 1 second; status toggles should update the visible row
in under 250 ms for local state; the list should remain readable for hundreds of
attendants.

**Constraints**: Dark operator UI; no landing page; route must work in Tauri and Vite;
profile photos are retained as Base64 data in the local database; WhatsApp phone and
photo data must not be logged; offline or inactive attendants must never be valid
transfer targets.

**Scale/Scope**: One new primary admin destination, one list/form workflow, one
versioned SQLite migration, one repository/service boundary for attendants, and one
shared transfer eligibility rule integrated with session transfer surfaces.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec-first traceability: PASS. Specification and checklist already exist under
  `specs/003-delivery-attendants/`; this plan adds research, data model, contracts,
  and quickstart before implementation tasks.
- Stack boundary: PASS. The plan keeps Tauri 2, Vite, React, TypeScript, Mantine,
  Rust, and SQLite, and does not introduce a new router, UI framework, or database.
- Privacy boundary: PASS. WhatsApp phone numbers and Base64 photos are local
  attendant PII and must not be logged or exposed through unrestricted diagnostics.
- Quality gate: PASS. Availability, validation, route metadata, and transfer
  eligibility are shared workflow rules and will be covered by unit and mutation
  tests.
- Operator UX: PASS. The feature opens directly into a dense dark workspace page with
  a list, add action, and row controls; it is not a marketing or onboarding surface.

## Project Structure

### Documentation (this feature)

```text
specs/003-delivery-attendants/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── attendants-management-contract.md
│   └── session-transfer-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── App.tsx
├── components/
│   ├── AttendantsPanel.tsx
│   ├── AttendantsPanel.test.tsx
│   ├── SidebarNav.tsx
│   └── WorkspaceRoutes.tsx
├── domain/
│   ├── attendants.ts
│   ├── attendants.test.ts
│   ├── navigation.ts
│   ├── navigation.test.ts
│   ├── mockData.ts
│   └── types.ts
├── services/
│   ├── attendantRepository.ts
│   └── database.ts
└── styles.css

src-tauri/
├── migrations/
│   ├── 001_init.sql
│   └── 002_delivery_attendants.sql
└── src/
    └── lib.rs

stryker.config.json
```

**Structure Decision**: Keep the existing single Tauri/Vite app. Add the attendants
page beside other focused workspace panels, keep validation and transfer eligibility
in `src/domain/attendants.ts` for unit/mutation coverage, add a small SQLite
repository under `src/services/`, and register a second Rust SQL migration for the
schema change.

## Complexity Tracking

No constitution violations are required for this implementation.

## Phase 0 Research Summary

The implementation will extend the existing attendant concept instead of adding a
separate employee module. A new `delivery-attendants` route is added to the
administration navigation group. Availability uses an explicit `online`/`offline`
status separate from the existing active/deleted flag, with new records starting
offline. Photos are accepted as local image files, encoded to Base64, and stored on
the attendant record with guardrails for supported image type and size. Transfer
eligibility is a tested domain rule based on active and online status.

## Phase 1 Design Summary

The data model adds `DeliveryAttendant`, `AvailabilityStatus`, `AttendantPhoto`, and
`SessionTransferEligibility`. UI contracts define the first-view list, add/edit form,
row actions, validation messages, and delete confirmation. Transfer contracts define
how eligible attendants are selected and how the no-online-attendant case is reported.

## Post-Design Constitution Check

- Spec-first traceability: PASS. Plan, research, data model, contracts, and quickstart
  are present for the feature.
- Stack boundary: PASS. Design uses current Tauri/Vite/React/Mantine/SQLite stack.
- Privacy boundary: PASS. Contracts explicitly keep phone/photo data local and out of
  logs.
- Quality gate: PASS. Domain rules are isolated for Vitest and Stryker mutation
  coverage.
- Operator UX: PASS. Contracts preserve the dark admin navigation model and focused
  first screen.
