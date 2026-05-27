import { spawnSync } from "node:child_process";

const args = [
  "--from",
  "git+https://github.com/github/spec-kit.git",
  "specify",
  ...process.argv.slice(2),
];

const result = spawnSync("uvx", args, {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PYTHONUTF8: "1",
    PYTHONIOENCODING: "utf-8",
    NO_COLOR: process.env.NO_COLOR ?? "1",
  },
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 0);
