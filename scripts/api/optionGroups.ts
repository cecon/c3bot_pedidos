import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { asc, eq } from "drizzle-orm";
import { db } from "./db";
import { optionGroups, options } from "../../src/db/schema";
import { readJson, requireText, writeJson } from "./http";
import { validateOptionGroup } from "../../src/domain/catalog/validation";

type Status = "available" | "unavailable" | "paused";

interface OptionGroupInput {
  name?: string;
  minQuantity?: number;
  maxQuantity?: number;
  displayOrder?: number;
  status?: Status;
  externalCode?: string | null;
}

interface OptionInput {
  name?: string;
  productId?: string | null;
  priceCents?: number;
  displayOrder?: number;
  status?: Status;
  externalCode?: string | null;
}

function buildGroup(body: OptionGroupInput) {
  const minQuantity = body.minQuantity ?? 0;
  const maxQuantity = body.maxQuantity ?? 1;
  const required = minQuantity >= 1; // derived: required iff min >= 1 (iFood)
  const check = validateOptionGroup({ minQuantity, maxQuantity, required });
  if (!check.ok) return { errors: check.errors };
  return {
    values: {
      name: requireText(body.name, "name"),
      minQuantity,
      maxQuantity,
      required,
      displayOrder: body.displayOrder ?? 0,
      status: body.status ?? ("available" as const),
      externalCode: body.externalCode ?? null,
    },
  };
}

export async function listOptionGroups(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const rows = await db
    .select()
    .from(optionGroups)
    .where(eq(optionGroups.productId, params[0]))
    .orderBy(asc(optionGroups.displayOrder));
  writeJson(res, 200, rows);
}

export async function createOptionGroup(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const built = buildGroup(await readJson<OptionGroupInput>(req));
  if ("errors" in built) {
    writeJson(res, 400, { message: "Validação falhou", errors: built.errors });
    return;
  }
  const now = new Date().toISOString();
  const row = { id: randomUUID(), productId: params[0], ...built.values, createdAt: now, updatedAt: now };
  await db.insert(optionGroups).values(row);
  writeJson(res, 201, row);
}

export async function updateOptionGroup(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const built = buildGroup(await readJson<OptionGroupInput>(req));
  if ("errors" in built) {
    writeJson(res, 400, { message: "Validação falhou", errors: built.errors });
    return;
  }
  await db
    .update(optionGroups)
    .set({ ...built.values, updatedAt: new Date().toISOString() })
    .where(eq(optionGroups.id, params[0]));
  writeJson(res, 200, { ok: true });
}

export async function deleteOptionGroup(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  await db.delete(optionGroups).where(eq(optionGroups.id, params[0]));
  writeJson(res, 200, { ok: true });
}

export async function listOptions(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const rows = await db
    .select()
    .from(options)
    .where(eq(options.optionGroupId, params[0]))
    .orderBy(asc(options.displayOrder));
  writeJson(res, 200, rows);
}

export async function createOption(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const body = await readJson<OptionInput>(req);
  const priceCents = body.priceCents ?? 0;
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    writeJson(res, 400, { message: "Preço da opção inválido." });
    return;
  }
  const now = new Date().toISOString();
  const row = {
    id: randomUUID(),
    optionGroupId: params[0],
    productId: body.productId ?? null,
    name: requireText(body.name, "name"),
    priceCents,
    displayOrder: body.displayOrder ?? 0,
    status: body.status ?? ("available" as const),
    externalCode: body.externalCode ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(options).values(row);
  writeJson(res, 201, row);
}

export async function updateOption(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const body = await readJson<OptionInput>(req);
  const priceCents = body.priceCents ?? 0;
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    writeJson(res, 400, { message: "Preço da opção inválido." });
    return;
  }
  await db
    .update(options)
    .set({
      name: requireText(body.name, "name"),
      priceCents,
      status: body.status ?? ("available" as const),
      externalCode: body.externalCode ?? null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(options.id, params[0]));
  writeJson(res, 200, { ok: true });
}

export async function deleteOption(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  await db.delete(options).where(eq(options.id, params[0]));
  writeJson(res, 200, { ok: true });
}
