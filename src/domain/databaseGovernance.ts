export const DATABASE_GOVERNANCE_ADR_PATH = "docs/adr/0001-database-access-and-migrations.md";
export const REQUIRED_DATABASE_SCRIPTS = ["db:generate", "db:check"] as const;
export const REQUIRED_ADR_TERMS = ["Drizzle ORM", "drizzle-kit generate", "pnpm db:generate", "pnpm db:check"] as const;

export type DatabaseScriptName = (typeof REQUIRED_DATABASE_SCRIPTS)[number];

export function findMissingDatabaseScripts(scripts: Record<string, string | undefined>): DatabaseScriptName[] {
  return REQUIRED_DATABASE_SCRIPTS.filter((scriptName) => !scripts[scriptName]);
}

export function hasMigrationGenerationCommand(scripts: Record<string, string | undefined>): boolean {
  return String(scripts["db:generate"] ?? "").includes("drizzle-kit generate");
}

export function hasGovernanceCheckCommand(scripts: Record<string, string | undefined>): boolean {
  return String(scripts["db:check"] ?? "").includes("check-db-governance.mjs");
}

export function findMissingAdrTerms(adrText: string): string[] {
  return REQUIRED_ADR_TERMS.filter((term) => !adrText.includes(term));
}

export function isAllowedDirectSqlPath(filePath: string): boolean {
  return filePath.split("\\").join("/") === "src/db/tauriSqlProxy.ts";
}
