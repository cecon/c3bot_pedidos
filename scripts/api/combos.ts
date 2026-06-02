import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { comboComponents } from "../../src/db/schema";
import { readJson, requireText, writeJson } from "./http";

// Replace the component products of a combo item (FR-024). Delete + insert so the editor
// saves the whole set in one PUT.
export async function setComboComponents(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const list = await readJson<Array<{ componentProductId?: string; quantity?: number }>>(req);
  await db.delete(comboComponents).where(eq(comboComponents.catalogItemId, params[0]));
  for (const [index, component] of list.entries()) {
    await db.insert(comboComponents).values({
      id: randomUUID(),
      catalogItemId: params[0],
      componentProductId: requireText(component.componentProductId, "componentProductId"),
      quantity: component.quantity && component.quantity > 0 ? component.quantity : 1,
      displayOrder: index,
    });
  }
  writeJson(res, 200, { ok: true });
}

export async function listComboComponents(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  writeJson(res, 200, await db.select().from(comboComponents).where(eq(comboComponents.catalogItemId, params[0])));
}
