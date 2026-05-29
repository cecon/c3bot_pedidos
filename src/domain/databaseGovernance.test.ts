import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import {
  DATABASE_GOVERNANCE_ADR_PATH,
  findMissingAdrTerms,
  findMissingDatabaseScripts,
  hasGovernanceCheckCommand,
  hasMigrationGenerationCommand,
  isAllowedDirectSqlPath,
} from "./databaseGovernance";

describe("database governance rules", () => {
  it("requires database generation and check scripts", () => {
    expect(findMissingDatabaseScripts(packageJson.scripts)).toEqual([]);
    expect(hasMigrationGenerationCommand(packageJson.scripts)).toBe(true);
    expect(hasGovernanceCheckCommand(packageJson.scripts)).toBe(true);
  });

  it("keeps the ADR discoverable with required migration command terms", () => {
    const adr = readFileSync(DATABASE_GOVERNANCE_ADR_PATH, "utf8");

    expect(findMissingAdrTerms(adr)).toEqual([]);
  });

  it("limits direct SQL to the approved proxy boundary", () => {
    expect(isAllowedDirectSqlPath("src/db/tauriSqlProxy.ts")).toBe(true);
    expect(isAllowedDirectSqlPath("src/services/attendantRepository.ts")).toBe(false);
  });
});
