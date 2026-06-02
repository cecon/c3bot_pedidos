import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { asc, eq } from "drizzle-orm";
import { db } from "./db";
import { catalogItems } from "../../src/db/schema";
import { readJson, requireText, writeJson } from "./http";
import { setScopeHours, type HoursWindow } from "./hours";
import { validateCatalogItem } from "../../src/domain/catalog/validation";

type Status = "available" | "unavailable" | "paused";

interface ItemInput {
  productId?: string;
  priceCents?: number;
  originalPriceCents?: number | null;
  displayOrder?: number;
  status?: Status;
  externalCode?: string | null;
}

export async function createItem(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const body = await readJson<ItemInput>(req);
  const check = validateCatalogItem({ priceCents: body.priceCents ?? -1, originalPriceCents: body.originalPriceCents });
  if (!check.ok) {
    writeJson(res, 400, { message: "Validação falhou", errors: check.errors });
    return;
  }
  const now = new Date().toISOString();
  const row = {
    id: randomUUID(),
    categoryId: params[0],
    productId: requireText(body.productId, "productId"),
    priceCents: body.priceCents ?? 0,
    originalPriceCents: body.originalPriceCents ?? null,
    displayOrder: body.displayOrder ?? 0,
    status: body.status ?? ("available" as const),
    externalCode: body.externalCode ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(catalogItems).values(row);
  writeJson(res, 201, row);
}

export async function listItems(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const rows = await db
    .select()
    .from(catalogItems)
    .where(eq(catalogItems.categoryId, params[0]))
    .orderBy(asc(catalogItems.displayOrder));
  writeJson(res, 200, rows);
}

export async function updateItem(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const body = await readJson<ItemInput>(req);
  const check = validateCatalogItem({ priceCents: body.priceCents ?? -1, originalPriceCents: body.originalPriceCents });
  if (!check.ok) {
    writeJson(res, 400, { message: "Validação falhou", errors: check.errors });
    return;
  }
  await db
    .update(catalogItems)
    .set({
      priceCents: body.priceCents ?? 0,
      originalPriceCents: body.originalPriceCents ?? null,
      displayOrder: body.displayOrder ?? 0,
      status: body.status ?? ("available" as const),
      externalCode: body.externalCode ?? null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(catalogItems.id, params[0]));
  writeJson(res, 200, { ok: true });
}

export async function deleteItem(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  await db.delete(catalogItems).where(eq(catalogItems.id, params[0]));
  writeJson(res, 200, { ok: true });
}

export async function setItemHours(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const body = await readJson<{ windows?: HoursWindow[] }>(req);
  await setScopeHours("item", params[0], body.windows ?? []);
  writeJson(res, 200, { ok: true });
}
