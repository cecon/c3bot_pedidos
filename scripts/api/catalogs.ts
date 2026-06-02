import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { catalogs, stores } from "../../src/db/schema";
import { readJson, requireText, writeJson } from "./http";
import { setScopeHours, type HoursWindow } from "./hours";

type CatalogContext = "delivery" | "indoor" | "takeout";

interface CatalogInput {
  name?: string;
  context?: CatalogContext;
  externalCode?: string | null;
  status?: "available" | "unavailable" | "paused";
}

export async function listCatalogs(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  writeJson(res, 200, await db.select().from(catalogs));
}

export async function createCatalog(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readJson<CatalogInput>(req);
  const store = (await db.select().from(stores).limit(1))[0];
  if (!store) {
    writeJson(res, 400, { message: "Configure a loja antes de criar catálogos." });
    return;
  }
  const now = new Date().toISOString();
  const row = {
    id: randomUUID(),
    storeId: store.id,
    name: requireText(body.name, "name"),
    context: body.context ?? ("delivery" as const),
    externalCode: body.externalCode ?? null,
    status: body.status ?? ("available" as const),
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(catalogs).values(row);
  writeJson(res, 201, row);
}

export async function getCatalog(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const row = (await db.select().from(catalogs).where(eq(catalogs.id, params[0])).limit(1))[0];
  if (!row) {
    writeJson(res, 404, { message: "Catálogo não encontrado." });
    return;
  }
  writeJson(res, 200, row);
}

export async function updateCatalog(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const body = await readJson<CatalogInput>(req);
  await db
    .update(catalogs)
    .set({
      name: requireText(body.name, "name"),
      context: body.context ?? ("delivery" as const),
      externalCode: body.externalCode ?? null,
      status: body.status ?? ("available" as const),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(catalogs.id, params[0]));
  writeJson(res, 200, { ok: true });
}

export async function deleteCatalog(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  await db.delete(catalogs).where(eq(catalogs.id, params[0]));
  writeJson(res, 200, { ok: true });
}

export async function setCatalogHours(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const body = await readJson<{ windows?: HoursWindow[] }>(req);
  await setScopeHours("catalog", params[0], body.windows ?? []);
  writeJson(res, 200, { ok: true });
}
