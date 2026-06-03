import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { merchantOperations, stores } from "../../src/db/schema";
import { readJson, writeJson } from "./http";
import { apiError, errorStatus } from "./errors";
import { validateCnpj } from "../../src/domain/catalog/validation";
import { validateMerchant, validateOperation } from "../../src/domain/merchant/validation";
import { toMerchant, type OperationRow, type StoreRow } from "../../src/domain/merchant/mapping";
import type { MerchantStatusValue, OperationName } from "../../src/domain/types";

const DEFAULT_STORE_ID = "store-default";

interface OperationInput {
  name: OperationName;
  salesChannel: string;
  enabled?: boolean;
}

interface MerchantInputBody {
  name?: string;
  corporateName?: string | null;
  description?: string | null;
  averageTicket?: number | null;
  exclusive?: boolean;
  type?: string;
  status?: MerchantStatusValue;
  cnpj?: string | null;
  externalCode?: string | null;
  address?: Partial<{
    country: string | null;
    state: string | null;
    city: string | null;
    postalCode: string | null;
    district: string | null;
    street: string | null;
    number: string | null;
    complement: string | null;
    latitude: number | null;
    longitude: number | null;
  }>;
  operations?: OperationInput[];
}

// Shared loaders (reused by the status handler).
export async function loadStoreRow(storeId?: string): Promise<StoreRow | undefined> {
  const rows = storeId
    ? await db.select().from(stores).where(eq(stores.id, storeId)).limit(1)
    : await db.select().from(stores).limit(1);
  return rows[0] as StoreRow | undefined;
}

export async function loadOperations(storeId: string): Promise<OperationRow[]> {
  const rows = await db.select().from(merchantOperations).where(eq(merchantOperations.storeId, storeId));
  return rows.map((r) => ({ name: r.name as OperationName, salesChannel: r.salesChannel, enabled: Boolean(r.enabled) }));
}

function clampPage(value: string | null): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

// GET /api/merchants?page&size — iFood-shaped list returning the single merchant.
export async function listMerchants(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "", "http://localhost");
  clampPage(url.searchParams.get("page")); // validated; single-store always returns page 1
  const row = await loadStoreRow();
  if (!row) {
    writeJson(res, 200, []);
    return;
  }
  writeJson(res, 200, [toMerchant(row, await loadOperations(row.id))]);
}

// GET /api/merchants/{id}
export async function getMerchant(_req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const row = await loadStoreRow(params[0]);
  if (!row) {
    writeJson(res, errorStatus("MerchantNotFound"), apiError("MerchantNotFound"));
    return;
  }
  writeJson(res, 200, toMerchant(row, await loadOperations(row.id)));
}

function statusToAvailability(status: MerchantStatusValue | undefined): "available" | "unavailable" {
  return status === "UNAVAILABLE" ? "unavailable" : "available";
}

// PUT /api/merchants/{id} — validate + persist the profile, operations, and address.
export async function putMerchant(req: IncomingMessage, res: ServerResponse, params: string[]): Promise<void> {
  const body = await readJson<MerchantInputBody>(req);
  const merchantCheck = validateMerchant({
    name: body.name ?? "",
    status: body.status,
    type: body.type,
    averageTicketCents: body.averageTicket ?? null,
    latitude: body.address?.latitude ?? null,
    longitude: body.address?.longitude ?? null,
  });
  if (!merchantCheck.ok) {
    writeJson(res, errorStatus("InvalidMerchant"), apiError("InvalidMerchant", merchantCheck.errors.join(" ")));
    return;
  }
  if (body.cnpj) {
    const cnpj = validateCnpj(body.cnpj);
    if (!cnpj.ok) {
      writeJson(res, errorStatus("InvalidMerchant"), apiError("InvalidMerchant", cnpj.reason));
      return;
    }
  }
  for (const op of body.operations ?? []) {
    const check = validateOperation({ name: op.name, salesChannel: op.salesChannel });
    if (!check.ok) {
      writeJson(res, errorStatus("InvalidMerchant"), apiError("InvalidMerchant", check.errors.join(" ")));
      return;
    }
  }

  const now = new Date().toISOString();
  const address = body.address ?? {};
  const values = {
    name: (body.name ?? "").trim(),
    corporateName: body.corporateName ?? null,
    description: body.description ?? null,
    averageTicketCents: body.averageTicket ?? null,
    exclusive: body.exclusive ?? false,
    merchantType: body.type ?? "RESTAURANT",
    country: address.country ?? "BR",
    cnpj: body.cnpj ?? null,
    externalCode: body.externalCode ?? null,
    status: statusToAvailability(body.status),
    street: address.street ?? null,
    number: address.number ?? null,
    neighborhood: address.district ?? null,
    city: address.city ?? null,
    state: address.state ?? null,
    postalCode: address.postalCode ?? null,
    complement: address.complement ?? null,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
    updatedAt: now,
  };

  const existing = await loadStoreRow(params[0]);
  const id = existing?.id ?? DEFAULT_STORE_ID;
  if (existing) {
    await db.update(stores).set(values).where(eq(stores.id, id));
  } else {
    await db.insert(stores).values({ id, createdAt: now, ...values });
  }
  if (body.operations) {
    await db.delete(merchantOperations).where(eq(merchantOperations.storeId, id));
    for (const op of body.operations) {
      await db.insert(merchantOperations).values({
        id: randomUUID(),
        storeId: id,
        name: op.name,
        salesChannel: op.salesChannel,
        enabled: op.enabled ?? true,
        createdAt: now,
      });
    }
  }
  const row = await loadStoreRow(id);
  writeJson(res, 200, toMerchant(row as StoreRow, await loadOperations(id)));
}
