# Implementation Plan: Premium Admin UX Shell

**Branch**: `007-admin-ux-shell` | **Date**: 2026-06-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-admin-ux-shell/spec.md`

## Summary

Elevate the existing dark operator workspace to a premium admin template by **extending what already
exists** — not rebuilding. Four independent slices: (US1) a collapsible sidebar with icon-only rail,
tooltips, and a flyout for the catalog sub-pages, persisted locally; (US2) an expanded appearance
panel adding secondary/semantic colors, font family, content density, radius presets, shadow depth,
color mode (light/dark/auto), header position, and container width — all live and persisted; (US3) a
complete header with menu toggle, breadcrumb, global search, notifications menu, and user menu; (US4)
a centralized token source (`themeTokens.ts`) plus reusable building blocks (PageContainer,
StatWidget, DashboardCard, DataTable) adopted by existing pages without behavior change. Pure
resolver functions (density/shadow/radius/breadcrumb/search) carry unit + StrykerJS mutation
coverage; everything else is presentational components driven by the existing
`ThemeSettingsProvider` (Context + localStorage) and hash navigation. **No new runtime dependencies;
dark stays the default.**

## Technical Context

**Language/Version**: TypeScript 5.8, React 19.

**Primary Dependencies**: Mantine 9 (+ form/hooks/notifications), `@tabler/icons-react` (existing
icon shim in `src/components/icons.ts`), Vite 7, Vitest 4 + Testing Library, StrykerJS 9. **No new
runtime dependencies** — global search is built on Mantine `Modal`/`TextInput` (not
`@mantine/spotlight`); fonts are self-hosted `woff2` via `@font-face` (no `@fontsource` npm package).

**Storage**: Browser `localStorage` for appearance preferences (existing key
`c3bot-theme-settings`), extended with the new fields. No SQLite/schema changes.

**Testing**: Vitest unit tests for pure resolvers (density/shadow/radius/breadcrumb/search) +
component tests (Testing Library) for each new presentational component; StrykerJS mutation (≥85%
break) on the new pure rules. Gates: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm max-lines`,
`pnpm test:mutation`, `pnpm build`.

**Target Platform**: Tauri desktop (Windows-first) + Vite browser validation (`dev:vite` :3920,
local API :3922). Responsive desktop/tablet.

**Project Type**: Local-first desktop admin (single project; `src/` frontend + `src-tauri/` shell +
`scripts/` local API). This feature is **frontend-only** — no Rust or API changes.

**Performance Goals**: Appearance changes apply < 1s (SC-002); global search to any section in ≤ 3
actions (SC-004); no perceptible layout jank on sidebar toggle.

**Constraints**: Dark default (Principle V); no new runtime deps / no new state or routing mechanism
(Principle II, FR-017); presentational components hold no IO; preferences flow via Context/props;
max 300 useful lines per file; no header/nav/content overlap at common widths (FR-018); keyboard +
accessible names on all new controls (FR-019).

**Scale/Scope**: ~12 new/extended presentational components, ~5 new pure resolvers, one extended
settings store, one token module, self-hosted fonts (5 families, curated weights), CSS variable
additions. ~10 existing pages may adopt the new building blocks (US4) without behavior change.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-Driven Product Slices | spec → plan → tasks precede code; US1–US4 independently testable; US1 (collapsible sidebar) is the MVP slice. | PASS |
| II. Local-First Desktop Stack | Mantine/React/TS only; **no new runtime deps** (custom search, self-hosted fonts); reuses Context+localStorage and hash navigation. Preferences persist locally. | PASS |
| III. Session Security and Privacy | No session tokens/credentials/PII involved; notifications/user menu are mock presentational data, nothing logged. | PASS |
| IV. Test and Mutation Gates | New shared rules (density/shadow/radius resolution, breadcrumb, search filter) are pure functions with unit tests + StrykerJS 85% break. | PASS |
| V. Operator-Grade Dark UX | Dark remains default; opens directly into the workspace; dense, keyboard-friendly; light/auto are options, no marketing page, no preset themes. | PASS |

**Result**: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/007-admin-ux-shell/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (AppearanceSettings shape + resolvers)
├── quickstart.md        # Phase 1 output (run/validate per user story)
├── contracts/
│   └── ux-shell-contract.md   # Settings schema, pure-resolver signatures, component prop contracts
├── checklists/requirements.md
└── tasks.md             # /speckit-tasks output (not created here)
```

### Source Code (repository root)

```text
src/
├── theme/
│   ├── themeTokens.ts            # NEW: single source — colors/typography/radius/shadows/spacing/breakpoints
│   ├── appearance.ts             # NEW: AppearanceSettings type + DEFAULTS + load/save/merge (migration-safe)
│   └── resolvers/
│       ├── density.ts            # NEW pure: resolveDensity(density) → spacing/fontSize/size tokens
│       ├── shadow.ts             # NEW pure: resolveShadow(level) → --app-shadow-* values
│       ├── radius.ts             # NEW pure: resolveRadius(preset) → radius px
│       └── *.test.ts             # unit + mutation-covered
├── theme.ts                      # EXTEND: buildTheme consumes themeTokens + secondary/semantic overrides
├── themePalettes.ts              # REUSE: PRIMARY_OPTIONS, makeScale
├── domain/
│   └── navigation.ts             # EXTEND: buildBreadcrumb(destination, subPageId), searchDestinations(query)
│   └── navigation.test.ts        # EXTEND: breadcrumb + search (pure, mutation-covered)
├── components/
│   ├── ThemeSettingsProvider.tsx # EXTEND: hold full AppearanceSettings; apply CSS vars + data-attrs
│   ├── ThemeSettingsDrawer.tsx   # EXTEND: sectioned drawer (Appearance/Colors/Typography/Layout/Borders/Shadows)
│   ├── AdminShell.tsx            # EXTEND: sidebar width var, header position, container width data-attrs
│   ├── AppHeader.tsx             # EXTEND: menu toggle + Breadcrumbs + GlobalSearch + NotificationMenu + UserMenu
│   ├── SidebarNav.tsx            # EXTEND: collapsed rail (icons + tooltips); catalog submenu flyout when collapsed
│   ├── Breadcrumbs.tsx           # NEW presentational
│   ├── GlobalSearch.tsx          # NEW presentational (Modal + filtered list)
│   ├── NotificationMenu.tsx      # NEW presentational (mock data via props)
│   ├── UserMenu.tsx              # NEW presentational (mock)
│   ├── PageContainer.tsx         # NEW: title + breadcrumb + responsive body
│   ├── StatWidget.tsx            # NEW: evolution of Metric.tsx
│   ├── DashboardCard.tsx         # NEW
│   ├── DataTable.tsx             # NEW: Mantine Table wrapper (pattern from AttendantsTable)
│   └── *.test.tsx                # component tests
└── styles/
    ├── sidebar-nav.css           # EXTEND: collapsed-rail rules (--app-sidebar-width)
    ├── shell.css                 # NEW (or extend styles.css): header position, container width, shadow vars
    └── fonts/                    # NEW: self-hosted woff2 + @font-face (Inter/Poppins/Roboto/Open Sans/Montserrat)
```

**Structure Decision**: Single local-first desktop project (mirrors features 005/006). Pure visual
rules live in `src/theme/resolvers/*` and `src/domain/navigation.ts` for unit/mutation testing; the
shell, header, sidebar, drawer, and building blocks are thin presentational components driven by the
existing `ThemeSettingsProvider`. To respect the 300-useful-line limit, the drawer is split by
section and CSS is split across `sidebar-nav.css` / `shell.css` rather than growing `styles.css`.

## Complexity Tracking

No constitution violations; section intentionally empty.
