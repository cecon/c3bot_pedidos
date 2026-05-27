import Database from "@tauri-apps/plugin-sql";

const DATABASE_URL = "sqlite:c3bot.db";

let databasePromise: Promise<Database> | null = null;

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getDatabase(): Promise<Database> {
  if (!isTauriRuntime()) {
    throw new Error("SQLite is available only inside the Tauri runtime.");
  }

  databasePromise ??= Database.load(DATABASE_URL);
  return databasePromise;
}

export const schemaTables = [
  "users",
  "attendants",
  "whatsapp_sessions",
  "customers",
  "customer_addresses",
  "products",
  "orders",
  "order_items",
  "automation_groups",
  "automation_bindings",
  "campaigns",
] as const;
