import { drizzle, type SqliteRemoteDatabase } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";
import { createTauriSqlProxy, type TauriSqlDatabase } from "./tauriSqlProxy";
import { getDatabase } from "../services/database";

export type AppDatabase = SqliteRemoteDatabase<typeof schema>;

let appDatabasePromise: Promise<AppDatabase> | null = null;

export function createAppDatabase(database: TauriSqlDatabase): AppDatabase {
  return drizzle(createTauriSqlProxy(database), { schema });
}

export async function getAppDatabase(): Promise<AppDatabase> {
  appDatabasePromise ??= getDatabase().then(createAppDatabase);
  return appDatabasePromise;
}

export function resetAppDatabaseForTests() {
  appDatabasePromise = null;
}
