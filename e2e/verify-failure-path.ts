import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { AddressInfo } from "node:net";
import path from "node:path";

// Negative-path verification for the smoke gate (SC-004 + SC-005). Runs the SAME web config twice
// with the app deliberately broken and asserts the suite fails as specified:
//   A) app never renders  -> non-zero exit + "did not open"            (SC-004)
//   B) shell renders, panels missing -> non-zero exit + "did not render" naming the destination (SC-005)
// This run is meant to FAIL the smoke; we pass only when it fails for the RIGHT reasons.

interface ScenarioResult {
  status: number;
  output: string;
}

function runSmoke(extraEnv: Record<string, string>): ScenarioResult {
  const result = spawnSync("wdio", ["run", "e2e/wdio.web.conf.ts"], {
    env: { ...process.env, E2E_NO_SERVER: "1", ...extraEnv },
    encoding: "utf8",
    shell: true,
  });
  return { status: result.status ?? 0, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

const checks: Array<{ name: string; ok: boolean; detail: string }> = [];

// Scenario A — app never opens.
const a = runSmoke({ E2E_OPEN_URL: "about:blank", E2E_READY_TIMEOUT_MS: "4000", E2E_PANEL_TIMEOUT_MS: "2000" });
checks.push({
  name: "SC-004 did-not-open",
  ok: a.status !== 0 && /did not open/i.test(a.output),
  detail: `exit=${a.status}, "did not open" present=${/did not open/i.test(a.output)}`,
});

// Scenario B — shell renders but panels are absent: serve the shell-only fixture.
const fixture = readFileSync(path.resolve("e2e/fixtures/shell-no-panels.html"), "utf8");
const server = createServer((_req, res) => {
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.end(fixture);
});
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
const { port } = server.address() as AddressInfo;

const b = runSmoke({
  E2E_OPEN_URL: `http://127.0.0.1:${port}/`,
  E2E_READY_TIMEOUT_MS: "8000",
  E2E_PANEL_TIMEOUT_MS: "3000",
});
server.close();
checks.push({
  name: "SC-005 did-not-render-names-destination",
  ok: b.status !== 0 && /did not render/i.test(b.output) && /Dashboard/.test(b.output),
  detail: `exit=${b.status}, "did not render" present=${/did not render/i.test(b.output)}, names Dashboard=${/Dashboard/.test(b.output)}`,
});

let allOk = true;
for (const c of checks) {
  console.log(`${c.ok ? "✓" : "✗"} ${c.name} — ${c.detail}`);
  allOk = allOk && c.ok;
}

if (!allOk) {
  console.error("\nFailure-path verification did NOT behave as specified.\n--- scenario A ---\n", a.output, "\n--- scenario B ---\n", b.output);
  process.exit(1);
}

console.log("\n✓ Failure-path verified: smoke fails correctly for SC-004 and SC-005.");
process.exit(0);
