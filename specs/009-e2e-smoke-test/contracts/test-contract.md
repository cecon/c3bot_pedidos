# Test Contract: Smoke — Launch & Navigate

**Feature**: 009-e2e-smoke-test

The contract for this feature is the **observable behavior of the smoke runs** and the **commands**
that invoke them. It is satisfied when both runs behave as specified below.

## Commands (CLI surface)

| Command | Layer | Platform | Behavior |
|---------|-------|----------|----------|
| `pnpm test:e2e` | render-layer (web) | any dev OS | Starts the served app, runs the shared smoke spec headless, exits non-zero on failure. |
| `pnpm test:e2e:native` | native shell | Windows only | Launches the built desktop window via tauri-driver, runs the same spec; on non-Windows prints "skipped — Windows only" and exits `0`. |

- Both commands are independently invocable; `test:e2e` MUST NOT require the native binary (FR-015).
- Both produce a non-zero exit code on assertion/launch failure suitable as a gate (FR-008, SC-006).

## Shared smoke scenario (runs identically on both layers)

```gherkin
Scenario: App opens and both menus are reachable
  Given the smoke target is launched
  When I wait for the workspace shell up to the ready timeout
  Then the shell is visible (navigation + header + content region)        # US1 / FR-003
   And the navigation exposes exactly the destinations Dashboard and Atendentes

  When I activate the "Dashboard" navigation item
  Then the Dashboard panel is visible with its distinguishing content     # US2 / FR-005
   And the header title reads "Dashboard"

  When I activate the "Atendentes" navigation item
  Then the Attendants panel is visible with its distinguishing content    # US2 / FR-006
   And the header title reads "Atendentes"
```

## Failure contract

| Condition | Required outcome |
|-----------|------------------|
| Workspace shell not visible within ready timeout | Fail with a message stating the app did not open (FR-004, SC-004). |
| A panel does not render / errors on mount | Fail naming the affected destination (FR-007, SC-005). |
| Navigation target unreachable | Fail naming the destination (FR-007). |
| Native run on non-Windows host | Skip with clear message, exit `0` (FR-014, SC-008). |

## Non-functional contract

- Readiness uses a bounded wait, never a fixed sleep (FR-002).
- Selectors use the stable handles in [ui-handles.md](./ui-handles.md) (FR-010).
- The harness leaves no orphaned processes/ports after completion (FR-009).
- A full render-layer run completes in under 60s on a typical dev machine (FR-011, SC-003).
