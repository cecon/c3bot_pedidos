import type { Merchant } from "../domain/merchant/mapping";
import type { MerchantInterruption, MerchantShift, MerchantStatus, OperationName } from "../domain/types";

// Typed client for the merchant HTTP API (feature 006), consumed via VITE_C3BOT_API_BASE_URL.
// One function per endpoint; payloads match scripts/api/* handlers. No UI logic here.

const apiToken = import.meta.env.VITE_C3BOT_API_TOKEN?.trim();

export function getConfiguredMerchantApiBaseUrl(): string | undefined {
  const configuredUrl = import.meta.env.VITE_C3BOT_API_BASE_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3922`;
  }
  return undefined;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiToken) headers.Authorization = `Bearer ${apiToken}`;
  const response = await fetch(url, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export interface MerchantProfilePayload {
  name: string;
  corporateName?: string | null;
  description?: string | null;
  averageTicket?: number | null;
  exclusive?: boolean;
  type?: string;
  status?: "AVAILABLE" | "UNAVAILABLE";
  cnpj?: string | null;
  externalCode?: string | null;
  address?: Partial<Merchant["address"]>;
  operations?: Array<{ name: OperationName; salesChannel: string; enabled?: boolean }>;
}

export interface ShiftPayload {
  dayOfWeek: MerchantShift["dayOfWeek"];
  start: string;
  duration: number;
  enabled?: boolean;
}

export interface InterruptionPayload {
  description: string;
  start: string;
  end: string;
}

const body = (value: unknown) => JSON.stringify(value);

export function listMerchants(baseUrl: string): Promise<Merchant[]> {
  return requestJson<Merchant[]>(`${baseUrl}/api/merchants`);
}

export function getMerchant(baseUrl: string, id: string): Promise<Merchant> {
  return requestJson<Merchant>(`${baseUrl}/api/merchants/${id}`);
}

export function updateMerchant(baseUrl: string, id: string, payload: MerchantProfilePayload): Promise<Merchant> {
  return requestJson<Merchant>(`${baseUrl}/api/merchants/${id}`, { method: "PUT", body: body(payload) });
}

export function getMerchantStatus(baseUrl: string, id: string): Promise<MerchantStatus[]> {
  return requestJson<MerchantStatus[]>(`${baseUrl}/api/merchants/${id}/status`);
}

export function getMerchantOperationStatus(baseUrl: string, id: string, operation: OperationName): Promise<MerchantStatus> {
  return requestJson<MerchantStatus>(`${baseUrl}/api/merchants/${id}/status/${operation}`);
}

export function getOpeningHours(baseUrl: string, id: string): Promise<{ shifts: ShiftPayload[] }> {
  return requestJson<{ shifts: ShiftPayload[] }>(`${baseUrl}/api/merchants/${id}/opening-hours`);
}

export function replaceOpeningHours(baseUrl: string, id: string, shifts: ShiftPayload[]): Promise<{ shifts: ShiftPayload[] }> {
  return requestJson<{ shifts: ShiftPayload[] }>(`${baseUrl}/api/merchants/${id}/opening-hours`, {
    method: "PUT",
    body: body({ shifts }),
  });
}

export function listInterruptions(baseUrl: string, id: string): Promise<MerchantInterruption[]> {
  return requestJson<MerchantInterruption[]>(`${baseUrl}/api/merchants/${id}/interruptions`);
}

export function createInterruption(baseUrl: string, id: string, payload: InterruptionPayload): Promise<MerchantInterruption> {
  return requestJson<MerchantInterruption>(`${baseUrl}/api/merchants/${id}/interruptions`, {
    method: "POST",
    body: body(payload),
  });
}

export async function deleteInterruption(baseUrl: string, id: string, interruptionId: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (apiToken) headers.Authorization = `Bearer ${apiToken}`;
  const response = await fetch(`${baseUrl}/api/merchants/${id}/interruptions/${interruptionId}`, {
    method: "DELETE",
    headers,
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
}
