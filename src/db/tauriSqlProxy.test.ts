import { describe, expect, it, vi } from "vitest";
import { createTauriSqlProxy, executeTauriSqlQuery, type TauriSqlDatabase } from "./tauriSqlProxy";

function createDatabase(): TauriSqlDatabase & {
  execute: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
} {
  const database = {
    execute: vi.fn(async () => ({ rowsAffected: 1 })),
    select: vi.fn(async <T>() =>
      [
        { id: "att-1", display_name: "Ana" },
        { id: "att-2", display_name: "Bruno" },
      ] as T),
  };

  return database as TauriSqlDatabase & {
    execute: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
  };
}

describe("Tauri SQL proxy adapter", () => {
  it("routes run queries to execute without returning row data", async () => {
    const database = createDatabase();
    const result = await executeTauriSqlQuery(database, "UPDATE attendants SET active = ?", [false], "run");

    expect(database.execute).toHaveBeenCalledWith("UPDATE attendants SET active = ?", [false]);
    expect(database.select).not.toHaveBeenCalled();
    expect(result).toEqual({ rows: [] });
  });

  it("maps select object rows to Drizzle ordered row arrays", async () => {
    const database = createDatabase();
    const result = await executeTauriSqlQuery(database, "SELECT id, display_name FROM attendants", [], "all");

    expect(result).toEqual({
      rows: [
        ["att-1", "Ana"],
        ["att-2", "Bruno"],
      ],
    });
  });

  it("returns a single ordered row for get queries", async () => {
    const database = createDatabase();
    const proxy = createTauriSqlProxy(database);

    await expect(proxy("SELECT id, display_name FROM attendants LIMIT 1", [], "get")).resolves.toEqual({
      rows: ["att-1", "Ana"],
    });
  });
});
