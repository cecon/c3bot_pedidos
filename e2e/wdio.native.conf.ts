import path from "node:path";
import { sharedConfig } from "./wdio.shared.conf";
import { startTauriDriver, stopTauriDriver } from "./support/tauriDriver";

// Native-shell smoke (US3): drives the REAL built desktop window via tauri-driver. Windows only —
// the `test:e2e:native` script guards the platform before this config is ever loaded (FR-014).
// Runs the same spec as the web layer; only the launch mechanism differs (FR-013).

process.env.E2E_LAYER = "native";

const appBinary =
  process.env.E2E_NATIVE_BINARY ??
  path.resolve(process.cwd(), "src-tauri", "target", "release", "c3bot.exe");

export const config: WebdriverIO.Config = {
  ...sharedConfig,

  // tauri-driver listens here and proxies to the native WebView2 driver.
  hostname: "127.0.0.1",
  port: 4444,
  path: "/",

  capabilities: [
    {
      // tauri-driver launches and attaches to this binary.
      "tauri:options": { application: appBinary },
    } as WebdriverIO.Capabilities,
  ],

  async onPrepare() {
    await startTauriDriver();
  },

  onComplete() {
    stopTauriDriver();
  },
};
