# Phase 0 Research: Minimal shadcn/ui Base — Dashboard + Attendants

Decisions honor constitution v2.0.0 (Tailwind + shadcn/ui + TanStack + Lucide; Mantine removed),
Tauri desktop, dark default, attendant-only persistence, ≤300 useful lines/file.

## R1 — Tailwind + Vite

- **Decision**: Tailwind via PostCSS in Vite; replace `postcss-preset-mantine` with `tailwindcss` +
  `autoprefixer`. `tailwind.config.ts` with `darkMode: "class"`, content over `src/**/*.{ts,tsx}`,
  and shadcn token→Tailwind color mapping.
- **Rationale**: Minimal build change; class dark mode matches CSS-variable theming.

## R2 — shadcn components in-repo

- **Decision**: Copy shadcn components manually into `src/components/ui/*`; add `src/lib/utils.ts`
  `cn()` (clsx + tailwind-merge), `class-variance-authority`, and the needed `@radix-ui/react-*`.
  For a 2-page app the set is small: button, input, label, card, dialog, dropdown-menu, tooltip,
  sheet, table, badge, select, switch, tabs, scroll-area, separator, toast, data-table.
- **Rationale**: Copyable/adjustable (FR-012); no generator/network assumptions.

## R3 — Theming (light/dark/auto) + tokens

- **Decision**: shadcn CSS variables on `:root`/`.dark`; provider toggles `dark` on `<html>` and
  writes overrides (primary/secondary/semantic/radius/density) as inline variables; `auto` follows
  `prefers-color-scheme`; dark default; persisted in localStorage. `themeTokens.ts` is the single
  source feeding Tailwind config + provider defaults.
- **Rationale**: Standard shadcn theming; live updates; satisfies FR-004 + Principle V.

## R4 — Replacing Mantine non-visual utilities

- **Decision**: Forms → controlled state + small validation helpers (attendant form is simple, no
  form library). Notifications → shadcn Radix Toast (`toast()` helper). Hooks → tiny local hooks /
  native handlers. Icons → `src/components/icons.ts` re-exports **Lucide** under existing local names
  so kept call sites barely change.
- **Rationale**: Keeps new deps minimal; icon shim localizes the swap.

## R5 — Attendants table with TanStack

- **Decision**: One `src/components/ui/data-table.tsx` wrapping `@tanstack/react-table` + shadcn
  `table.tsx`: columns, sorting, empty state, row-actions slot. The Attendants list adopts it.
- **Rationale**: FR-007; headless TanStack composes with shadcn markup.

## R6 — What persistence to keep

- **Decision**: Keep the migration runner and **only** the attendant table: migrations `001_init`
  (base) + `002_delivery_attendants`; delete `003_product_catalog` and `004_merchant_registry` and
  unregister them in `migrations.rs` / `scripts/migrations.ts`. Keep `scripts/attendant-api.ts` and
  the attendant repository/services + `src/db/{client,schema(trimmed),tauriSqlProxy}`. Delete
  `scripts/api/*` (catalog/merchant router) except shared `db/http/errors` helpers still used by the
  attendant API. Verify `001_init` contents and keep only what the attendant table needs.
- **Rationale**: Implements "keep only attendant persistence"; preserves existing attendant data.
- **Alternatives rejected**: Remove all DB (would drop attendant persistence — user chose to keep it);
  keep all migrations (contradicts the trim).

## R7 — Header scope for a 2-page app

- **Decision**: Keep the header lean: sidebar toggle + logo + color-mode toggle + theme settings
  control (+ existing DB/health indicator if still meaningful). **Global search and breadcrumb are
  unnecessary** with only two destinations and are out of scope for this minimal base (a notifications/
  user menu can be a later, mock-only addition). Sidebar still collapsible.
- **Rationale**: Premium-UX header from 007 was sized for ~12 sections; with two it adds noise.
- **Alternatives rejected**: Full breadcrumb/search/notifications header (over-built for 2 pages).

## R8 — Tests

- **Decision**: Preserve attendant pure-rule + repository tests. Remove catalog/merchant domain/API
  tests with their code. Rewrite the shell + Dashboard + Attendants component tests for the
  shadcn/Radix DOM (query by role/name). StrykerJS ≥85% on remaining pure rules.
- **Rationale**: Honors Principle IV without freezing on brittle DOM.

## R9 — Teardown sequencing (keep the branch buildable)

- **Decision**: (US1) stand up Tailwind/shadcn + shell + theme, switch `main.tsx`/`App.tsx` off the
  Mantine provider, trim `navigation.ts` to two destinations; (US2) rebuild Attendants on shadcn +
  TanStack with persistence intact; (US3) rebuild the simplified Dashboard; (US4) delete all other
  pages/components, the catalog/merchant DB/API/migrations/domain, and the Mantine/Tabler/
  swagger deps, then green the full gate suite (`grep -r "@mantine|@tabler" src` returns nothing).
- **Rationale**: App builds at each checkpoint; ends at the clean minimal base.

## Open questions

None blocking. Confirm `001_init.sql` does not create now-removed tables that violate "only attendant
data persists"; if it does, trim it during US4.
