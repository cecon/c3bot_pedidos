# Feature Specification: Admin UI Re-platform to shadcn/ui

**Feature Branch**: `008-shadcn-replatform`

**Created**: 2026-06-06

**Status**: Draft

**Input**: User description: "Re-plataforma da UI do c3bot: substituir Mantine por shadcn/ui (Tailwind
+ Radix), tabelas com TanStack Table, ícones Lucide, tema claro/escuro/auto via CSS variables (dark
padrão), sidebar customizada colapsável e header completo, preservando todo o comportamento das
páginas atuais e incorporando os objetivos de UX premium do spec 007 (superseded). Remover Mantine
por completo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New design system foundation + app shell (Priority: P1)

The operator opens the workspace and it is rendered on the new design system: a custom collapsible
sidebar, a complete header, and a polished modern-SaaS layout, with a dark default and a working
light/auto option. Navigation between every existing section works. This is the foundation every
page is rebuilt on; no Mantine remains in the shell.

**Why this priority**: Nothing else can be migrated until the shell, theme system, and base UI
building blocks exist. It is the MVP that proves the new look-and-feel and unblocks all page work.

**Independent Test**: Launch the app, confirm it renders on the new system (no Mantine in the shell),
toggle the sidebar and the color mode, and navigate to every destination — even if individual page
bodies are still being migrated.

**Acceptance Scenarios**:

1. **Given** a fresh launch, **When** the workspace opens, **Then** it renders in dark mode with the
   new sidebar + header and no Mantine-rendered shell.
2. **Given** the workspace is open, **When** the operator toggles the sidebar, **Then** it collapses
   to an icon rail with tooltips/flyout and the choice persists across reloads.
3. **Given** the appearance settings, **When** the operator switches color mode (light/dark/auto) or
   changes a theme token, **Then** the change applies instantly and persists across reloads.
4. **Given** any destination, **When** the operator navigates to it, **Then** the existing routes
   (including catalog sub-pages) resolve and the breadcrumb reflects the location.

---

### User Story 2 - Operations pages rebuilt with parity (Priority: P2)

The operator uses the day-to-day Operations pages — Dashboard, Sessions/Chat, Catalog (with the
Cadastro/Grupos/Produtos sub-pages), Orders, and Customers — rebuilt on the new system, with data
tables powered by the new table engine. Every action, field, and data shown matches today's
behavior.

**Why this priority**: These are the highest-traffic screens; delivering them first restores the
operator's core daily workflow on the new system.

**Independent Test**: Exercise each Operations page (create/select/list/edit flows already present
today) and confirm identical data and behavior, now on the new components and tables.

**Acceptance Scenarios**:

1. **Given** the Dashboard, **When** it loads, **Then** the same KPIs and panels appear with the new
   styling and no behavior change.
2. **Given** the Catalog, **When** the operator uses Cadastro/Grupos/Produtos, **Then** the submenu,
   pickers, and gating behave exactly as before.
3. **Given** an Operations list (e.g., Orders/Customers), **When** it renders in a data table, **Then**
   sorting/empty-states/row actions behave consistently and show the same records.

---

### User Story 3 - Administration pages rebuilt with parity (Priority: P3)

The operator uses the Administration pages — Attendants (table), Automations, Campaigns, Merchant,
Settings, and API/Docs — rebuilt on the new system with the new table engine where tables are used.
All behavior and data match today.

**Why this priority**: Important but lower-traffic than Operations; can follow once the core daily
workflow is migrated.

**Independent Test**: Exercise each Administration page's existing flows and confirm identical data
and behavior on the new components.

**Acceptance Scenarios**:

1. **Given** the Attendants page, **When** it renders, **Then** the roster table, availability toggle,
   create, and delete flows behave exactly as before.
2. **Given** the Merchant page, **When** the operator edits and saves the profile (including
   coordinates and operations), **Then** behavior and persistence match today.

---

### User Story 4 - Mantine fully removed and parity verified (Priority: P4)

The codebase contains no Mantine (or its companion icon set) dependencies; the appearance and
behavior reach parity with the pre-migration app plus the premium UX goals; all automated checks are
green.

**Why this priority**: Final cleanup and verification; closes the migration and prevents a
dual-framework state from lingering.

**Independent Test**: Inspect dependencies (no Mantine/companion-icon packages), run the full check
suite green, and walk the quickstart to confirm parity.

**Acceptance Scenarios**:

1. **Given** the dependency manifest, **When** inspected, **Then** no Mantine or its companion icon
   packages are present.
2. **Given** the full automated check suite, **When** run, **Then** lint, types, tests, mutation,
   line-limit, and build all pass.

---

### Edge Cases

- A stored appearance preference is missing/malformed/older → fall back to documented defaults (dark,
  expanded sidebar) without breaking.
- Light mode is selected → every screen remains legible with adequate contrast (no dark-only colors
  leaking into light mode).
- A data table has zero rows → an explicit empty state is shown.
- The sidebar is collapsed on a tablet width → navigation stays usable; header/nav/content do not
  overlap.
- Mid-migration on the branch, a not-yet-migrated page is opened → it still renders without crashing
  (no half-removed framework errors).

## Requirements *(mandatory)*

### Functional Requirements

**Foundation & shell (US1)**
- **FR-001**: The workspace MUST render its shell (sidebar, header, layout) on the new design system,
  with no Mantine in the shell.
- **FR-002**: The workspace MUST provide a custom collapsible sidebar (expanded labels+icons / compact
  icons-only with tooltips and a flyout for catalog sub-pages); the state MUST persist locally.
- **FR-003**: The header MUST include a menu toggle, logo, breadcrumb, global search, notifications,
  and a user menu, alongside existing status indicators.
- **FR-004**: Appearance MUST be themeable via the settings panel (primary/secondary/semantic colors,
  typography, density, radius, shadow, color mode, header position, container width), applied live and
  persisted, with dark as the default.
- **FR-005**: All existing navigation (destinations and catalog sub-pages) MUST continue to work.

**Page parity (US2, US3)**
- **FR-006**: Every existing page MUST be rebuilt on the new system preserving its current data,
  fields, actions, and flows (no functional regression).
- **FR-007**: Data tables MUST be rendered with the standardized table engine and provide consistent
  sorting, row actions, and empty states.
- **FR-008**: Domain/business logic and persistence MUST be unchanged (UI layer only); existing pure
  domain rules MUST be preserved.

**Cleanup & verification (US4)**
- **FR-009**: The project MUST contain no Mantine (or its companion icon) dependencies after migration.
- **FR-010**: Reusable UI components MUST live in-repo as copyable/adjustable building blocks (so they
  can be tuned without depending on an external component theme).
- **FR-011**: The full automated check suite (lint, types, tests, mutation on pure rules, line-limit,
  build) MUST pass.

**Cross-cutting**
- **FR-012**: The application MUST open directly into the workspace, dark by default, dense and
  keyboard-friendly (no marketing/landing page).
- **FR-013**: All interactive controls MUST be keyboard-operable and expose accessible names; status
  MUST NOT be conveyed by color alone.
- **FR-014**: Layout MUST remain responsive on desktop and tablet with no header/nav/content overlap.

### Key Entities *(include if feature involves data)*

- **Appearance Preferences**: Operator look-and-feel choices (sidebar collapsed state, primary/
  secondary/semantic colors, font, density, radius, shadow, color mode, header position, container
  width), persisted locally, defaulted to dark/expanded, validated on load.
- **Existing domain data**: Sessions, customers, orders, attendants, catalogs/categories/products,
  merchant, automations, campaigns — unchanged; only their presentation changes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of existing destinations and catalog sub-pages remain reachable after migration.
- **SC-002**: 100% of existing page flows (create/select/list/edit/delete as present today) work with
  identical data and outcomes (zero functional regressions).
- **SC-003**: Appearance changes apply within 1 second and persist across reloads 100% of the time.
- **SC-004**: The workspace opens in dark mode by default with the sidebar expanded on first launch.
- **SC-005**: At common desktop and tablet widths, header, navigation, and content never overlap.
- **SC-006**: No Mantine (or companion icon) dependency remains; the full automated check suite passes.
- **SC-007**: An operator can collapse/expand the sidebar and switch color mode in a single action
  each, with both choices restored after reload.

## Assumptions

- Per the project constitution (v2.0.0), the approved UI stack is Tailwind CSS + shadcn/ui (Radix UI
  primitives, in-repo) + TanStack Table + Lucide icons, on Vite/React/TypeScript/Tauri/SQLite; Mantine
  is removed. This feature implements that mandate.
- Migration happens big-bang on this feature branch: the app is rebuilt on the new stack before the
  branch is considered done; the branch is not merged in a broken state.
- The existing hash-based navigation and local preference storage are reused (no new routing or
  state-management library).
- Backend, local API, SQLite schema, and Rust shell are unchanged; this is a UI-layer migration.
- The premium UX goals from the superseded feature 007 (collapsible sidebar, complete header, theme
  builder, design tokens) are folded into this feature, now realized on the new stack.
- Notifications and the user menu remain presentational with mock data; no real authentication is
  introduced.
- Existing component tests are rewritten against the new component DOM; pure domain-rule tests are
  preserved.
- Out of scope: Next.js, backend/API/SQLite/Rust changes, and new product features beyond parity plus
  the 007 premium-UX goals.
