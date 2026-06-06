# Feature Specification: Premium Admin UX Shell

**Feature Branch**: `007-admin-ux-shell`

**Created**: 2026-06-06

**Status**: Draft

**Input**: User description: "Camada de UX premium para o admin c3bot (dark-first, reusando o stack
atual): sidebar colapsável, header completo (breadcrumb, busca global, notificações, menu de
usuário), Theme Builder expandido (densidade, sombras, radius, fontes, cores secundárias, layout) e
design-system centralizado (tokens + componentes base), no nível de temas comerciais
(Tabler/Metronic/Angle). Sem novas dependências; preferências persistidas localmente; dark continua
o padrão."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Collapsible sidebar that remembers its state (Priority: P1)

An operator working long sessions wants to reclaim horizontal space on demand. They toggle the
left navigation between a full (labels + icons) state and a compact (icons-only) state. In the
compact state, hovering an item reveals its name, and the catalog sub-pages open as a small flyout
instead of inline. The chosen state is remembered and restored the next time they open the app.

**Why this priority**: It is the most self-contained, immediately visible UX win, testable on its
own, and unlocks the header toggle control that later stories reuse. It is a complete MVP slice.

**Independent Test**: Toggle the sidebar to compact, confirm only icons show with working
tooltips/flyout, reload the app, and confirm the compact state is restored — without any other
story implemented.

**Acceptance Scenarios**:

1. **Given** the sidebar is expanded, **When** the operator activates the menu toggle, **Then** the
   sidebar collapses to an icons-only rail and the content area widens accordingly.
2. **Given** the sidebar is collapsed, **When** the operator hovers a navigation item, **Then** the
   item's label appears as a tooltip and the active item stays visually marked.
3. **Given** the catalog section is active and the sidebar is collapsed, **When** the operator
   focuses the catalog item, **Then** its sub-pages (Cadastro/Grupos/Produtos) are reachable via a
   flyout rather than an inline list.
4. **Given** the operator collapsed the sidebar, **When** they reload the app, **Then** the sidebar
   reopens in the collapsed state.

---

### User Story 2 - Expanded appearance customization (Priority: P2)

An operator (or whoever sets up the workspace) opens the appearance settings panel and tailors the
look without leaving the page: primary and secondary colors, semantic colors (success/warning/
danger/info), font family, content density, corner radius, shadow depth, color mode, header
position, and content width. Every change applies instantly, is saved, and is reloaded automatically
on next launch. Dark remains the default mode.

**Why this priority**: Customization is the headline of the request and delivers durable value
across every screen, but it depends on a stable shell to showcase the results.

**Independent Test**: Open the settings panel, change density, radius, shadow, font, and a color,
see each apply live, reload, and confirm all selections persisted — independently of the header and
component-library work.

**Acceptance Scenarios**:

1. **Given** the settings panel is open, **When** the operator selects a different density, **Then**
   spacing and control sizes across the workspace update immediately.
2. **Given** the settings panel is open, **When** the operator changes the primary or secondary
   color, **Then** accents, active states, and buttons reflect the new color immediately.
3. **Given** the operator changed shadow, radius, and font, **When** they reload the app, **Then**
   all three selections are restored.
4. **Given** color mode is set to "auto", **When** the operating system theme changes, **Then** the
   workspace follows it, while dark remains the default for first-time use.
5. **Given** the operator selects "boxed" container width or a static header, **When** they navigate
   between pages, **Then** the layout honors that choice consistently.

---

### User Story 3 - Complete top navigation header (Priority: P3)

An operator needs faster orientation and navigation from the top bar: a menu toggle, the workspace
logo, a breadcrumb showing where they are, a global search to jump to any section, a notifications
menu, and a user menu. These coexist with the existing connection/status indicators.

**Why this priority**: High everyday value for orientation and speed, but it builds on the sidebar
toggle (P1) and reads cleaner once the shell and tokens are settled.

**Independent Test**: From any page, use the breadcrumb to confirm location, type in global search
and jump to a section, open the notifications and user menus — without the customization or
component-library stories implemented.

**Acceptance Scenarios**:

1. **Given** the operator is on a sub-page, **When** they look at the header, **Then** the breadcrumb
   shows the section and sub-page path (e.g., Catálogo › Produtos).
2. **Given** the operator opens global search, **When** they type part of a section name, **Then**
   matching destinations are listed and selecting one navigates there.
3. **Given** the operator opens the notifications menu, **When** there are items, **Then** they are
   listed with a clear unread indication.
4. **Given** the operator opens the user menu, **When** it is shown, **Then** account-related actions
   are presented (no real authentication required for this feature).

---

### User Story 4 - Consistent design tokens and reusable building blocks (Priority: P4)

So the workspace looks cohesive and stays easy to extend, the visual decisions (colors, typography,
spacing, radius, shadows, breakpoints) live in one shared source, and common screen pieces — a page
container with title/breadcrumb, statistic widgets, dashboard cards, and a standard data table — are
provided as reusable blocks. Existing pages adopt these blocks without changing their behavior.

**Why this priority**: Foundational for long-term consistency, but it is largely internal polish and
delivers the least standalone end-user value, so it comes last.

**Independent Test**: Replace one existing page's ad-hoc card/table/heading with the shared blocks
and confirm the page looks and behaves the same, proving the blocks are drop-in.

**Acceptance Scenarios**:

1. **Given** the shared tokens exist, **When** a color or radius token changes, **Then** the change
   propagates everywhere that token is used.
2. **Given** an existing page is migrated to the shared building blocks, **When** it is used, **Then**
   its behavior and data are unchanged while its styling matches the rest of the workspace.

---

### Edge Cases

- A stored preference is missing, malformed, or from an older version → the workspace falls back to
  the documented defaults (dark mode, expanded sidebar) without breaking.
- The sidebar is collapsed on a narrow/tablet width → navigation remains usable and content does not
  overlap the header.
- An operator picks a low-contrast color combination → semantic/active states remain legible (text
  stays readable on its background).
- Global search returns no matches → a clear empty state is shown instead of a blank list.
- Notifications are empty → an explicit "no notifications" state is shown.

## Requirements *(mandatory)*

### Functional Requirements

**Sidebar (US1)**
- **FR-001**: The workspace MUST let the operator toggle the sidebar between an expanded
  (labels + icons) and a collapsed (icons-only) state.
- **FR-002**: In the collapsed state, navigation items MUST reveal their label on hover/focus and the
  catalog sub-pages MUST be reachable via a flyout.
- **FR-003**: The active section and active catalog sub-page MUST remain visually marked in both
  states.
- **FR-004**: The sidebar state MUST persist locally and be restored on the next launch.

**Appearance customization (US2)**
- **FR-005**: The appearance settings panel MUST let the operator change, at minimum: primary color,
  secondary color, semantic colors (success/warning/danger/info), font family, content density,
  corner radius, shadow depth, color mode (light/dark/auto), header position (fixed/static), and
  content width (full/boxed).
- **FR-006**: Every appearance change MUST apply across the workspace in real time, without reload.
- **FR-007**: All appearance selections MUST persist locally and be reloaded automatically on launch.
- **FR-008**: Dark MUST remain the default mode for a first-time/unconfigured workspace.
- **FR-009**: The appearance panel MUST be reachable from a persistent control and organized into
  scannable sections (e.g., Appearance, Colors, Typography, Layout, Borders, Shadows).

**Header (US3)**
- **FR-010**: The header MUST include a menu toggle, the workspace logo, a breadcrumb of the current
  location, a global search, a notifications menu, and a user menu, alongside the existing
  connection/status indicators.
- **FR-011**: The breadcrumb MUST reflect the current section and sub-page.
- **FR-012**: Global search MUST list workspace destinations matching the query and navigate to the
  selected one.
- **FR-013**: The notifications and user menus MUST present their contents (mock data is acceptable;
  no real authentication is in scope) and show clear empty states.

**Design system (US4)**
- **FR-014**: Visual tokens (colors, typography, spacing, radius, shadows, breakpoints) MUST come
  from a single shared source that also seeds the appearance defaults.
- **FR-015**: The feature MUST provide reusable building blocks for a page container (title +
  breadcrumb + responsive body), statistic widgets, dashboard cards, and a standard data table.
- **FR-016**: Migrating an existing page to the shared building blocks MUST NOT change that page's
  behavior or data.

**Cross-cutting**
- **FR-017**: The feature MUST NOT introduce new runtime dependencies or a new navigation/state
  mechanism; it extends the existing preference store and navigation model.
- **FR-018**: The workspace MUST remain responsive across desktop and tablet widths, with no
  overlap between header, navigation, and content at common sizes.
- **FR-019**: All new interactive controls MUST be keyboard-operable and expose accessible names.

### Key Entities *(include if feature involves data)*

- **Appearance Preferences**: The operator's saved look-and-feel choices — sidebar collapsed state,
  primary color, secondary color, semantic colors, font family, content density, corner radius,
  shadow depth, color mode, header position, and content width. Persisted locally; loaded at launch;
  falls back to defaults when absent or invalid.
- **Navigation Destination / Sub-page**: Existing concept reused to power the breadcrumb and global
  search (section, label, path, and optional sub-page).
- **Notification (mock)**: A presentational item with a title, description, timestamp, and read state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An operator can collapse or expand the sidebar in a single action, and the state is
  restored after reload 100% of the time.
- **SC-002**: Every appearance setting applies visibly within 1 second of the change, with no page
  reload required.
- **SC-003**: 100% of appearance selections survive an app reload (re-loaded automatically).
- **SC-004**: From any page, an operator can reach any other section via global search in 3 actions
  or fewer (open search, type, select).
- **SC-005**: After migrating to the shared building blocks, existing pages show zero behavioral
  regressions (all existing automated checks continue to pass).
- **SC-006**: At common desktop and tablet widths, header, navigation, and content never overlap.
- **SC-007**: A first-time/unconfigured workspace opens in dark mode with the sidebar expanded.

## Assumptions

- The existing local preference store and hash-based navigation are extended; no new state-management
  or routing library is added (per project constitution, Tech Boundaries).
- Dark mode is the default; light and "auto" are supported options, but the four named visual presets
  (Modern/Corporate/Minimal/Flat) are out of scope.
- Notifications and the user menu are presentational with mock data; no real authentication, account
  backend, or notification source is built in this feature.
- Fonts are bundled/served locally (no external CDN) to preserve local-first behavior; the exact
  delivery mechanism is decided during planning.
- The existing icon set and component styling conventions are reused; no new icon library is added.
- Charts/graph widgets mentioned as generic "content area" examples are not built here beyond the
  reusable card/widget containers.
- Single-operator workspace; preferences are per-installation, not per-user-account.
