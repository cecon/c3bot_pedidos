import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { merchantShifts } from "../../src/db/schema";
import { readJson, writeJson } from "./http";
import { apiError, errorStatus } from "./errors";
import { loadStoreRow } from "./merchant";
import { validateShift } from "../../src/domain/merchant/validation";
import type { DayOfWeek } from "../../src/domain/types";

interface ShiftBody {
  dayOfWeek: DayOfWeek;
  start: string;
  duration: number;
  enabled?: boolean;
}

// GET /api/merchants/{id}/opening-hours -> { shifts: [...] }
export async function getOpeningHours(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const store = await loadStoreRow(params[0]);
  if (!store) {
    writeJson(res, errorStatus("MerchantNotFound"), apiError("MerchantNotFound"));
    return;
  }
  const rows = await db.select().from(merchantShifts).where(eq(merchantShifts.storeId, store.id));
  const shifts = rows.map((r) => ({ dayOfWeek: r.dayOfWeek, start: r.start, duration: r.durationMinutes, enabled: Boolean(r.enabled) }));
  writeJson(res, 200, { shifts });
}

// PUT /api/merchants/{id}/opening-hours — validate then replace the full shift set.
export async function putOpeningHours(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const store = await loadStoreRow(params[0]);
  if (!store) {
    writeJson(res, errorStatus("MerchantNotFound"), apiError("MerchantNotFound"));
    return;
  }
  const body = await readJson<{ shifts?: ShiftBody[] }>(req);
  const shifts = body.shifts ?? [];
  for (const shift of shifts) {
    const check = validateShift({ dayOfWeek: shift.dayOfWeek, start: shift.start, duration: shift.duration });
    if (!check.ok) {
      writeJson(res, errorStatus("InvalidOpeningHours"), apiError("InvalidOpeningHours", check.errors.join(" ")));
      return;
    }
  }
  const now = new Date().toISOString();
  await db.delete(merchantShifts).where(eq(merchantShifts.storeId, store.id));
  for (const shift of shifts) {
    await db.insert(merchantShifts).values({
      id: randomUUID(),
      storeId: store.id,
      dayOfWeek: shift.dayOfWeek,
      start: shift.start,
      durationMinutes: shift.duration,
      enabled: shift.enabled ?? true,
      createdAt: now,
    });
  }
  writeJson(res, 200, { shifts });
}
