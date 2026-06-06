# Phase 0 Research: End-to-End Smoke Test — Launch & Navigate

**Feature**: 009-e2e-smoke-test · **Date**: 2026-06-06

## Decision 1 — Single E2E framework: WebdriverIO (both layers)

**Decision**: Use **WebdriverIO + Mocha** as the one E2E framework for both the render-layer smoke
(US1/US2) and the native-shell smoke (US3). One spec file and one page object are shared; only the
WDIO config (capabilities + launch) differs per layer.

**Rationale**:
- FR-013 requires the native run to *reuse the same assertions and element handles* as the
  render-layer run, "only the launch mechanism differs." WebdriverIO is the only choice that lets the
  **same spec** drive both a normal browser and the Tauri native window, because the native layer has
  no option other than WebdriverIO (see Decision 3). Using Playwright for web + WDIO for native would
  fork the spec into two frameworks and break the "shared assertions" requirement.
- WDIO's role/attribute locators map cleanly to the app's existing accessible names (FR-010): the nav
  buttons already expose `aria-label="Dashboard"` / `aria-label="Atendentes"`, the shell has
  `nav[aria-label="Navegação principal"]`, and the header renders an `<h1>` with the active label.
- Auto-waiting (`waitForExist`/`waitForDisplayed`) satisfies the "bounded timeout, no fixed sleep"
  requirement (FR-002).

**Alternatives considered**:
- *Playwright (web) + WebdriverIO/tauri-driver (native)*: best-in-class per layer, but duplicates the
  smoke logic in two frameworks and violates FR-013's shared-assertion intent. Rejected.
- *Playwright everywhere*: Playwright cannot drive the Tauri native WebView2 window via tauri-driver.
  Would leave US3 uncovered. Rejected.
- *Vitest + jsdom only*: already used for component tests; mounts components in a fake DOM, never
  serves the real built app over HTTP or exercises hash routing + the REST repository path. Does not
  satisfy "launch the app end to end." Kept for unit/mutation, not E2E.

## Decision 2 — Render-layer target: served app via the existing dev orchestration

**Decision**: The web smoke drives the real app served on `http://localhost:3920`, started through the
project's existing `pnpm dev` orchestration ([scripts/dev-with-api.mjs](../../scripts/dev-with-api.mjs))
which boots both the attendant REST API (`:3922`) and Vite (`:3920`). A WDIO `onPrepare` hook spawns
it and polls the URL until ready; `onComplete` tears it down (FR-009).

**Rationale**:
- Reuses tooling the team already runs; the smoke then verifies the same artifact a developer uses.
- The Attendants panel reaches its data through the REST repository in a browser context (the Tauri
  SQL plugin is absent outside the native shell), so starting the API keeps the panel realistic —
  though per the spec the test only asserts the panel *renders*, not that records exist (edge case:
  backend-unavailable still renders the panel shell).
- Headless Chrome/Edge runs everywhere the team develops (incl. macOS), keeping US1/US2 cross-platform.

**Alternatives considered**:
- *Build + `vite preview`*: tests the production bundle (closer to release) but needs a separate port
  and a second process for the API. Noted as a future hardening option; `pnpm dev` is simpler for a
  smoke gate now.
- *Point WDIO at an already-running server*: brittle and not self-contained (FR-009). Rejected as the
  default; allowed via an env flag for fast local iteration.

## Decision 3 — Native layer: WebdriverIO + tauri-driver on Windows

**Decision**: The native smoke (US3) runs **only on Windows**, using `tauri-driver` (installed via
`cargo install tauri-driver --locked`) as a WebDriver proxy in front of **msedgedriver** (Tauri on
Windows renders through the WebView2 / Edge Chromium runtime). WDIO launches the **built** desktop
binary (`pnpm tauri build`, producing `src-tauri/target/release/c3bot.exe`, productName **C3Bot**) via
a `tauri:options.application` capability. A small custom launcher service spawns/stops `tauri-driver`.

**Rationale**:
- `tauri-driver` is the official Tauri WebDriver tool. It supports **Linux** (WebKitWebDriver) and
  **Windows** (msedgedriver) but **not macOS** (WKWebView exposes no WebDriver) — which is exactly why
  the spec scopes the native layer to Windows and keeps the render layer cross-platform.
- Windows is the chosen environment per the feature decision (GitHub CI deferred). The native run
  exercises the real window, the Tauri IPC boundary, and the SQLite-backed attendant path that the
  browser layer cannot.

**Prerequisites on the Windows machine** (documented in quickstart):
- Rust toolchain + Tauri build prerequisites; WebView2 runtime (preinstalled on Win10/11).
- `cargo install tauri-driver --locked`.
- `msedgedriver` whose version matches the installed WebView2/Edge build (managed via the `edgedriver`
  npm helper or downloaded), path handed to `tauri-driver --native-driver`.

**Alternatives considered**:
- *Linux native via WebKitWebDriver + xvfb*: viable and CI-friendly later, but the team targets
  Windows now. Recorded as a future option, not implemented.
- *Spectron / Electron tooling*: wrong runtime (this is Tauri/WebView2, not Electron). Rejected.

## Decision 4 — Unsupported-platform skip (FR-014)

**Decision**: The native npm script guards on `process.platform === "win32"`. On a non-Windows host
it prints a clear "native smoke skipped — Windows only" message and exits `0`; the render-layer script
stays available and passes everywhere. The two scripts are independently invocable (FR-015): the web
smoke never requires the native binary to exist.

**Rationale**: Satisfies FR-014/FR-015 and the "native run invoked on unsupported platform" edge case
without hanging or an obscure failure. Exit `0` on skip avoids red builds on dev machines that simply
can't run the native layer.

## Decision 5 — Element handles: accessible names now, harden with `data-testid`

**Decision**: Selectors are keyed on existing **accessible roles/names** (FR-010). As light groundwork
the plan adds three stable hooks to decouple from copy: `data-testid="app-shell"` on the shell root,
`data-testid="panel-dashboard"` on the Dashboard panel root, and `data-testid="panel-attendants"` on
the Attendants panel root. The full handle list is the UI contract in `contracts/`.

**Rationale**: The app already exposes good accessible names (nav `aria-label`s, header `<h1>`, panel
headings), so the smoke can be written today. The three test ids make the panel-render assertions
robust against future copy/markup tweaks, which the spec assumptions explicitly permit.

**Alternatives considered**:
- *Text-only selectors* (e.g. matching "Bem-vindo ao C3Bot"): brittle against copy changes; violates
  the spirit of FR-010. Used only as a secondary assertion, not the primary handle.
