import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { merchantInterruptions } from "../../src/db/schema";
import { readJson, writeJson } from "./http";
import { apiError, errorStatus } from "./errors";
import { loadStoreRow } from "./merchant";
import {
  canDeleteInterruption,
  findInterruptionOverlap,
  listCurrentAndFuture,
  validateInterruption,
} from "../../src/domain/merchant/interruptions";
import type { MerchantInterruption } from "../../src/domain/types";

async function loadAll(storeId: string): Promise<MerchantInterruption[]> {
  const rows = await db.select().from(merchantInterruptions).where(eq(merchantInterruptions.storeId, storeId));
  return rows.map((r) => ({ id: r.id, description: r.description, start: r.start, end: r.end, createdAt: r.createdAt }));
}

// GET /api/merchants/{id}/interruptions — current + future.
export async function listInterruptions(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const store = await loadStoreRow(params[0]);
  if (!store) {
    writeJson(res, errorStatus("MerchantNotFound"), apiError("MerchantNotFound"));
    return;
  }
  writeJson(res, 200, listCurrentAndFuture(await loadAll(store.id), new Date().toISOString()));
}

// POST /api/merchants/{id}/interruptions — validate, reject overlap, create.
export async function createInterruption(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const store = await loadStoreRow(params[0]);
  if (!store) {
    writeJson(res, errorStatus("MerchantNotFound"), apiError("MerchantNotFound"));
    return;
  }
  const body = await readJson<{ description?: string; start?: string; end?: string }>(req);
  const input = { description: body.description ?? "", start: body.start ?? "", end: body.end ?? "" };
  const check = validateInterruption(input);
  if (!check.ok) {
    writeJson(res, errorStatus("InvalidInterruption"), apiError("InvalidInterruption", check.errors.join(" ")));
    return;
  }
  if (findInterruptionOverlap(input, await loadAll(store.id))) {
    writeJson(res, errorStatus("InterruptionOverlap"), apiError("InterruptionOverlap"));
    return;
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  await db.insert(merchantInterruptions).values({
    id,
    storeId: store.id,
    description: input.description,
    start: input.start,
    end: input.end,
    createdAt: now,
  });
  writeJson(res, 201, { id, description: input.description, start: input.start, end: input.end, createdAt: now });
}

// DELETE /api/merchants/{id}/interruptions/{interruptionId}
export async function deleteInterruption(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const store = await loadStoreRow(params[0]);
  if (!store) {
    writeJson(res, errorStatus("MerchantNotFound"), apiError("MerchantNotFound"));
    return;
  }
  const rows = await db
    .select()
    .from(merchantInterruptions)
    .where(and(eq(merchantInterruptions.storeId, store.id), eq(merchantInterruptions.id, params[1])))
    .limit(1);
  const existing = rows[0];
  if (!existing) {
    writeJson(res, errorStatus("InterruptionNotFound"), apiError("InterruptionNotFound"));
    return;
  }
  if (!canDeleteInterruption({ createdAt: existing.createdAt }, new Date().toISOString())) {
    writeJson(res, errorStatus("RecentlyCreatedInterruption"), apiError("RecentlyCreatedInterruption"));
    return;
  }
  await db.delete(merchantInterruptions).where(eq(merchantInterruptions.id, params[1]));
  res.writeHead(204);
  res.end();
}
