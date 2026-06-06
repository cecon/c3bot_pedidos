# Feature Specification: Minimal shadcn/ui Base — Dashboard + Attendants

**Feature Branch**: `008-shadcn-replatform`

**Created**: 2026-06-06

**Status**: Draft

**Input**: User description: "Re-plataforma da UI para shadcn/ui (Tailwind + Radix), tabelas TanStack,
ícones Lucide, tema claro/escuro/auto via CSS variables (dark padrão). AO MESMO TEMPO, enxugar o app
até o osso: manter APENAS o Dashboard e o Cadastro de Atendentes; remover todos os outros menus/páginas
e remover banco/migrations de tudo, mantendo SOMENTE a persistência dos Atendentes. O projeto vai
recomeçar do zero a partir dessa base mínima."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Minimal shell on the new design system (Priority: P1)

The operator opens the workspace and it renders on the new design system: a clean modern-SaaS layout
with a collapsible sidebar showing only two destinations — **Dashboard** and **Atendentes** — a
header, and a dark default with working light/auto. No Mantine remains; no other menus exist.

**Why this priority**: This minimal shell is the clean foundation the project restarts from; nothing
else can be built or kept until it exists.

**Independent Test**: Launch the app, see only Dashboard + Atendentes in the nav, toggle the sidebar
and the color mode, and navigate between the two — with no other menus present and no Mantine in the
shell.

**Acceptance Scenarios**:

1. **Given** a fresh launch, **When** the workspace opens, **Then** it renders in dark mode on the new
   shell with exactly two nav items (Dashboard, Atendentes) and nothing else.
2. **Given** the workspace is open, **When** the operator toggles the sidebar, **Then** it collapses
   to an icon rail with tooltips and the state persists across reloads.
3. **Given** the appearance settings, **When** the operator changes color mode or a theme token,
   **Then** it applies instantly and persists across reloads.

---

### User Story 2 - Attendants registry, kept and rebuilt with persistence (Priority: P2)

The operator manages the attendant registry (list, create, edit, toggle availability, delete),
rebuilt on the new components with the new table engine. Attendant data **continues to persist**
locally across sessions — this is the only persisted data in the app.

**Why this priority**: The attendant registry is the one substantive capability the operator chose to
keep; preserving its data and flows is the core value of this slice.

**Independent Test**: Create/edit/toggle/delete attendants, reload the app, and confirm the changes
persisted; the list renders in the new data table with sorting and an empty state.

**Acceptance Scenarios**:

1. **Given** the Attendants page, **When** the operator creates or edits an attendant, **Then** the
   record is saved and still present after an app reload.
2. **Given** existing attendants, **When** the page loads, **Then** they appear in the new data table
   with availability shown not by color alone, plus working edit/availability/delete row actions.
3. **Given** no attendants, **When** the page loads, **Then** an explicit empty state is shown.

---

### User Story 3 - Simplified Dashboard (Priority: P3)

The operator lands on a clean Dashboard rebuilt on the new components, showing only information that
survives the trim (e.g., attendant counts/availability and a workspace welcome) — with no dependence
on removed domains (sessions, orders, catalog, campaigns, etc.).

**Why this priority**: The Dashboard is the landing screen; it must look intentional on the new base
but carries less unique value than the attendant registry.

**Independent Test**: Open the Dashboard and confirm it renders cleanly on the new components with
attendant-derived stats and no broken references to removed features.

**Acceptance Scenarios**:

1. **Given** the Dashboard, **When** it loads, **Then** it shows stat widgets/cards on the new
   components without referencing any removed domain.

---

### User Story 4 - Strip everything else; remove Mantine and unused persistence (Priority: P4)

Everything outside Dashboard + Attendants is removed: all other menus/pages and their components, and
the database/migrations/API for every domain **except attendants**. Mantine and its companion icon
set are fully removed. The result is a minimal, clean, green-building base.

**Why this priority**: Final cleanup that delivers the "start from zero" base; done last so the kept
screens are proven first.

**Independent Test**: Inspect the app — only Dashboard + Attendants exist, only attendant data
persists, no Mantine dependency remains, and the full check suite passes.

**Acceptance Scenarios**:

1. **Given** the codebase, **When** inspected, **Then** there are no pages/menus other than Dashboard
   and Atendentes, and no Mantine/companion-icon dependency.
2. **Given** persistence, **When** inspected, **Then** only the attendant data is stored; schemas,
   migrations, and API for other domains (catalog, merchant, etc.) are gone.
3. **Given** the full automated check suite, **When** run, **Then** lint, types, tests, mutation,
   line-limit, and build all pass.

---

### Edge Cases

- A stored appearance preference is missing/malformed → fall back to defaults (dark, expanded sidebar).
- Light mode selected → both kept screens remain legible with adequate contrast.
- Zero attendants → explicit empty state (no broken table).
- Stored attendant data from before the trim → still loads (attendant persistence is preserved, not reset).
- A deep link/hash to a removed page → resolves gracefully to a default (Dashboard) without crashing.

## Requirements *(mandatory)*

### Functional Requirements

**Shell & theming (US1)**
- **FR-001**: The workspace MUST render its shell on the new design system with no Mantine in the shell.
- **FR-002**: The navigation MUST contain exactly two destinations: Dashboard and Atendentes.
- **FR-003**: The sidebar MUST be collapsible (icon rail + tooltips) with state persisted locally.
- **FR-004**: Appearance MUST be themeable (color mode + core tokens) live and persisted, dark default.

**Attendants (US2)**
- **FR-005**: The attendant registry MUST preserve all current flows (list, create, edit, toggle
  availability, delete) with no functional regression.
- **FR-006**: Attendant data MUST persist locally across sessions (the only persisted data).
- **FR-007**: The attendant list MUST render with the standardized table engine (sorting, row actions,
  empty state); availability MUST NOT be shown by color alone.

**Dashboard (US3)**
- **FR-008**: The Dashboard MUST render on the new components and MUST NOT reference any removed domain.

**Trim & cleanup (US4)**
- **FR-009**: All menus/pages other than Dashboard and Atendentes MUST be removed, along with their
  components.
- **FR-010**: Database schemas, migrations, and API endpoints for every domain except attendants MUST
  be removed; the attendant table, its migration, and the migration runner MUST remain functional.
- **FR-011**: Mantine and its companion icon dependency MUST be fully removed.
- **FR-012**: Reusable UI components MUST live in-repo as copyable/adjustable building blocks.
- **FR-013**: The full automated check suite (lint, types, tests, mutation on pure rules, line-limit,
  build, cargo check) MUST pass.

**Cross-cutting**
- **FR-014**: The app MUST open directly into the workspace, dark by default, dense and keyboard-friendly.
- **FR-015**: All interactive controls MUST be keyboard-operable with accessible names; layout MUST
  stay responsive (no header/nav/content overlap) on desktop and tablet.

### Key Entities *(include if feature involves data)*

- **Attendant** (persisted): the only stored entity — identity, contact, availability status, and the
  fields the current registry already uses. Persistence and shape are preserved.
- **Appearance Preferences** (persisted, local): color mode, sidebar collapsed state, and core theme
  tokens; defaulted to dark/expanded; validated on load.
- **Removed domains**: sessions, customers, orders, catalog/categories/products, merchant, automations,
  campaigns — their pages and (where applicable) persistence are deleted.

## Success Criteria *(mandatory)*

- **SC-001**: The app exposes exactly two destinations (Dashboard, Atendentes) and no other menus.
- **SC-002**: 100% of existing attendant flows work with identical outcomes, and attendant changes
  survive an app reload.
- **SC-003**: Appearance changes apply within 1 second and persist across reloads 100% of the time.
- **SC-004**: The app opens in dark mode with the sidebar expanded on first launch.
- **SC-005**: No Mantine/companion-icon dependency remains; only attendant data persists; the full
  automated check suite passes.
- **SC-006**: At common desktop and tablet widths, header, navigation, and content never overlap.

## Assumptions

- Per the project constitution (v2.0.0), the approved UI stack is Tailwind + shadcn/ui (Radix,
  in-repo) + TanStack Table + Lucide on Vite/React/TS/Tauri/SQLite; Mantine is removed.
- Only the attendant registry keeps persistence; the migration runner and the attendant table/migration
  are kept, while catalog (feature 005) and merchant (feature 006) schemas, migrations, API routes, and
  domain modules are removed.
- The Dashboard is simplified to attendant-derived stats and a welcome; it no longer reads sessions/
  orders/catalog/campaign data (those are removed).
- Hash-based navigation and local preference storage are reused; no new routing/state library.
- Backend command boundary (Rust) and SQLite engine remain; only unused schemas/migrations/endpoints
  are deleted. The local API keeps only the attendant endpoints.
- This is a deliberate teardown to a clean minimal base ("start from zero"); deleted code is recoverable
  via git history.
- Out of scope: Next.js, new product features, and re-adding any removed domain.
