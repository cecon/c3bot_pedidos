# UX Shell Contract: Domain / Settings / Component

Authoritative interface contract for feature 007. Pure rules and the settings API are the testable
core; components are presentational (no IO) and receive data + callbacks via props.

## 1. Settings API — `src/theme/appearance.ts`

```ts
export interface AppearanceSettings {
  primaryColor: string;
  secondaryColor: string;
  semantic: { success: string; warning: string; danger: string; info: string };
  fontFamily: "inter" | "poppins" | "roboto" | "openSans" | "montserrat";
  density: "compact" | "normal" | "comfortable";
  radiusPreset: "sm" | "md" | "lg";
  shadow: "none" | "soft" | "medium" | "strong";
  colorMode: "light" | "dark" | "auto";
  headerPosition: "fixed" | "static";
  containerWidth: "full" | "boxed";
  sidebarCollapsed: boolean;
}

export const DEFAULT_APPEARANCE: AppearanceSettings;        // dark, expanded, boxed, soft, md, inter
export function loadAppearance(raw: string | null): AppearanceSettings;  // migration-safe merge
export function serializeAppearance(s: AppearanceSettings): string;      // JSON.stringify
```

**Contract**: `loadAppearance(null)` returns `DEFAULT_APPEARANCE`. Unknown/malformed/out-of-enum
fields fall back per-field. Legacy `{ primary, radius, font }` maps into the new shape with no loss.

## 2. Pure resolvers — `src/theme/resolvers/*`

```ts
export function resolveDensity(d: AppearanceSettings["density"]):
  { spacingScale: number; baseFontSize: string; controlSize: "xs"|"sm"|"md" };
export function resolveRadius(p: AppearanceSettings["radiusPreset"]): number;     // px
export function resolveShadow(l: AppearanceSettings["shadow"]):
  { sm: string; md: string; lg: string };
```

**Contract**: total functions (every enum value returns a defined result); deterministic; no IO.
Mutation target ≥85%.

## 3. Navigation rules — `src/domain/navigation.ts` (extends existing)

```ts
export interface Crumb { label: string; path: `#/${string}` }
export function buildBreadcrumb(
  destination: NavigationDestination, subPageId?: CatalogSubPageId,
): Crumb[];

export interface SearchHit { label: string; path: `#/${string}`; group: string }
export function searchDestinations(
  query: string,
  destinations?: readonly NavigationDestination[],
  subPages?: readonly NavigationSubDestination[],
): SearchHit[];
```

**Contract**: `buildBreadcrumb` always starts at the destination; appends the sub-page when present.
`searchDestinations("")` → all primary destinations; no match → `[]`; matching is
case/diacritics-insensitive over label.

## 4. Settings context — `ThemeSettingsProvider` (extends existing)

```ts
useThemeSettings(): {
  settings: AppearanceSettings;
  update<K extends keyof AppearanceSettings>(key: K, value: AppearanceSettings[K]): void;
};
```

**Contract**: `update` persists immediately and applies CSS variables + `data-*` attributes +
Mantine color scheme live (no reload). Provider applies all settings on mount from `loadAppearance`.

## 5. Component prop contracts (presentational, no IO)

```ts
// Shell already receives header + navigation slots; add layout flags from settings.
AdminShell: { /* existing */ activeDestination; header; navigation; children; fallbackMessage? }

AppHeader: {
  activeDestination; activeSubPageId?;
  onToggleSidebar(): void; sidebarCollapsed: boolean;
  destinations; onNavigate(id): void;                 // for GlobalSearch
  notifications: NotificationItem[];
  sessionCounts; onVerifyDatabase(): void;            // existing
}

SidebarNav: { /* existing */ collapsed: boolean; /* renders rail + tooltips + submenu flyout */ }

Breadcrumbs: { items: Crumb[]; onNavigate(path): void }
GlobalSearch: { opened: boolean; onClose(): void; destinations; subPages; onNavigate(path): void }
NotificationMenu: { items: NotificationItem[] }       // shows unread count + empty state
UserMenu: { name: string; items: UserMenuItem[] }
PageContainer: { title: string; breadcrumb?: Crumb[]; actions?: ReactNode; children: ReactNode }
StatWidget: { icon: ReactNode; label: string; value: string | number; hint?: string; color?: string }
DashboardCard: { title?: string; actions?: ReactNode; children: ReactNode }
DataTable<T>: { columns: { key; header; render? }[]; rows: T[]; empty?: ReactNode }
```

**Contract**: every interactive control is keyboard-operable and has an accessible name (FR-019);
status is never conveyed by color alone; components contain no fetch/localStorage/global access.

## 6. CSS variable / attribute contract

| Token / attr | Source | Consumed by |
|--------------|--------|-------------|
| `--app-sidebar-width` | `sidebarCollapsed` | `.sidebar-nav`, `.admin-main` |
| `--app-radius` | `resolveRadius` | Paper/Card/buttons |
| `--app-shadow-sm/md/lg` | `resolveShadow` | Paper/Card/shell |
| `--app-density-*`, `--app-font-family` | `resolveDensity`, `fontFamily` | global |
| `data-collapsed` | `sidebarCollapsed` | shell/sidebar CSS |
| `data-app-header` (`fixed`/`static`) | `headerPosition` | `.app-header` |
| `data-app-container` (`full`/`boxed`) | `containerWidth` | `.admin-content` |
| `data-mantine-color-scheme` | `colorMode` (Mantine) | light/dark variable branches |
