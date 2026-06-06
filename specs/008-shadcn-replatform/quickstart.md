# Quickstart: Minimal shadcn/ui Base — Dashboard + Attendants

## Run

```bash
pnpm install            # adds Tailwind + Radix + TanStack + Lucide; Mantine removed by US4
pnpm api                # attendant API on :3922 (separate terminal)
pnpm dev:vite           # Vite on :3920  (or `pnpm dev` for both)
```

Open http://localhost:3920 — dark mode, two nav items only.

## Validate per user story

**US1 — Minimal shell (P1, MVP)**
1. Only **Dashboard** and **Atendentes** appear in the nav; nothing else; no Mantine in the shell.
2. Toggle the sidebar → icon rail + tooltips; reload → state restored.
3. Switch color mode (light/dark/auto) / change a token → applies live, persists on reload.

**US2 — Attendants (P2)**
1. Create/edit an attendant → saved; still present after reload (persistence kept).
2. List renders in a TanStack `DataTable` (sorting, row actions, empty state); availability not by
   color alone.
3. Toggle availability and delete behave as before.

**US3 — Dashboard (P3)**
1. Dashboard renders on shadcn with attendant-derived stats and no references to removed domains.

**US4 — Trim + cleanup (P4)**
1. `grep -r "@mantine" src` and `grep -r "@tabler" src` → no matches.
2. Only `001_init` + `002_delivery_attendants` migrations remain; `003`/`004` gone and unregistered.
3. No catalog/merchant pages, components, schemas, API routes, or domain modules remain.
4. Full gate suite green.

## Gates

```bash
pnpm lint
pnpm typecheck
pnpm test            # attendant pure-rule/repo tests kept; component tests rewritten for shadcn/Radix
pnpm max-lines
pnpm test:mutation   # remaining pure rules ≥85% break
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
```

## Notes

- Only attendant data persists (SQLite via migration `002`); appearance prefs in localStorage.
- shadcn components in `src/components/ui/` (copyable); tables via `data-table.tsx` (TanStack).
- Icons via `src/components/icons.ts` re-exporting Lucide under existing names.
- Deleted code (catalog/merchant/other pages) is recoverable from git history.
