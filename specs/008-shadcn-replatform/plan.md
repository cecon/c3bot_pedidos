# Implementation Plan: Minimal shadcn/ui Base — Dashboard + Attendants

**Branch**: `008-shadcn-replatform` | **Date**: 2026-06-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-shadcn-replatform/spec.md`

## Summary

Tear the admin down to a clean minimal base on the constitution-v2.0.0 stack — **Tailwind CSS +
shadcn/ui (Radix, in-repo) + TanStack Table + Lucide** — removing Mantine. Keep only two screens:
**Dashboard** (simplified) and **Atendentes** (the attendant registry, with its local persistence
intact). Remove every other menu/page and their components, and remove the database schemas,
migrations, API endpoints, and domain modules for every domain **except attendants** (drop catalog
feature 005 and merchant feature 006; keep the attendant table + migration `002` + the migration
runner). Theme via CSS variables, class light/dark/auto, dark default, persisted locally; sidebar
collapsible; header kept lean. Hash navigation reduced to two destinations. Pure attendant domain
rules and their tests are preserved; other domain tests are removed with their domains; component
tests are rewritten for the shadcn/Radix DOM. This is a deliberate "start from zero" base.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19; Rust 2021 (shell unchanged).

**Primary Dependencies**: **ADD** — Tailwind CSS + PostCSS/autoprefixer, `tailwind-merge`,
`class-variance-authority`, Radix primitives (`@radix-ui/react-*` as needed), `@tanstack/react-table`,
`lucide-react` (`clsx` already present). **REMOVE** — `@mantine/core`, `@mantine/form`,
`@mantine/hooks`, `@mantine/notifications`, `@tabler/icons-react`, `postcss-preset-mantine`. Keep:
Vite 7, React 19, Drizzle + Tauri SQL plugin (for attendants only), Vitest 4 + Testing Library,
StrykerJS 9. Drop `swagger-ui-dist` (API docs page removed).

**Storage**: SQLite via the existing migration runner, **trimmed to the attendant table only**
(keep `001_init` base + `002_delivery_attendants`; delete `003_product_catalog`,
`004_merchant_registry`). Appearance preferences in localStorage.

**Testing**: Preserve attendant pure-rule tests (`src/domain/attendants*`, `attendantPersistence*`)
and the attendant repository tests. Remove catalog/merchant domain + API tests with their code.
Rewrite component tests for the shadcn/Radix DOM. StrykerJS ≥85% on the remaining pure rules. Gates:
`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm max-lines`, `pnpm test:mutation`, `pnpm build`,
`cargo check`.

**Target Platform**: Tauri desktop + Vite (:3920) with the attendant API (`scripts/attendant-api.ts`,
:3922). Responsive desktop/tablet.

**Project Type**: Local-first desktop admin (single project). Frontend-heavy; deletes unused
backend/API/migration code.

**Performance Goals**: Appearance changes < 1s; attendant list renders instantly for typical volumes.

**Constraints**: Dark default via CSS variables (Principle V); approved stack only (Principle II);
preserve attendant behavior/data (FR-005/006); presentational components hold no IO; ≤300 useful
lines/file; keyboard + accessible names; no header/nav/content overlap.

**Scale/Scope**: Final app ≈ shell + 2 pages + shadcn primitives. Large deletion: ~30+ page/feature
components, catalog+merchant DB/API/domain, 2 migrations, related tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Gate | Status |
|-----------|------|--------|
| I. Spec-Driven Product Slices | spec → plan → tasks; US1–US4 independently testable; US1 (minimal shell) is the MVP. | PASS |
| II. Local-First Desktop Stack | Tailwind + shadcn/ui (Radix) + TanStack + Lucide on Vite/React/TS/Tauri/SQLite; Mantine removed; attendant data persists locally. | PASS |
| III. Session Security and Privacy | No tokens/PII added; removing unused domains reduces surface; attendant data handling unchanged. | PASS |
| IV. Test and Mutation Gates | Kept attendant pure rules retain tests + StrykerJS ≥85%; removed domains' tests go with their code; component tests rewritten. | PASS |
| V. Operator-Grade Dark UX | Dark default via CSS variables; opens into the workspace; dense, keyboard-friendly. | PASS |

**Result**: No violations. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/008-shadcn-replatform/
├── plan.md  research.md  data-model.md  quickstart.md
├── contracts/ui-contract.md
├── checklists/requirements.md
└── tasks.md   # /speckit-tasks output
```

### Source Code — KEEP / ADD / REMOVE

```text
KEEP (attendants + shell foundations):
  src/domain/attendants.ts, attendants.test.ts, attendantPersistence.ts (+test), navigation.ts (trimmed), types.ts (trimmed)
  src/services/attendantRepository*.ts (+tests), attendantRestRepository*.ts, database.ts
  scripts/attendant-api.ts ; scripts/api/{db,http,errors}.ts (only what attendants needs)
  src-tauri/migrations/001_init.sql, 002_delivery_attendants.sql ; migration runner (migrations.rs, scripts/migrations.ts trimmed)
  src/db/{client,schema(trimmed),tauriSqlProxy}.ts

ADD (new stack):
  src/lib/utils.ts (cn) ; tailwind.config.ts ; postcss config (tailwind/autoprefixer)
  src/components/ui/* (button,input,label,card,dialog,dropdown-menu,tooltip,sheet,table,badge,
    select,switch,tabs,scroll-area,separator,toast,data-table)
  src/theme/themeTokens.ts ; global CSS with Tailwind + CSS-variable tokens (light/dark)
  src/components: AdminShell, SidebarNav (collapsible), AppHeader, ThemeProvider, ThemeDrawer,
    DashboardPanel (simplified), AttendantsPanel + AttendantForm + AvailabilityControl (rebuilt)

REMOVE (trimmed domains, pages, db, api):
  src/db/{catalogSchema,merchantSchema,pizzaSchema}.ts ; src/domain/{catalog,merchant}/**
  src/services/{catalogApi,merchantApi,pizzaConfigSync*}.ts
  scripts/api/{catalogs,categories,combos,docs,hours,interruptions,items,mapping,merchant,
    merchantStatus,openapi*,openingHours,optionGroups,pizza,products,router,store}.ts
  src-tauri/migrations/003_product_catalog.sql, 004_merchant_registry.sql (+ runner registrations)
  src/components: Session/Chat, Catalog*, Orders, Customers, Merchant*, Automation*, Campaigns,
    OpsPanel, ApiDocsPanel, Combo/Option/Pizza/Product/Item editors, Shift/Weekly/Interruptions, etc.
  mockData entries for removed domains ; Mantine + @tabler deps + postcss-preset-mantine + swagger-ui-dist
```

**Structure Decision**: Single project. shadcn primitives in `src/components/ui/*` (copyable). The
shell + Dashboard + Attendants are rebuilt on them; tables use one `data-table.tsx` TanStack wrapper.
The attendant domain/persistence/migration/API stay; catalog (005) and merchant (006) are deleted
wholesale. `navigation.ts` is trimmed to two destinations and its catalog sub-pages removed. Large
panels are split to respect the 300-line limit.

## Complexity Tracking

No constitution violations; section intentionally empty.
