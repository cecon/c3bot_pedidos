import { spawn } from "node:child_process";
import path from "node:path";

const apiPort = process.env.C3BOT_API_PORT ?? "3922";
const apiBaseUrl = process.env.VITE_C3BOT_API_BASE_URL ?? `http://localhost:${apiPort}`;
const viteCliPath = path.resolve("node_modules/vite/bin/vite.js");

const children = [
  start("api", ["--import", "tsx", "scripts/attendant-api.ts"], {
    ...process.env,
    C3BOT_API_PORT: apiPort,
  }),
  start("vite", [viteCliPath], {
    ...process.env,
    VITE_C3BOT_API_BASE_URL: apiBaseUrl,
  }),
];

let shuttingDown = false;

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => stopAll(0));
}

function start(name, args, env) {
  const child = spawn(process.execPath, args, { env, stdio: ["ignore", "pipe", "pipe"] });

  child.stdout.on("data", (chunk) => writePrefixed(name, chunk));
  child.stderr.on("data", (chunk) => writePrefixed(name, chunk));
  child.on("exit", (code) => {
    if (!shuttingDown) stopAll(code ?? 1);
  });

  return child;
}

function writePrefixed(name, chunk) {
  for (const line of chunk.toString().split(/\r?\n/)) {
    if (line) process.stdout.write(`[${name}] ${line}\n`);
  }
}

function stopAll(exitCode) {
  if (shuttingDown) return;

  shuttingDown = true;

  const aliveChildren = children.filter((child) => child.exitCode === null && !child.killed);
  if (aliveChildren.length === 0) {
    process.exit(exitCode);
    return;
  }

  let remaining = aliveChildren.length;
  const forceExit = setTimeout(() => process.exit(exitCode), 2000);

  for (const child of aliveChildren) {
    child.once("exit", () => {
      remaining -= 1;
      if (remaining === 0) {
        clearTimeout(forceExit);
        process.exit(exitCode);
      }
    });

    child.kill();
  }
}

process.on("exit", () => {
  for (const child of children) {
    if (child.exitCode === null && !child.killed) child.kill();
  }
});
