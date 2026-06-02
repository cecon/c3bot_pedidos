import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { countUsefulLines, MAX_USEFUL_LINES } from "./lib/useful-lines.mjs";

const ROOTS = [".github", "scripts", "src", "src-tauri/src", "src-tauri/migrations"];
const EXTENSIONS = new Set([".cjs", ".css", ".js", ".jsx", ".mjs", ".rs", ".sql", ".ts", ".tsx", ".yml", ".yaml"]);
const SKIP_DIRS = new Set([".git", "dist", "node_modules", "reports", "target"]);

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(fullPath);
      continue;
    }

    if (EXTENSIONS.has(path.extname(entry.name))) {
      checkFile(fullPath);
    }
  }
}

function checkFile(filePath) {
  const text = readFileSync(filePath, "utf8");
  const usefulLines = countUsefulLines(text);

  if (usefulLines > MAX_USEFUL_LINES) {
    failures.push({ filePath, usefulLines });
  }
}

const failures = [];

for (const root of ROOTS) {
  walk(root);
}

if (failures.length > 0) {
  console.error(`Files above ${MAX_USEFUL_LINES} useful lines:`);
  for (const failure of failures) {
    console.error(`- ${failure.filePath}: ${failure.usefulLines}`);
  }
  process.exit(1);
}

console.log(`All checked files are within ${MAX_USEFUL_LINES} useful lines.`);
