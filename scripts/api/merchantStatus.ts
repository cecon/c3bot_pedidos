import type { IncomingMessage, ServerResponse } from "node:http";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { merchantInterruptions, merchantShifts } from "../../src/db/schema";
import { writeJson } from "./http";
import { apiError, errorStatus } from "./errors";
import { loadOperations, loadStoreRow } from "./merchant";
import { resolveMerchantStatus } from "../../src/domain/merchant/status";
import { toMerchant } from "../../src/domain/merchant/mapping";
import { OPERATION_NAMES } from "../../src/domain/merchant/validation";
import type { DayOfWeek, MerchantInterruption, MerchantShift, OperationName } from "../../src/domain/types";

async function buildStatuses(storeId: string) {
  const row = await loadStoreRow(storeId);
  if (!row) return null;
  const merchant = toMerchant(row, await loadOperations(storeId));
  const shiftRows = await db.select().from(merchantShifts).where(eq(merchantShifts.storeId, storeId));
  const shifts: MerchantShift[] = shiftRows.map((r) => ({
    dayOfWeek: r.dayOfWeek as DayOfWeek,
    start: r.start,
    duration: r.durationMinutes,
    enabled: Boolean(r.enabled),
  }));
  const interruptionRows = await db.select().from(merchantInterruptions).where(eq(merchantInterruptions.storeId, storeId));
  const interruptions: MerchantInterruption[] = interruptionRows.map((r) => ({
    id: r.id,
    description: r.description,
    start: r.start,
    end: r.end,
    createdAt: r.createdAt,
  }));
  return resolveMerchantStatus(
    { merchantStatus: merchant.status, operations: merchant.operations, shifts, interruptions },
    new Date().toISOString(),
  );
}

// GET /api/merchants/{id}/status — all operations.
export async function getMerchantStatus(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const statuses = await buildStatuses(params[0]);
  if (statuses === null) {
    writeJson(res, errorStatus("MerchantNotFound"), apiError("MerchantNotFound"));
    return;
  }
  writeJson(res, 200, statuses);
}

// GET /api/merchants/{id}/status/{operation} — single operation; rejects an invalid name.
export async function getMerchantOperationStatus(
  _req: IncomingMessage,
  res: ServerResponse,
  params: string[],
): Promise<void> {
  const operation = params[1]?.toUpperCase() as OperationName;
  if (!OPERATION_NAMES.includes(operation)) {
    writeJson(res, errorStatus("InvalidOperation"), apiError("InvalidOperation"));
    return;
  }
  const statuses = await buildStatuses(params[0]);
  if (statuses === null) {
    writeJson(res, errorStatus("MerchantNotFound"), apiError("MerchantNotFound"));
    return;
  }
  const match = statuses.find((s) => s.operation === operation);
  writeJson(res, 200, match ?? { operation, available: false, state: "ERROR", reopenable: false, validations: [] });
}
