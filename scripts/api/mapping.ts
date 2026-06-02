import type { IncomingMessage, ServerResponse } from "node:http";
import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { catalogItems, catalogs, categories, optionGroups, options, products } from "../../src/db/schema";
import { writeJson } from "./http";
import { computeMappingReadiness, findDuplicateExternalCodes, type SellableRef } from "../../src/domain/catalog/mapping";

// Aggregate the catalog's sellable elements and run the domain mapping rules server-side
// (FR-009..011, FR-026, SC-003). Returns readiness + per-kind duplicate external codes.
export async function getMappingReadiness(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const catalogId = params[0];
  const catalog = (await db.select().from(catalogs).where(eq(catalogs.id, catalogId)).limit(1))[0];
  if (!catalog) {
    writeJson(res, 404, { message: "Catálogo não encontrado." });
    return;
  }

  const cats = await db.select().from(categories).where(eq(categories.catalogId, catalogId));
  const categoryIds = cats.map((category) => category.id);
  const items = categoryIds.length
    ? await db.select().from(catalogItems).where(inArray(catalogItems.categoryId, categoryIds))
    : [];
  const productIds = [...new Set(items.map((item) => item.productId))];
  const prods = productIds.length ? await db.select().from(products).where(inArray(products.id, productIds)) : [];
  const groups = productIds.length
    ? await db.select().from(optionGroups).where(inArray(optionGroups.productId, productIds))
    : [];
  const groupIds = groups.map((group) => group.id);
  const opts = groupIds.length ? await db.select().from(options).where(inArray(options.optionGroupId, groupIds)) : [];

  const categoryName = new Map(cats.map((category) => [category.id, category.name]));
  const productName = new Map(prods.map((product) => [product.id, product.name]));

  const refs: SellableRef[] = [
    { kind: "catalog", id: catalog.id, path: catalog.name, externalCode: catalog.externalCode },
    ...cats.map((c) => ({ kind: "category" as const, id: c.id, path: c.name, externalCode: c.externalCode })),
    ...prods.map((p) => ({ kind: "product" as const, id: p.id, path: p.name, externalCode: p.externalCode })),
    ...items.map((it) => ({
      kind: "item" as const,
      id: it.id,
      path: `${categoryName.get(it.categoryId) ?? "?"}/${productName.get(it.productId) ?? "?"}`,
      externalCode: it.externalCode,
    })),
    ...opts.map((o) => ({ kind: "option" as const, id: o.id, path: o.name, externalCode: o.externalCode })),
  ];

  const readiness = computeMappingReadiness(refs);
  writeJson(res, 200, { ...readiness, duplicates: findDuplicateExternalCodes(refs) });
}
