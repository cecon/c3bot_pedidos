import type { MerchantOperation, MerchantStatusValue, MerchantType } from "../types";
import { isReadyForHandoff } from "./validation";

// Pure mapping from the persisted store/merchant row to the iFood-shaped Merchant resource.
// No IO. Keeps the API/UI decoupled from the DB column layout.

export interface MerchantAddress {
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
}

export interface Merchant {
  id: string;
  name: string;
  corporateName: string | null;
  description: string | null;
  averageTicket: number | null; // cents
  exclusive: boolean;
  type: MerchantType | string;
  status: MerchantStatusValue;
  cnpj: string | null;
  externalCode: string | null;
  mappedToDestination: boolean;
  address: MerchantAddress;
  operations: MerchantOperation[];
  createdAt: string | null;
}

// The persisted store row (camelCase as returned by Drizzle). Only the fields we map are typed.
export interface StoreRow {
  id: string;
  name: string;
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
  status?: string | null;
  corporateName?: string | null;
  description?: string | null;
  averageTicketCents?: number | null;
  exclusive?: boolean | null;
  merchantType?: string | null;
  country?: string | null;
  createdAt?: string | null;
}

export interface OperationRow {
  name: MerchantOperation["name"];
  salesChannel: string;
  enabled: boolean;
}

// iFood merchant status maps from the store availability state: only "available" => AVAILABLE.
function toMerchantStatus(status: string | null | undefined): MerchantStatusValue {
  return status === "available" ? "AVAILABLE" : "UNAVAILABLE";
}

export function toMerchant(row: StoreRow, operations: readonly OperationRow[]): Merchant {
  return {
    id: row.id,
    name: row.name,
    corporateName: row.corporateName ?? null,
    description: row.description ?? null,
    averageTicket: row.averageTicketCents ?? null,
    exclusive: Boolean(row.exclusive),
    type: row.merchantType ?? "RESTAURANT",
    status: toMerchantStatus(row.status),
    cnpj: row.cnpj ?? null,
    externalCode: row.externalCode ?? null,
    mappedToDestination: isReadyForHandoff({ cnpj: row.cnpj, externalCode: row.externalCode }),
    address: {
      country: row.country ?? null,
      state: row.state ?? null,
      city: row.city ?? null,
      postalCode: row.postalCode ?? null,
      district: row.neighborhood ?? null,
      street: row.street ?? null,
      number: row.number ?? null,
      complement: row.complement ?? null,
      latitude: row.latitude ?? null,
      longitude: row.longitude ?? null,
    },
    operations: operations.map((op) => ({ name: op.name, salesChannel: op.salesChannel, enabled: Boolean(op.enabled) })),
    createdAt: row.createdAt ?? null,
  };
}
