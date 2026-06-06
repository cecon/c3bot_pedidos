# Quickstart: Premium Admin UX Shell

## Run

```bash
pnpm install            # no new deps expected
pnpm api                # local API on :3922 (separate terminal)
pnpm dev:vite           # Vite on :3920  (or `pnpm dev` to run both)
```

Open http://localhost:3920. The workspace opens in **dark** mode by default (Principle V).

## Validate per user story

**US1 — Collapsible sidebar (P1, MVP)**
1. Click the menu toggle in the header → sidebar collapses to an icon-only rail; content widens.
2. Hover a rail icon → its label shows as a tooltip; the active item stays marked.
3. With the catalog section active, hover its icon → sub-pages (Cadastro/Grupos/Produtos) appear as
   a flyout and navigate correctly.
4. Reload → sidebar reopens collapsed (state restored).

**US2 — Appearance customization (P2)**
1. Open the appearance drawer (gear). Change **density** → spacing/control sizes update instantly.
2. Change **primary** and **secondary** colors → accents/active states/buttons update instantly.
3. Change **radius**, **shadow**, **font** → all apply live; reload → all three persisted.
4. Set **color mode = auto** → follows OS theme; **dark** remains the first-run default.
5. Set **container = boxed** and **header = static** → layout honors both across pages.

**US3 — Complete header (P3)**
1. Navigate to a sub-page → breadcrumb shows `Catálogo › Produtos`.
2. Open global search (header control or hotkey), type a section name → matches list; Enter/click
   navigates. Empty query lists all; no match shows an empty state.
3. Open notifications → items with unread indication (or "no notifications" empty state).
4. Open the user menu → account actions shown (mock; no real auth).

**US4 — Tokens + building blocks (P4)**
1. Confirm an existing page (e.g., Dashboard) migrated to `PageContainer`/`StatWidget`/`DashboardCard`
   looks consistent and behaves identically (same data, same actions).
2. Change a token in `themeTokens.ts` → the change propagates wherever that token is used.

## Gates (run before marking ready)

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm max-lines
pnpm test:mutation     # density/shadow/radius/breadcrumb/search resolvers ≥85% break
pnpm build
```

## Notes

- No SQLite / Rust / API changes — frontend-only.
- Preferences persist under localStorage key `c3bot-theme-settings` (superset of the previous
  `primary/radius/font`); existing users keep their values.
- Fonts are self-hosted `woff2` (no CDN, no `@fontsource`); global search uses a custom modal (no
  `@mantine/spotlight`) — zero new runtime dependencies.
