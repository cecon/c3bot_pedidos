import type { IncomingMessage, ServerResponse } from "node:http";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { stores } from "../../src/db/schema";
import { readJson, requireText, writeJson } from "./http";
import { setScopeHours, type HoursWindow } from "./hours";
import { validateCnpj } from "../../src/domain/catalog/validation";

const STORE_ID = "store-default";

interface StoreInput {
  name?: string;
  cnpj?: string | null;
  street?: string | null;
  number?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  complement?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  externalCode?: string | null;
  status?: "available" | "unavailable" | "paused";
}

export async function getStore(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  const rows = await db.select().from(stores).limit(1);
  writeJson(res, 200, rows[0] ?? null);
}

export async function putStore(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readJson<StoreInput>(req);
  if (body.cnpj) {
    const result = validateCnpj(body.cnpj);
    if (!result.ok) {
      writeJson(res, 400, { message: result.reason });
      return;
    }
  }

  const now = new Date().toISOString();
  const values = {
    name: requireText(body.name, "name"),
    cnpj: body.cnpj ?? null,
    street: body.street ?? null,
    number: body.number ?? null,
    neighborhood: body.neighborhood ?? null,
    city: body.city ?? null,
    state: body.state ?? null,
    postalCode: body.postalCode ?? null,
    complement: body.complement ?? null,
    latitude: body.latitude ?? null,
    longitude: body.longitude ?? null,
    externalCode: body.externalCode ?? null,
    status: body.status ?? ("available" as const),
    updatedAt: now,
  };

  const existing = await db.select().from(stores).limit(1);
  if (existing[0]) {
    await db.update(stores).set(values).where(eq(stores.id, existing[0].id));
    writeJson(res, 200, { ...existing[0], ...values });
    return;
  }
  await db.insert(stores).values({ id: STORE_ID, createdAt: now, ...values });
  writeJson(res, 200, { id: STORE_ID, createdAt: now, ...values });
}

export async function putStoreHours(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await readJson<{ windows?: HoursWindow[] }>(req);
  const store = (await db.select().from(stores).limit(1))[0];
  if (!store) {
    writeJson(res, 404, { message: "Loja não encontrada." });
    return;
  }
  await setScopeHours("store", store.id, body.windows ?? []);
  writeJson(res, 200, { ok: true });
}
