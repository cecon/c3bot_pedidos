# UI Contract: Minimal shadcn/ui Base

Authoritative interface contract for feature 008 (rescoped to Dashboard + Attendants). Domain layer
for attendants is unchanged; this governs the new UI primitives, theming, the table wrapper, and the
shell/page prop contracts.

## 1. Utility
```ts
// src/lib/utils.ts
export function cn(...inputs: ClassValue[]): string; // clsx + tailwind-merge
```

## 2. Theme tokens & CSS variables (shadcn)
`:root` (light) + `.dark` (dark), overridable at runtime:
```
--background --foreground --card(-foreground) --popover(-foreground)
--primary(-foreground) --secondary(-foreground) --muted(-foreground) --accent(-foreground)
--destructive(-foreground) --border --input --ring --radius
/* app */ --app-sidebar-width --app-success --app-warning --app-info
```
Dark default (`<html class="dark">`); `colorMode="auto"` follows `prefers-color-scheme`; no hardcoded
colors in primitives.

## 3. Appearance provider
```ts
useAppearance(): {
  settings: AppearanceSettings;
  update<K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]): void;
};
```
`update` writes the `dark` class + CSS-variable overrides live and persists to localStorage; provider
applies stored settings (migration-safe) on mount.

## 4. shadcn primitives (src/components/ui/)
Standard Radix-backed shadcn APIs, copyable/adjustable, keyboard-accessible:
```
Button({variant,size,asChild}) Input Label Textarea
Card/CardHeader/CardTitle/CardContent/CardFooter
Dialog Sheet Tooltip DropdownMenu Select Switch Tabs Badge Separator ScrollArea
Toast + Toaster + toast()   // replaces Mantine notifications
```

## 5. DataTable (TanStack wrapper)
```ts
interface DataTableColumn<T> { id: string; header: ReactNode; cell(row: T): ReactNode; sortable?: boolean }
interface DataTableProps<T> { columns: DataTableColumn<T>[]; data: T[]; empty?: ReactNode; getRowId?(r: T): string }
```
Renders shadcn `table.tsx`; sorting via TanStack core; shows `empty` when `data.length === 0`.

## 6. Shell + page prop contracts (lean — 2-page app)
```ts
AdminShell:  { activeDestination; header; navigation; children }
SidebarNav:  { activeDestinationId; destinations /* exactly Dashboard + Atendentes */;
               collapsed: boolean; onNavigate }
AppHeader:   { activeDestination; sidebarCollapsed; onToggleSidebar }   // + color-mode + theme controls
ThemeDrawer: {}                       // reads/writes via useAppearance
DashboardPanel: { attendantStats }    // simplified; no removed-domain data
AttendantsPanel: { attendants; persistenceState; onCreate; onUpdate; onDelete; onSetAvailability }
```
Note: breadcrumb, global search, notifications, and user menu are **out of scope** for the minimal
base (header stays lean for two destinations).

## 7. Icon shim
```ts
// src/components/icons.ts — re-export Lucide under existing local names so kept call sites are stable
export { Activity, Users, UserCheck, Settings2 as Settings, /* … */ } from "lucide-react";
```

## 8. Parity / teardown contract (non-negotiable)
- Attendant flows (list/create/edit/availability/delete) and persistence are unchanged in behavior.
- After US4: only Dashboard + Atendentes exist; only attendant data persists;
  `grep -r "@mantine" src` and `grep -r "@tabler" src` return nothing; catalog (005) + merchant (006)
  schemas/migrations/API/domain are deleted.
- Status never by color alone; all controls keyboard-operable with accessible names.
