import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { asc, eq } from "drizzle-orm";
import { db } from "./db";
import { categories } from "../../src/db/schema";
import { readJson, requireText, writeJson } from "./http";
import { setScopeHours, type HoursWindow } from "./hours";

type Template = "default" | "pizza" | "combo";
type Status = "available" | "unavailable" | "paused";

interface CategoryInput {
  name?: string;
  displayOrder?: number;
  template?: Template;
  status?: Status;
  externalCode?: string | null;
}

export async function listCategories(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.catalogId, params[0]))
    .orderBy(asc(categories.displayOrder));
  writeJson(res, 200, rows);
}

export async function createCategory(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const body = await readJson<CategoryInput>(req);
  const now = new Date().toISOString();
  const row = {
    id: randomUUID(),
    catalogId: params[0],
    name: requireText(body.name, "name"),
    displayOrder: body.displayOrder ?? 0,
    template: body.template ?? ("default" as const),
    status: body.status ?? ("available" as const),
    externalCode: body.externalCode ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(categories).values(row);
  writeJson(res, 201, row);
}

export async function updateCategory(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const body = await readJson<CategoryInput>(req);
  await db
    .update(categories)
    .set({
      name: requireText(body.name, "name"),
      template: body.template ?? ("default" as const),
      status: body.status ?? ("available" as const),
      externalCode: body.externalCode ?? null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(categories.id, params[0]));
  writeJson(res, 200, { ok: true });
}

export async function deleteCategory(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  await db.delete(categories).where(eq(categories.id, params[0]));
  writeJson(res, 200, { ok: true });
}

export async function reorderCategories(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readJson<{ orderedIds?: string[] }>(req);
  const ids = body.orderedIds ?? [];
  for (let index = 0; index < ids.length; index += 1) {
    await db.update(categories).set({ displayOrder: index }).where(eq(categories.id, ids[index]));
  }
  writeJson(res, 200, { ok: true });
}

export async function setCategoryHours(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const body = await readJson<{ windows?: HoursWindow[] }>(req);
  await setScopeHours("category", params[0], body.windows ?? []);
  writeJson(res, 200, { ok: true });
}
