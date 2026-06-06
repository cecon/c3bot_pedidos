# Feature Specification: End-to-End Smoke Test — Launch & Navigate

**Feature Branch**: `009-e2e-smoke-test`

**Created**: 2026-06-06

**Status**: Draft

**Input**: User description: "preciso implementar um test fim a fim, pensei em usar o playright, mas como é tauri, nao sei se conseguimos tipo rodar o tauri e testar via html, ou se vc tem alguma outra sugestão, no momento apenas abriar e verificar se abriu e navegar nos 2 menus"

## User Scenarios & Testing *(mandatory)*

This feature delivers an automated **smoke test**: a fast, repeatable check that the admin
application starts and its two destinations are reachable. It is a confidence gate, not an
exhaustive functional suite. The first story is the MVP — proving the app opens at all — and the
second adds navigation coverage across both menus. Both run against the rendered UI and work on any
developer platform. A third story extends the same checks to the **real native desktop window** on
**Windows**, where the desktop WebDriver tooling is supported, giving confidence in the shell + IPC +
local storage path that the render-layer check cannot exercise.

### User Story 1 - App launches and the workspace opens (Priority: P1)

As a developer (and CI), I run a single command and the application starts and renders its operator
workspace — the persistent shell (sidebar navigation + header + a content area) — rather than a
blank screen, a crash, or an error overlay.

**Why this priority**: If the app does not open, nothing else matters. This is the minimum viable
smoke test and the earliest signal that a change has broken startup. It can ship and provide value
on its own.

**Independent Test**: Start the app under automation, wait for the workspace to be ready, and assert
that the shell chrome (navigation menu with two entries, header, content region) is visible and free
of fatal startup errors. Delivers value as a standalone "does it boot?" gate.

**Acceptance Scenarios**:

1. **Given** the application is not running, **When** the smoke test starts it, **Then** the
   workspace becomes ready within a defined timeout and the shell (navigation + header + content) is
   visible.
2. **Given** the application has opened, **When** the test inspects the initial view, **Then** one of
   the two destinations is shown as the active/default view and no fatal error or empty-screen state
   is present.
3. **Given** the application fails to start or render, **When** the timeout elapses, **Then** the
   test fails with a clear message identifying the failure (did not open).

---

### User Story 2 - Both menu destinations are reachable (Priority: P2)

As a developer (and CI), the smoke test navigates to each of the two menu entries — **Dashboard** and
**Atendentes (Attendants)** — and confirms that each destination's screen renders its expected
content.

**Why this priority**: Navigation is the primary way an operator moves through the app; broken
routing or a crashing panel is a common, high-impact regression. It builds directly on US1 and
extends the boot check into a basic usability check.

**Independent Test**: With the app open, activate each menu item in turn and assert that the matching
panel becomes visible with a recognizable, content-specific landmark (e.g., the Dashboard panel and
the Attendants panel each show their own distinguishing element).

**Acceptance Scenarios**:

1. **Given** the workspace is open, **When** the test selects the Dashboard menu item, **Then** the
   Dashboard panel becomes visible with its distinguishing content and no error.
2. **Given** the workspace is open, **When** the test selects the Attendants menu item, **Then** the
   Attendants panel becomes visible with its distinguishing content and no error.
3. **Given** the test has visited both destinations, **When** the run completes, **Then** it reports
   success only if both panels rendered; otherwise it fails naming the destination that did not
   render.

---

### User Story 3 - Native desktop window smoke on Windows (Priority: P3)

As a developer working on a Windows machine, I run a command that launches the **built native desktop
application** (the real window, not a browser) and the same checks from US1 and US2 run against it:
the workspace opens and both menus (Dashboard and Attendants) are reachable.

**Why this priority**: The render-layer checks (US1/US2) prove the UI and routing, but not the native
shell, its IPC boundary, or local SQLite-backed data path that only exist in the packaged desktop
app. This story closes that gap on the one platform where the desktop WebDriver tooling works. It is
lower priority because it is slower, platform-restricted, and depends on US1/US2 existing first.

**Independent Test**: On a Windows environment, build the desktop app, drive the launched native
window through the WebDriver tooling, and assert the workspace opens and both panels render — the
same assertions as US1/US2 but against the native window.

**Acceptance Scenarios**:

1. **Given** a Windows environment with the app built, **When** the native smoke test runs, **Then**
   the desktop window launches and the workspace shell becomes visible within a bounded timeout.
2. **Given** the native window is open, **When** the test navigates to Dashboard and then Attendants,
   **Then** each panel renders its distinguishing content with no error.
3. **Given** the run finishes, **When** results are reported, **Then** it passes only if the window
   opened and both panels rendered, and the native run produces a non-zero exit status on failure.

---

### Edge Cases

- **App does not start within the timeout** → the test fails fast with an explicit "did not open"
  message rather than hanging indefinitely.
- **Workspace renders but a panel throws on mount** → navigating to that destination fails the test
  with the destination name, not a generic error.
- **Slow first render** (cold start / asset build) → the readiness check waits up to a bounded
  timeout before declaring failure, so a slow-but-successful start is not a false negative.
- **Backing data service for Attendants is unavailable** → the Attendants destination MUST still
  render its panel shell (the smoke test asserts the screen loads, not that live records are
  present); a data-fetch failure is surfaced in-panel rather than blocking navigation.
- **Stale running instance / port already in use** → the test harness either reuses a clean known
  state or fails with a clear message instead of attaching to an unknown instance.
- **Native run invoked on an unsupported platform** (e.g. macOS) → the native smoke test (US3) skips
  with a clear "not supported on this platform" message instead of hanging or failing obscurely; the
  render-layer smoke (US1/US2) remains available everywhere.
- **Native binary not built before the native run** → the harness either builds it as part of setup
  or fails fast stating the app must be built first.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a single, repeatable command that launches the application and
  runs the smoke test end to end without manual steps.
- **FR-002**: The test MUST wait for an explicit readiness signal (the workspace shell is visible)
  before asserting, using a bounded timeout rather than a fixed sleep.
- **FR-003**: The test MUST assert that, on startup, the persistent shell is present: a navigation
  menu exposing exactly the two destinations (Dashboard and Attendants), a header, and a content
  region.
- **FR-004**: The test MUST fail with a clear, actionable message when the application does not open
  within the timeout.
- **FR-005**: The test MUST navigate to the Dashboard destination and assert its panel renders a
  distinguishing, content-specific element.
- **FR-006**: The test MUST navigate to the Attendants destination and assert its panel renders a
  distinguishing, content-specific element.
- **FR-007**: The test MUST treat navigation that yields an error state, blank panel, or unmounted
  view as a failure, naming the affected destination.
- **FR-008**: The test MUST be runnable locally by a developer and MUST be CI-capable — producing a
  non-zero exit status on failure suitable as a CI gate — even though wiring it into the pipeline is
  deferred (see Assumptions).
- **FR-009**: The test MUST be self-contained: it sets up and tears down whatever it starts, leaving
  no orphaned processes or ports on completion.
- **FR-010**: The test MUST locate UI elements by stable, semantic handles (accessible roles/names
  or explicit test identifiers) rather than brittle text or layout positions, so cosmetic changes do
  not break it.
- **FR-011**: The test MUST complete a full render-layer run (launch + verify open + visit both
  menus) within a bounded, fast wall-clock budget appropriate for a smoke gate.
- **FR-012**: The system MUST provide a separate command that runs the same open + navigate-both-menus
  checks against the **built native desktop window** on Windows, driving the real application window
  rather than a browser.
- **FR-013**: The native smoke run MUST reuse the same assertions and stable element handles as the
  render-layer run (US1/US2), so the two layers stay in sync and only the launch mechanism differs.
- **FR-014**: The native smoke run MUST detect an unsupported host platform and skip with a clear
  message rather than hanging or failing obscurely, while the render-layer run stays available on all
  platforms.
- **FR-015**: The native and render-layer runs MUST be independently invocable so a developer can run
  the fast render-layer check without building the native binary.

### Key Entities *(include if feature involves data)*

- **Application workspace**: The running admin app's top-level view — the persistent shell containing
  the navigation menu, header, and content region — that the test drives.
- **Destination (menu entry)**: One of the two navigable screens (Dashboard, Attendants); each has a
  menu trigger and a panel with a recognizable landmark used as the render assertion.
- **Smoke-test run**: A single automated execution with an overall pass/fail result and per-step
  outcomes (opened, Dashboard reached, Attendants reached).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can run the smoke test with a single command and see a clear pass/fail
  result without any manual interaction.
- **SC-002**: When the application starts and both menus work, the test passes 100% of the time
  across repeated local runs (no flakiness within the defined timeout).
- **SC-003**: A full smoke run (launch → verify open → visit both menus) completes in under 60
  seconds on a typical developer machine.
- **SC-004**: When startup is broken, the test fails within the bounded timeout and the failure
  message states that the app did not open — verifiable by intentionally breaking startup.
- **SC-005**: When either destination's panel fails to render, the test fails and the message names
  that destination — verifiable by intentionally breaking one panel.
- **SC-006**: Both runs return a non-zero exit code on failure, making them suitable as an automated
  gate (whether wired into CI later or run on demand).
- **SC-007**: On a Windows environment, the native smoke run launches the real desktop window and
  verifies the app opens and both menus render — the same outcomes as US1/US2 but against the native
  window.
- **SC-008**: On a non-Windows platform, invoking the native run reports a clear "not supported here"
  result without hanging, and the render-layer run still passes.

## Assumptions

- **Scope is intentionally minimal**: only "does it open" plus "can I reach both menus." No form
  input, data mutation, persistence checks, theming, or per-field validation is in scope for this
  feature.
- **Two destinations only**: the app currently exposes exactly Dashboard and Attendants (per the
  current minimal-shell plan); the test is built around those two and will need updating if menus
  change.
- **Two layers, by design**: a cross-platform **render-layer** smoke (US1/US2) for the everyday fast
  gate, plus a **native-shell** smoke (US3) for confidence in the real desktop window. They share
  assertions and element handles; only the launch path differs.
- **Platform constraint (informs the test approach, not the spec's outcomes)**: the project's desktop
  shell uses a system webview, and the official desktop WebDriver tooling for it does not support
  macOS (the primary local dev platform here). So the render-layer smoke runs everywhere by driving
  the served web UI (the same UI the desktop shell loads), and the native-shell smoke (US3) runs on
  **Windows**, where the WebDriver tooling is supported.
- **GitHub CI is out of scope for now**: US3 targets a **local Windows environment**. Wiring either
  layer into the GitHub Actions pipeline is explicitly deferred; the runs only need to be invocable
  on demand and return a non-zero exit code on failure so CI can adopt them later without changes.
- **Attendants data dependency**: the Attendants screen has a local data backend; the smoke test
  asserts the panel renders, not that specific records exist, so it does not require seeded data. If
  the backend must be running for the panel to mount, the test harness starts it as part of setup.
- **Deterministic readiness**: the app exposes (or the test can rely on) a stable readiness signal
  and stable element handles for the shell and both panels; adding `data-testid`/accessible names
  where missing is acceptable groundwork.
- **Local environments**: the render-layer run assumes a developer machine that can run a headless
  browser/runtime plus the app's dev/build tooling; the native run (US3) assumes a Windows machine
  with the desktop build prerequisites and WebDriver tooling installed.
