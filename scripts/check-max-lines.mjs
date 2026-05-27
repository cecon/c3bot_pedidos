import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const MAX_USEFUL_LINES = 300;
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

function countUsefulLines(text) {
  let count = 0;
  let inBlockComment = false;

  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line) continue;

    if (inBlockComment) {
      const blockEnd = line.indexOf("*/");
      if (blockEnd === -1) continue;
      line = line.slice(blockEnd + 2).trim();
      inBlockComment = false;
      if (!line) continue;
    }

    while (line.startsWith("/*")) {
      const blockEnd = line.indexOf("*/", 2);
      if (blockEnd === -1) {
        inBlockComment = true;
        line = "";
        break;
      }
      line = line.slice(blockEnd + 2).trim();
    }

    if (!line || line.startsWith("//") || line.startsWith("#") || line.startsWith("--")) continue;
    count += 1;
  }

  return count;
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
