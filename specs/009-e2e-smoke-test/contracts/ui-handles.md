# UI Handle Contract: Smoke selectors

**Feature**: 009-e2e-smoke-test

The smoke spec depends on these stable handles. Items marked **(add)** are light groundwork this
feature introduces; the rest already exist in the app today (verified in source).

## Readiness & shell

| Purpose | Selector | Source today |
|---------|----------|--------------|
| App-opened signal / shell root | `[data-testid="app-shell"]` **(add)** | wrap `AdminShell` root `div` ([src/components/AdminShell.tsx](../../../src/components/AdminShell.tsx)) |
| Primary navigation | `nav[aria-label="Navegação principal"]` | exists — [SidebarNav.tsx](../../../src/components/SidebarNav.tsx) |
| Header | `header` containing `h1` | exists — [AppHeader.tsx](../../../src/components/AppHeader.tsx) |
| Content region | `main` | exists — [AdminShell.tsx](../../../src/components/AdminShell.tsx) |

## Navigation triggers

| Destination | Selector | Active marker |
|-------------|----------|---------------|
| Dashboard | `button[aria-label="Dashboard"]` | `aria-current="page"` when active |
| Atendentes | `button[aria-label="Atendentes"]` | `aria-current="page"` when active |

(Labels come from `NAVIGATION_DESTINATIONS` in [src/domain/navigation.ts](../../../src/domain/navigation.ts).)

## Panel render assertions

| Panel | Primary handle | Secondary (copy) assertion |
|-------|----------------|----------------------------|
| Dashboard | `[data-testid="panel-dashboard"]` **(add)** on `DashboardPanel` root | text "Bem-vindo ao C3Bot"; stat "Atendentes ativos" |
| Attendants | `[data-testid="panel-attendants"]` **(add)** on `AttendantsPanel` root | `h2` "Atendentes"; button "Adicionar atendente" |

## Header title ↔ destination

| Active destination | `header h1` text |
|--------------------|------------------|
| Dashboard | `Dashboard` |
| Attendants | `Atendentes` |

> Selectors are identical for the web and native layers because the Tauri WebView2 window renders the
> same DOM as the browser — this is what lets one spec serve both (FR-013).
