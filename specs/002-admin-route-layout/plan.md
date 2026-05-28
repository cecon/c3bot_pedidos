# Implementation Plan: Admin Route Layout

**Branch**: `002-admin-route-layout` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-admin-route-layout/spec.md`

## Summary

Reorganize the current single-window workspace into a focused admin layout. The
implementation will introduce a persistent shell with sidebar navigation, header
context, and route-driven workspace sections for dashboard, sessions/chat, catalog,
orders, customers, automation groups, campaigns, and settings. Existing mock data,
domain helpers, and panel behavior remain available, but each function becomes its
own primary destination instead of living inside one crowded grid.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19, Rust 2021 edition

**Primary Dependencies**: Existing Tauri 2, Vite 7, Mantine 9, Lucide React,
Vitest 4, and StrykerJS 9. No new routing package is required for the first slice.

**Storage**: No schema change. Workspace navigation state is in-memory and local to
the desktop session; existing SQLite-backed data remains unchanged.

**Testing**: Vitest unit tests for route resolution, destination metadata, and
context-safe navigation helpers; StrykerJS mutation testing extended to the new
navigation helper alongside existing domain coverage.

**Target Platform**: Windows desktop first through Tauri; Vite dev server remains
usable for browser validation.

**Project Type**: Desktop application with frontend route shell.

**Performance Goals**: Switching between primary workspace sections presents focused
content in under 1 second during local use; the first workspace render remains under
2 seconds after startup on a typical office workstation.

**Constraints**: No landing page; dark operator UI; no all-primary-modules screen by
default; route destinations must work inside Tauri without server-side routing;
header, menu, and content text must not overlap at common desktop sizes.

**Scale/Scope**: Initial navigation supports 8 primary destinations, grouped into
daily operations and administration/configuration, with room for future modules.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec-first traceability: PASS. Spec and checklist exist under
  `specs/002-admin-route-layout/`; this plan adds research, data model, contracts,
  and quickstart before implementation.
- Stack boundary: PASS. The plan keeps Tauri 2, Vite, React, TypeScript, Mantine,
  Rust, and SQLite. It avoids adding a routing dependency for the first slice.
- Privacy boundary: PASS. The feature reorganizes UI navigation and does not change
  credential, session token, password, or customer PII handling.
- Quality gate: PASS. Navigation route rules will be isolated in a tested helper and
  included in mutation coverage because routing is shared workflow behavior.
- Operator UX: PASS. The first screen remains an operational workspace with dark
  admin navigation and focused function pages, not a marketing or onboarding page.

## Project Structure

### Documentation (this feature)

```text
specs/002-admin-route-layout/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── admin-navigation-contract.md
│   └── workspace-section-contract.md
├── checklists/
│   └── requirements.md
└── spec.md
```

### Source Code (repository root)

```text
src/
├── App.tsx
├── styles.css
├── components/
│   ├── AdminShell.tsx
│   ├── AppHeader.tsx
│   ├── SidebarNav.tsx
│   ├── DashboardPanel.tsx
│   ├── CustomersPanel.tsx
│   └── existing feature panels...
├── domain/
│   ├── analytics.ts
│   ├── analytics.test.ts
│   ├── navigation.ts
│   ├── navigation.test.ts
│   ├── mockData.ts
│   └── types.ts
└── ui/
    └── status.ts

stryker.config.json
```

**Structure Decision**: Keep the existing single Tauri/Vite app. Add a small
navigation domain helper for route metadata and resolution, because it is shared
workflow behavior and needs unit/mutation coverage. Add shell components under
`src/components/` to match the current component layout without introducing a new app
folder or framework. Split currently tabbed operational content into focused pages
while reusing existing panels where possible.

## Complexity Tracking

No constitution violations are required for this implementation.

## Phase 0 Research Summary

The route model will use local hash-style workspace destinations such as
`#/dashboard`, `#/sessions`, and `#/orders`. This gives direct destinations inside
Tauri and Vite without server rewrite configuration or a new dependency. The route
catalog will be a typed, tested helper so active destination, fallback behavior, menu
grouping, and labels stay consistent across sidebar and header.

## Phase 1 Design Summary

The admin shell owns persistent layout regions: sidebar navigation, header, and main
content. Workspace pages own page-specific actions and focused content. `App.tsx`
continues to own mock workspace state for this slice so switching sections preserves
selected session, filters, and in-progress values during the desktop session.
