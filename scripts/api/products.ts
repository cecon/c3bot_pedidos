import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { products } from "../../src/db/schema";
import { readJson, requireText, writeJson } from "./http";
import { validateProduct } from "../../src/domain/catalog/validation";

type UnitOfMeasure = "unit" | "weight";
type Status = "available" | "unavailable" | "paused";

interface ProductInput {
  name?: string;
  description?: string | null;
  imageBase64?: string | null;
  unitOfMeasure?: UnitOfMeasure;
  referenceWeightGrams?: number | null;
  externalCode?: string | null;
  status?: Status;
}

function buildValues(body: ProductInput) {
  const unitOfMeasure = body.unitOfMeasure ?? "unit";
  const check = validateProduct({
    name: body.name ?? "",
    unitOfMeasure,
    referenceWeightGrams: body.referenceWeightGrams ?? null,
  });
  if (!check.ok) return { errors: check.errors };
  return {
    values: {
      name: requireText(body.name, "name"),
      description: body.description ?? null,
      imageBase64: body.imageBase64 ?? null,
      unitOfMeasure,
      referenceWeightGrams: body.referenceWeightGrams ?? null,
      externalCode: body.externalCode ?? null,
      status: body.status ?? ("available" as const),
    },
  };
}

export async function listProducts(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  writeJson(res, 200, await db.select().from(products));
}

export async function createProduct(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const built = buildValues(await readJson<ProductInput>(req));
  if ("errors" in built) {
    writeJson(res, 400, { message: "Validação falhou", errors: built.errors });
    return;
  }
  // Legacy NOT NULL columns (price/category live on catalog_items now): placeholder values.
  const row = { id: randomUUID(), priceCents: 0, category: "", active: true, ...built.values };
  await db.insert(products).values(row);
  writeJson(res, 201, row);
}

export async function getProduct(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const row = (await db.select().from(products).where(eq(products.id, params[0])).limit(1))[0];
  if (!row) {
    writeJson(res, 404, { message: "Produto não encontrado." });
    return;
  }
  writeJson(res, 200, row);
}

export async function updateProduct(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const built = buildValues(await readJson<ProductInput>(req));
  if ("errors" in built) {
    writeJson(res, 400, { message: "Validação falhou", errors: built.errors });
    return;
  }
  await db.update(products).set(built.values).where(eq(products.id, params[0]));
  writeJson(res, 200, { ok: true });
}

export async function deleteProduct(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  await db.delete(products).where(eq(products.id, params[0]));
  writeJson(res, 200, { ok: true });
}
