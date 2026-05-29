import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_ROOT = process.cwd();
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx"]);
const ALLOWED_SQL_PATHS = new Set([
  normalizePath("src/db/tauriSqlProxy.ts"),
  normalizePath("src/services/database.ts"),
]);

export function checkDatabaseGovernance(root = DEFAULT_ROOT) {
  const failures = [
    ...checkRequiredFiles(root),
    ...checkPackageScripts(root),
    ...checkAdr(root),
    ...checkDirectSql(root),
  ];

  return { ok: failures.length === 0, failures };
}

export function checkRequiredFiles(root) {
  return [
    "docs/adr/0001-database-access-and-migrations.md",
    "drizzle.config.ts",
    "src/db/schema.ts",
  ].flatMap((filePath) =>
    existsSync(path.join(root, filePath)) ? [] : [`Missing required database governance file: ${filePath}`],
  );
}

export function checkPackageScripts(root) {
  const packageJsonPath = path.join(root, "package.json");
  if (!existsSync(packageJsonPath)) return ["Missing package.json for database script check."];

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const scripts = packageJson.scripts ?? {};
  const failures = [];

  if (!String(scripts["db:generate"] ?? "").includes("drizzle-kit generate")) {
    failures.push("package.json must define db:generate with drizzle-kit generate.");
  }
  if (!String(scripts["db:check"] ?? "").includes("check-db-governance.mjs")) {
    failures.push("package.json must define db:check with scripts/check-db-governance.mjs.");
  }

  return failures;
}

export function checkAdr(root) {
  const adrPath = path.join(root, "docs/adr/0001-database-access-and-migrations.md");
  if (!existsSync(adrPath)) return ["Missing ADR 0001 for database governance."];

  const adr = readFileSync(adrPath, "utf8");
  const required = ["Drizzle ORM", "drizzle-kit generate", "pnpm db:generate", "pnpm db:check"];

  return required.flatMap((text) => (adr.includes(text) ? [] : [`ADR 0001 must mention ${text}.`]));
}

export function checkDirectSql(root) {
  const sourceRoot = path.join(root, "src");
  if (!existsSync(sourceRoot)) return [];

  return walk(sourceRoot)
    .filter((filePath) => SOURCE_EXTENSIONS.has(path.extname(filePath)))
    .filter((filePath) => !filePath.endsWith(".test.ts") && !filePath.endsWith(".test.tsx"))
    .flatMap((filePath) => findDirectSqlFailures(root, filePath));
}

function findDirectSqlFailures(root, filePath) {
  const relativePath = normalizePath(path.relative(root, filePath));
  if (ALLOWED_SQL_PATHS.has(relativePath)) return [];

  const source = readFileSync(filePath, "utf8");
  const failures = [];

  if (source.includes("@tauri-apps/plugin-sql")) {
    failures.push(`${relativePath} imports the Tauri SQL plugin outside the approved database boundary.`);
  }
  if (/`\s*(SELECT\b|INSERT\s+INTO\b|UPDATE\s+\w+|DELETE\s+FROM\b|ALTER\s+TABLE\b|CREATE\s+(TABLE|INDEX|UNIQUE)\b)/i.test(source)) {
    failures.push(`${relativePath} contains raw SQL outside the approved database boundary.`);
  }

  return failures;
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "node_modules" ? [] : walk(fullPath);
    return [fullPath];
  });
}

function normalizePath(filePath) {
  return filePath.split(path.sep).join("/");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const result = checkDatabaseGovernance(process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_ROOT);

  if (!result.ok) {
    console.error("Database governance check failed:");
    for (const failure of result.failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log("Database governance check passed.");
}
