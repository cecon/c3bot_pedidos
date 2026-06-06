# Phase 1 Data Model: Minimal shadcn/ui Base

The only persisted domain entity is **Attendant**. The rest is appearance preferences (local) and a
keep/remove inventory.

## Attendant (persisted — UNCHANGED shape)

Stored via the existing migration `002_delivery_attendants` and the attendant repository/API. Fields,
validation, and availability semantics are preserved exactly as today (no schema change). Only its
presentation (table + form) is rebuilt on shadcn/TanStack.

## AppearanceSettings (persisted, localStorage)

| Field | Type | Default |
|-------|------|---------|
| `colorMode` | `"light" \| "dark" \| "auto"` | `"dark"` |
| `primaryColor` | token name | brand blue |
| `secondaryColor` | token name | slate |
| `semantic` | `{ success; warning; danger; info }` | from `themeTokens` |
| `fontFamily` | family key | `"inter"` |
| `density` | `"compact" \| "normal" \| "comfortable"` | `"normal"` |
| `radiusPreset` | `"sm" \| "md" \| "lg"` | `"md"` |
| `sidebarCollapsed` | `boolean` | `false` |

Migration-safe load (merge over defaults; fall back per field).

## themeTokens.ts

Single source mapped to shadcn CSS variables (background/foreground/primary/secondary/muted/accent/
destructive/border/ring + semantic status), typography (font stacks, sizes per density), radius
(sm/md/lg), spacing (per density), breakpoints. Feeds `tailwind.config.ts` + provider defaults.

## Keep / Remove inventory

**KEEP**
- Domain: `attendants.ts`(+test), `attendantPersistence.ts`(+test), `navigation.ts` (trimmed to 2),
  `types.ts` (trimmed to attendant + appearance + nav types).
- Services: `attendantRepository*`, `attendantRestRepository*`, `database.ts`.
- API/DB: `scripts/attendant-api.ts`; `scripts/api/{db,http,errors}.ts` (shared helpers still used);
  `src/db/{client,schema(trimmed),tauriSqlProxy}.ts`; migrations `001_init`, `002_delivery_attendants`
  + runner (`src-tauri/src/migrations.rs`, `scripts/migrations.ts`) trimmed to those.

**REMOVE**
- Domain: `src/domain/catalog/**`, `src/domain/merchant/**`, `catalogPersistence*`, `analytics*` if
  only used by removed dashboards (re-check; keep if Dashboard reuses it for attendant stats).
- Services: `catalogApi.ts`, `merchantApi.ts`, `pizzaConfigSync*`.
- API: `scripts/api/{catalogs,categories,combos,docs,hours,interruptions,items,mapping,merchant,
  merchantStatus,openapi*,openingHours,optionGroups,pizza,products,router,store}.ts`.
- DB: `src/db/{catalogSchema,merchantSchema,pizzaSchema}.ts`; migrations `003`, `004`.
- Components: Session/Chat, Catalog* (Workspace/Manager/Tree/ItemsPanel/Panel/MappingReview),
  Orders, Customers, Merchant* (Workspace/Panel), OpsPanel, ApiDocsPanel, Product/Item/Option/Combo/
  Pizza editors, Shift/Weekly/Interruptions editors, Metric (replaced by StatWidget).
- mockData entries for removed domains; deps: `@mantine/*`, `@tabler/icons-react`,
  `postcss-preset-mantine`, `swagger-ui-dist`.

## Final navigation

Two destinations only: **Dashboard** (`#/dashboard`, default) and **Atendentes**
(`#/attendants`/existing path). Catalog sub-pages and all other destinations removed. A hash to a
removed page resolves to Dashboard.
