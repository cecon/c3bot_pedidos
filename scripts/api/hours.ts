import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { availabilitySchedules } from "../../src/db/schema";

export type ScopeType = "store" | "catalog" | "category" | "item";
export interface HoursWindow {
  dayOfWeek: number;
  start: string;
  end: string;
}

// Replace the weekly windows for a scope (store/catalog/category/item). Idempotent: clears
// the scope's existing rows then inserts the provided windows.
export async function setScopeHours(scopeType: ScopeType, scopeId: string, windows: HoursWindow[]): Promise<void> {
  await db
    .delete(availabilitySchedules)
    .where(and(eq(availabilitySchedules.scopeType, scopeType), eq(availabilitySchedules.scopeId, scopeId)));
  for (const window of windows) {
    await db.insert(availabilitySchedules).values({
      id: randomUUID(),
      scopeType,
      scopeId,
      dayOfWeek: window.dayOfWeek,
      startTime: window.start,
      endTime: window.end,
    });
  }
}

export async function listScopeHours(scopeType: ScopeType, scopeId: string): Promise<HoursWindow[]> {
  const rows = await db
    .select()
    .from(availabilitySchedules)
    .where(and(eq(availabilitySchedules.scopeType, scopeType), eq(availabilitySchedules.scopeId, scopeId)));
  return rows.map((row) => ({ dayOfWeek: row.dayOfWeek, start: row.startTime, end: row.endTime }));
}
