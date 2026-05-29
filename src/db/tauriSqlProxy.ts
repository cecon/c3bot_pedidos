import type { AsyncRemoteCallback } from "drizzle-orm/sqlite-proxy";

export interface TauriSqlDatabase {
  execute(sql: string, params?: unknown[]): Promise<unknown>;
  select<T = unknown[]>(sql: string, params?: unknown[]): Promise<T>;
}

export function createTauriSqlProxy(database: TauriSqlDatabase): AsyncRemoteCallback {
  return async (sql, params, method) => executeTauriSqlQuery(database, sql, params, method);
}

export async function executeTauriSqlQuery(
  database: TauriSqlDatabase,
  sql: string,
  params: unknown[],
  method: "run" | "all" | "values" | "get",
) {
  if (method === "run") {
    await database.execute(sql, params);
    return { rows: [] };
  }

  const rows = await database.select<unknown[]>(sql, params);
  const mappedRows = rows.map(mapResultRowToValues);

  return { rows: method === "get" ? (mappedRows[0] ?? undefined) : mappedRows };
}

function mapResultRowToValues(row: unknown): unknown[] {
  if (Array.isArray(row)) return row;
  if (row && typeof row === "object") return Object.values(row);
  return [row];
}
