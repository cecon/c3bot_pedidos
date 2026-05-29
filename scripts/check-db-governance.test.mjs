import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkDatabaseGovernance } from "./check-db-governance.mjs";

function createFixture(files) {
  const root = path.join(tmpdir(), `c3bot-governance-${Date.now()}-${Math.random().toString(16).slice(2)}`);

  for (const [filePath, content] of Object.entries(files)) {
    const target = path.join(root, filePath);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, content);
  }

  return root;
}

const validFiles = {
  "docs/adr/0001-database-access-and-migrations.md":
    "Drizzle ORM\npnpm db:generate\npnpm db:check\ndrizzle-kit generate\n",
  "drizzle.config.ts": "export default {};",
  "package.json": JSON.stringify({
    scripts: {
      "db:check": "node scripts/check-db-governance.mjs",
      "db:generate": "drizzle-kit generate --config drizzle.config.ts",
    },
  }),
  "src/db/schema.ts": "export const attendants = {};",
  "src/db/tauriSqlProxy.ts": "const sql = `SELECT 1`;",
  "src/services/attendantRepository.ts": "export const repository = {};",
};

describe("check-db-governance", () => {
  it("passes when ORM scripts, ADR terms, and direct SQL boundaries are valid", () => {
    expect(checkDatabaseGovernance(createFixture(validFiles))).toEqual({ failures: [], ok: true });
  });

  it("fails when raw SQL appears outside the approved database boundary", () => {
    const root = createFixture({
      ...validFiles,
      "src/services/attendantRepository.ts": "const sql = `SELECT * FROM attendants`;",
    });

    expect(checkDatabaseGovernance(root).failures).toContain(
      "src/services/attendantRepository.ts contains raw SQL outside the approved database boundary.",
    );
  });
});
