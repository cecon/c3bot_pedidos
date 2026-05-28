# Research: Admin Route Layout

## Decision: Use A Persistent Admin Shell

**Rationale**: The feature request is about separating functions that currently share
one crowded workspace. A persistent shell with sidebar navigation, header, and main
content gives operators stable orientation while allowing each function to use a
focused page layout.

**Alternatives considered**:

- Keep the current three-column grid and add more tabs. Rejected because it preserves
  the all-in-one screen problem.
- Convert every function to modal dialogs. Rejected because repeated operator work
  needs durable pages, not transient surfaces.

## Decision: Use Hash-Style Internal Routes For The First Slice

**Rationale**: Tauri desktop apps and Vite browser validation both handle hash
destinations without server fallback configuration. Hash routes satisfy direct
navigation and refresh behavior for this local workspace while avoiding a new routing
dependency.

**Alternatives considered**:

- Add React Router. Deferred because the initial navigation is shallow and can be
  represented by a typed route catalog.
- Use only component state without URL destinations. Rejected because the spec
  requires direct navigation to each primary function.

## Decision: Centralize Route Metadata In A Tested Helper

**Rationale**: Labels, groups, route keys, fallback behavior, and active-state
resolution are shared workflow rules. Keeping them in a domain helper makes route
behavior easy to test and include in mutation coverage.

**Alternatives considered**:

- Define routes inline in sidebar components. Rejected because it duplicates behavior
  and makes active-state and fallback rules harder to test.
- Store route definitions in local storage. Rejected because navigation structure is
  product behavior, not operator preference in this slice.

## Decision: Preserve Workspace State In App-Level State

**Rationale**: Existing `App.tsx` already owns sessions, messages, products, orders,
and current selections. Keeping that state above the routed page content preserves
selected session, filters, and form values when operators move between sections.

**Alternatives considered**:

- Reset state on every route change. Rejected because the spec requires useful
  context to survive navigation.
- Persist navigation state to SQLite. Deferred because this feature only requires
  in-session preservation.

## Decision: Reuse Existing Panels While Splitting Page Responsibility

**Rationale**: `SessionPanel`, `ChatPanel`, `CatalogPanel`, `OrdersPanel`,
`AutomationGroupsPanel`, and `CampaignsPanel` already contain useful function UI.
The least risky path is to compose them into destination pages, adding new shell and
overview/customer placeholders where needed.

**Alternatives considered**:

- Rewrite all panels at once. Rejected because it increases scope without being
  necessary to validate the admin navigation model.
- Keep `OpsPanel` as the only operations destination. Rejected because catalog,
  orders, automation groups, and campaigns must become separately reachable.
