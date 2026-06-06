# E2E Smoke Tests

WebdriverIO smoke tests that launch the app, verify the workspace opens, and navigate both menus
(Dashboard + Atendentes). One spec drives two layers — only the launch differs.

| Command | Layer | Platform |
|---------|-------|----------|
| `pnpm test:e2e` | render-layer (served app, headless Chrome) | any dev OS |
| `pnpm test:e2e:native` | native desktop window via `tauri-driver` | Windows only (skips elsewhere) |

Full details, prerequisites, and env overrides: see
[specs/009-e2e-smoke-test/quickstart.md](../specs/009-e2e-smoke-test/quickstart.md).

```text
e2e/
├── wdio.shared.conf.ts     # shared base (mocha, reporter, specs glob, timeouts)
├── wdio.web.conf.ts        # web caps + dev-server start/stop
├── wdio.native.conf.ts     # Windows: tauri-driver + native binary capability
├── run-native.ts           # platform-guarded entry for the native run
├── specs/smoke.e2e.ts      # the shared open + navigate-both spec
├── pageobjects/workspace.page.ts
└── support/{devServer.ts, tauriDriver.ts, platform.ts}
```

Not wired into `pnpm ci` (deferred by design); unit (`pnpm test`) and mutation (`pnpm test:mutation`)
gates are unaffected.
