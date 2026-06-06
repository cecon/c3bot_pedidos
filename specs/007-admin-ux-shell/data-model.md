# Phase 1 Data Model: Premium Admin UX Shell

This feature has **no database**. The "data" is the locally-persisted appearance preference object
and a few presentational mock structures. All shapes below are TypeScript-level only.

## AppearanceSettings (persisted, localStorage key `c3bot-theme-settings`)

Superset of today's `{ primary, radius, font }` (backward compatible).

| Field            | Type                                             | Default        | Notes |
|------------------|--------------------------------------------------|----------------|-------|
| `primaryColor`   | Tabler color name (`PRIMARY_OPTIONS`)            | `"blue"`       | existing `primary` |
| `secondaryColor` | Tabler color name                                | `"gray"`       | new; accents/secondary buttons |
| `semantic`       | `{ success; warning; danger; info }` color names | from tokens    | new; overrides defaults in `theme.ts` |
| `fontFamily`     | `"inter"\|"poppins"\|"roboto"\|"openSans"\|"montserrat"` | `"inter"` | maps to `@font-face` stack |
| `density`        | `"compact"\|"normal"\|"comfortable"`             | `"normal"`     | new |
| `radiusPreset`   | `"sm"\|"md"\|"lg"`                                | `"md"`         | replaces raw `radius` number |
| `shadow`         | `"none"\|"soft"\|"medium"\|"strong"`             | `"soft"`       | new |
| `colorMode`      | `"light"\|"dark"\|"auto"`                         | `"dark"`       | Principle V default dark |
| `headerPosition` | `"fixed"\|"static"`                              | `"fixed"`      | new |
| `containerWidth` | `"full"\|"boxed"`                                | `"boxed"`      | maps to `.admin-content` max-width |
| `sidebarCollapsed` | `boolean`                                      | `false`        | new (US1) |

**Validation / loading rules**
- `loadAppearance()` deep-merges parsed JSON over `DEFAULT_APPEARANCE`; any missing, unknown-typed,
  or out-of-enum value falls back to its default (edge case: malformed/older version).
- Legacy keys (`radius: number`) map to the nearest `radiusPreset`; legacy `font` maps to
  `fontFamily`. No data loss for existing users.
- `saveAppearance(settings)` persists the full object on every change.

## Pure resolvers (mutation-tested) — `src/theme/resolvers/*`

| Function | Input → Output | Applied as |
|----------|----------------|-----------|
| `resolveDensity(density)` | density → `{ spacingScale, baseFontSize, controlSize }` | `--app-density-*` vars + `buildTheme` spacing/fontSizes |
| `resolveRadius(preset)` | preset → `number` (px) | `--app-radius` + Mantine `defaultRadius` |
| `resolveShadow(level)` | level → `{ sm, md, lg }` CSS shadow strings | `--app-shadow-sm/md/lg` |

## Navigation-derived pure rules — `src/domain/navigation.ts`

| Function | Input → Output | Used by |
|----------|----------------|---------|
| `buildBreadcrumb(destination, subPageId?)` | → ordered `{ label, path }[]` | `Breadcrumbs` |
| `searchDestinations(query, destinations, subPages?)` | → ranked `{ label, path, group }[]` | `GlobalSearch` |

Rules: case/accent-insensitive match; empty query → all top-level destinations; no match → `[]`
(drives the empty state); catalog sub-pages included as `Catálogo › <sub>`.

## Presentational mock structures (no persistence)

- **NotificationItem**: `{ id; title; description; timestamp; read: boolean }` — supplied via props
  (mock list); drives `NotificationMenu` and its unread badge / empty state.
- **UserMenuItem**: `{ label; icon; onSelect }` — static action list for `UserMenu` (no auth).

## Token source — `src/theme/themeTokens.ts`

Single export consumed by `buildTheme` and `DEFAULT_APPEARANCE`:
`{ colors (primary/secondary/semantic + dark surfaces), typography (font stacks, fontSizes),
radius (sm/md/lg), shadows (none/soft/medium/strong), spacing (per density), breakpoints }`.
No new values invented where `theme.ts`/`themePalettes.ts` already define them — those are imported
and re-exported through the token module so there is one source of truth.
