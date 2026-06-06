# Phase 0 Research: Premium Admin UX Shell

All decisions honor: no new runtime dependencies, dark-first, reuse Context+localStorage and hash
navigation, ≤300 useful lines/file, pure rules mutation-tested.

## R1 — Font delivery (Inter/Poppins/Roboto/Open Sans/Montserrat)

- **Decision**: Self-host curated `woff2` files under `src/styles/fonts/` and declare them with
  `@font-face` in a dedicated CSS file. Limit to 2–3 weights per family (400/500/700). The selected
  family is applied by setting `--mantine-font-family` / `--app-font-family` at runtime (existing
  mechanism in `ThemeSettingsProvider`).
- **Rationale**: Keeps local-first (no CDN), adds **zero npm dependencies** (avoids `@fontsource/*`),
  and reuses the CSS-variable font swap already in place. Inter is already the base.
- **Alternatives rejected**: `@fontsource/*` (new packages, conflicts with "no new deps"); Google
  Fonts CDN (violates local-first); system-only stacks (cannot reliably render Poppins/Montserrat).

## R2 — Global search (jump-to-section)

- **Decision**: Build a small `GlobalSearch` modal from Mantine `Modal` + `TextInput` + a filtered
  list, backed by a pure `searchDestinations(query, destinations)` function over the existing
  `NAVIGATION_DESTINATIONS` (and catalog sub-pages). Selecting an item navigates via the existing
  hash mechanism. Open via header control and a keyboard shortcut (`@mantine/hooks` `useHotkeys`,
  already available).
- **Rationale**: No new dependency (`@mantine/spotlight` would be new); reuses navigation as the
  single source of truth; the filter is a pure, mutation-testable rule.
- **Alternatives rejected**: `@mantine/spotlight` (new dep); ad-hoc inline filtering in the
  component (not unit-testable).

## R3 — Color mode light/dark/auto

- **Decision**: Use Mantine's color scheme manager: `setColorScheme('light'|'dark'|'auto')` via
  `useMantineColorScheme`. `MantineProvider` keeps `defaultColorScheme="dark"`. Persist the chosen
  mode in the appearance store; on load, re-apply. `auto` defers to system (`prefers-color-scheme`).
- **Rationale**: Native Mantine capability, already partially used; CSS variables in `styles.css`
  already branch on `:root[data-mantine-color-scheme="light|dark"]`. Dark stays default (FR-008).
- **Alternatives rejected**: Custom media-query handling (Mantine already does it correctly).

## R4 — Density, radius, shadow application

- **Decision**: Three pure resolvers return token maps applied as CSS variables on
  `document.documentElement` plus Mantine theme inputs:
  - `resolveDensity(compact|normal|comfortable)` → spacing scale + base font size + control size
    (drives `--app-density-*` and Mantine `spacing`/`fontSizes` via `buildTheme`).
  - `resolveRadius(sm|md|lg)` → px (drives existing `--app-radius` + Mantine `defaultRadius`).
  - `resolveShadow(none|soft|medium|strong)` → `--app-shadow-sm/md/lg` strings, consumed by
    `.mantine-Paper-root`/`.mantine-Card-root` and the shell.
- **Rationale**: Pure functions are unit + mutation testable (Principle IV); CSS variables give live
  updates with no re-render cost; reuses the existing `--app-*` convention.
- **Alternatives rejected**: Hardcoding values in the drawer component (untestable, duplicated);
  per-component style props (does not scale, fails the live-update + token goals).

## R5 — Collapsible sidebar + flyout submenu

- **Decision**: A `sidebarCollapsed` boolean in the appearance store toggles
  `--app-sidebar-width` (≈248px ↔ ≈64px) via a `data-collapsed` attribute on the shell. Collapsed
  items show label tooltips (existing `Tooltip` wrapper). The catalog submenu, which renders inline
  when expanded, renders as a Mantine `Menu`/hover-card **flyout** when collapsed so sub-pages stay
  reachable. Toggle control lives in the header (reused by US3).
- **Rationale**: Minimal change to `SidebarNav.tsx` + `sidebar-nav.css`; no router/layout library;
  preserves active-state marking (FR-003).
- **Alternatives rejected**: A separate collapsed sidebar component (duplication, divergence);
  Mantine `AppShell` navbar collapse (would re-architect the working custom shell).

## R6 — Secondary + semantic colors

- **Decision**: Extend `buildTheme` to accept `secondary` and optional semantic overrides
  (success/warning/danger/info), seeded from `themeTokens.ts` defaults and overridable via the store.
  Reuse `makeScale`/`tablerColors` from `themePalettes.ts`. Expose pickers in the drawer using the
  existing `PRIMARY_OPTIONS`.
- **Rationale**: `theme.ts` already defines semantic palettes and a `brand` (primary) mapping; this
  generalizes it. No new color system.
- **Alternatives rejected**: Free-form hex inputs (harder to keep contrast/legible per FR/edge case;
  can be a later enhancement); a second color framework (unnecessary).

## R7 — Layout: header fixed/static, container full/boxed

- **Decision**: Store `headerPosition` and `containerWidth`; apply as `data-app-header` /
  `data-app-container` attributes on the shell root, with CSS rules in `shell.css` (sticky vs static
  header; centered max-width vs full-bleed content). Reuses the existing `.admin-content` max-width.
- **Rationale**: Pure CSS toggles, no JS layout math; consistent across pages (FR FR-005/Scenario 5).
- **Alternatives rejected**: Conditional inline styles per page (inconsistent, not centralized).

## R8 — Persistence & migration safety

- **Decision**: `appearance.ts` defines `AppearanceSettings`, `DEFAULT_APPEARANCE`, and a
  migration-safe `loadAppearance()` that deep-merges stored JSON over defaults (missing/malformed
  keys fall back; unknown keys ignored). `saveAppearance()` writes on change. Keep the existing
  localStorage key `c3bot-theme-settings` (superset of today's `primary/radius/font`).
- **Rationale**: Satisfies the malformed/older-version edge case and FR-007/SC-003 without a new
  store; backward compatible with the current three settings.
- **Alternatives rejected**: New storage key (loses existing users' primary/radius/font); Zustand
  (new dep, FR-017).

## Open questions

None — all spec assumptions resolved. Ready for Phase 1 design artifacts.
