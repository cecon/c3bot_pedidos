import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  pizzaConfigs,
  pizzaCrusts,
  pizzaEdges,
  pizzaFlavorPrices,
  pizzaFlavors,
  pizzaSizes,
} from "../../src/db/schema";
import { readJson, requireText, writeJson } from "./http";

// Pizza configuration endpoints. "set*" replaces the children of a config (delete + insert)
// so the editor can save the whole set in one PUT. computePizzaPrice (domain) prices at order
// time. See FR-021..023.

export async function getPizzaConfig(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const config = (await db.select().from(pizzaConfigs).where(eq(pizzaConfigs.categoryId, params[0])).limit(1))[0];
  if (!config) {
    writeJson(res, 404, { message: "Categoria sem configuração de pizza." });
    return;
  }
  const [sizes, crusts, edges, flavors] = await Promise.all([
    db.select().from(pizzaSizes).where(eq(pizzaSizes.pizzaConfigId, config.id)),
    db.select().from(pizzaCrusts).where(eq(pizzaCrusts.pizzaConfigId, config.id)),
    db.select().from(pizzaEdges).where(eq(pizzaEdges.pizzaConfigId, config.id)),
    db.select().from(pizzaFlavors).where(eq(pizzaFlavors.pizzaConfigId, config.id)),
  ]);
  const flavorIds = flavors.map((flavor) => flavor.id);
  const flavorPrices = flavorIds.length
    ? await db.select().from(pizzaFlavorPrices).where(inArray(pizzaFlavorPrices.pizzaFlavorId, flavorIds))
    : [];
  writeJson(res, 200, { config, sizes, crusts, edges, flavors, flavorPrices });
}

export async function putPizzaConfig(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const body = await readJson<{ pricingStrategy?: "highest" | "average" }>(req);
  const pricingStrategy = body.pricingStrategy ?? "highest";
  const now = new Date().toISOString();
  const existing = (await db.select().from(pizzaConfigs).where(eq(pizzaConfigs.categoryId, params[0])).limit(1))[0];
  if (existing) {
    await db.update(pizzaConfigs).set({ pricingStrategy, updatedAt: now }).where(eq(pizzaConfigs.id, existing.id));
    writeJson(res, 200, { ...existing, pricingStrategy });
    return;
  }
  const row = { id: randomUUID(), categoryId: params[0], pricingStrategy, createdAt: now, updatedAt: now };
  await db.insert(pizzaConfigs).values(row);
  writeJson(res, 201, row);
}

interface NamedPriced {
  name?: string;
  priceCents?: number;
  displayOrder?: number;
  externalCode?: string | null;
}

export async function setSizes(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const list = await readJson<Array<{ name?: string; slices?: number; maxFlavors?: number; externalCode?: string | null }>>(req);
  await db.delete(pizzaSizes).where(eq(pizzaSizes.pizzaConfigId, params[0]));
  for (const [index, size] of list.entries()) {
    await db.insert(pizzaSizes).values({
      id: randomUUID(),
      pizzaConfigId: params[0],
      name: requireText(size.name, "name"),
      slices: size.slices ?? 0,
      maxFlavors: size.maxFlavors ?? 1,
      displayOrder: index,
      externalCode: size.externalCode ?? null,
    });
  }
  writeJson(res, 200, { ok: true });
}

async function replaceComponents(table: typeof pizzaCrusts | typeof pizzaEdges, configId: string, list: NamedPriced[]) {
  await db.delete(table).where(eq(table.pizzaConfigId, configId));
  for (const [index, component] of list.entries()) {
    await db.insert(table).values({
      id: randomUUID(),
      pizzaConfigId: configId,
      name: requireText(component.name, "name"),
      priceCents: component.priceCents ?? 0,
      status: "available",
      displayOrder: index,
      externalCode: component.externalCode ?? null,
    });
  }
}

export async function setCrusts(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  await replaceComponents(pizzaCrusts, params[0], await readJson<NamedPriced[]>(req));
  writeJson(res, 200, { ok: true });
}

export async function setEdges(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  await replaceComponents(pizzaEdges, params[0], await readJson<NamedPriced[]>(req));
  writeJson(res, 200, { ok: true });
}

export async function setFlavors(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const list = await readJson<Array<{ name?: string; externalCode?: string | null }>>(req);
  const existing = await db.select().from(pizzaFlavors).where(eq(pizzaFlavors.pizzaConfigId, params[0]));
  const existingIds = existing.map((flavor) => flavor.id);
  if (existingIds.length) await db.delete(pizzaFlavorPrices).where(inArray(pizzaFlavorPrices.pizzaFlavorId, existingIds));
  await db.delete(pizzaFlavors).where(eq(pizzaFlavors.pizzaConfigId, params[0]));
  for (const [index, flavor] of list.entries()) {
    await db.insert(pizzaFlavors).values({
      id: randomUUID(),
      pizzaConfigId: params[0],
      productId: null,
      name: requireText(flavor.name, "name"),
      status: "available",
      displayOrder: index,
      externalCode: flavor.externalCode ?? null,
    });
  }
  writeJson(res, 200, { ok: true });
}

export async function setFlavorPrices(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const list = await readJson<Array<{ pizzaFlavorId: string; pizzaSizeId: string; priceCents: number }>>(req);
  const flavors = await db.select().from(pizzaFlavors).where(eq(pizzaFlavors.pizzaConfigId, params[0]));
  const flavorIds = flavors.map((flavor) => flavor.id);
  if (flavorIds.length) await db.delete(pizzaFlavorPrices).where(inArray(pizzaFlavorPrices.pizzaFlavorId, flavorIds));
  for (const price of list) {
    await db.insert(pizzaFlavorPrices).values({
      id: randomUUID(),
      pizzaFlavorId: price.pizzaFlavorId,
      pizzaSizeId: price.pizzaSizeId,
      priceCents: price.priceCents ?? 0,
    });
  }
  writeJson(res, 200, { ok: true });
}
