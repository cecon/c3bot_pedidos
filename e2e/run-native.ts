import { spawnSync } from "node:child_process";
import { skipUnlessWindows } from "./support/platform";

// Entry point for `pnpm test:e2e:native`. Skips cleanly (exit 0) on non-Windows hosts (FR-014),
// otherwise hands off to WebdriverIO with the native config.

skipUnlessWindows();

const result = spawnSync("wdio", ["run", "e2e/wdio.native.conf.ts"], {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status ?? 1);
