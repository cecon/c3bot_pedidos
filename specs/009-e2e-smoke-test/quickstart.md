# Quickstart: Smoke E2E — Launch & Navigate

**Feature**: 009-e2e-smoke-test

## Render-layer smoke (any dev OS, incl. macOS)

```bash
pnpm install
pnpm test:e2e
```

What it does: spawns the served app (attendant API on `:3922` + Vite on `:3920` via the existing
`pnpm dev` orchestration), waits for the workspace, then asserts the app opens and both menus
(Dashboard, Atendentes) render. Headless by default; non-zero exit on failure.

Fast local iteration against an already-running `pnpm dev`:

```bash
# terminal 1
pnpm dev
# terminal 2
E2E_BASE_URL=http://localhost:3920 E2E_NO_SERVER=1 pnpm test:e2e
```

## Native-shell smoke (Windows only)

Prerequisites (one-time on the Windows machine):

```powershell
# Rust + Tauri build prereqs already set up for `pnpm tauri build`
cargo install tauri-driver --locked
# msedgedriver matching the installed WebView2/Edge build (npm helper or manual download)
pnpm add -D edgedriver
```

Run:

```powershell
pnpm tauri build            # produces src-tauri/target/release/c3bot.exe (C3Bot)
pnpm test:e2e:native        # tauri-driver -> msedgedriver -> native window; runs the same spec
```

On a non-Windows host, `pnpm test:e2e:native` prints "native smoke skipped — Windows only" and exits
`0` (the render-layer smoke remains the cross-platform gate).

## Files this feature adds

```text
e2e/
├── wdio.shared.conf.ts     # specs, mocha, reporters, timeouts (shared)
├── wdio.web.conf.ts        # web caps + dev-server start/stop
├── wdio.native.conf.ts     # Windows: tauri-driver service + native caps
├── specs/smoke.e2e.ts      # the shared open + navigate-both spec
├── pageobjects/workspace.page.ts
└── support/{devServer.ts, platform.ts}
```

Plus `data-testid` hooks on the shell + two panels (see contracts/ui-handles.md), and
`test:e2e` / `test:e2e:native` scripts in `package.json`.

## Notes

- Unit/mutation gates are unchanged: `pnpm test` (Vitest) and `pnpm test:mutation` (Stryker) still
  cover the domain. This E2E layer is additive and is NOT wired into CI yet (deferred by decision).
- The smoke asserts panels *render*; it does not seed or assert attendant records.
