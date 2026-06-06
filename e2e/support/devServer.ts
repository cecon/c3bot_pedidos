import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";

// Starts/stops the served app for the render-layer smoke (US1/US2). Reuses the project's existing
// dev orchestration (scripts/dev-with-api.mjs → attendant API :3922 + Vite :3920) and tears it down
// on completion so the harness leaves no orphaned processes/ports (FR-009).

export interface DevServerHandle {
  stop(): Promise<void>;
}

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: "GET" });
      // Any HTTP answer (even a 404) means the server is accepting connections.
      if (res.status < 500) return;
    } catch {
      // not up yet — keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Dev server did not become ready at ${url} within ${timeoutMs}ms`);
}

function stopChild(child: ChildProcess): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.pid === undefined) {
      resolve();
      return;
    }
    child.once("exit", () => resolve());
    try {
      if (process.platform === "win32") {
        child.kill();
      } else {
        // dev-with-api.mjs forwards SIGTERM to its api+vite children; kill the whole group.
        process.kill(-child.pid, "SIGTERM");
      }
    } catch {
      resolve();
      return;
    }
    // Hard backstop if graceful shutdown stalls.
    setTimeout(() => {
      try {
        if (child.pid && !child.killed) process.kill(-child.pid, "SIGKILL");
      } catch {
        // already gone
      }
      resolve();
    }, 4000);
  });
}

export async function startDevServer(baseUrl: string, readyTimeoutMs = 90000): Promise<DevServerHandle> {
  const script = path.resolve(process.cwd(), "scripts/dev-with-api.mjs");
  const child = spawn(process.execPath, [script], {
    stdio: "inherit",
    detached: process.platform !== "win32",
    env: { ...process.env },
  });

  try {
    await waitForServer(baseUrl, readyTimeoutMs);
  } catch (err) {
    await stopChild(child);
    throw err;
  }

  return { stop: () => stopChild(child) };
}
