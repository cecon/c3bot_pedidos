import type { Attendant } from "../domain/types";
import type { AttendantManagementRepository } from "./attendantRepositoryContract";

const apiToken = import.meta.env.VITE_C3BOT_API_TOKEN?.trim();

export function getConfiguredAttendantApiBaseUrl(): string | undefined {
  const configuredUrl = import.meta.env.VITE_C3BOT_API_BASE_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3922`;
  }
  return undefined;
}

export function createRestAttendantRepository(baseUrl: string): AttendantManagementRepository {
  return {
    async createAttendant(attendant) {
      await requestJson(`${baseUrl}/api/attendants`, {
        body: JSON.stringify(attendant),
        method: "POST",
      });
    },
    async listAttendants() {
      return requestJson<Attendant[]>(`${baseUrl}/api/attendants`);
    },
    async softDeleteAttendant(attendantId, updatedAt) {
      await requestJson(`${baseUrl}/api/attendants/${encodeURIComponent(attendantId)}`, {
        body: JSON.stringify({ updatedAt }),
        method: "DELETE",
      });
    },
    async updateAttendant(attendantId, values, updatedAt) {
      await requestJson(`${baseUrl}/api/attendants/${encodeURIComponent(attendantId)}`, {
        body: JSON.stringify({ ...values, updatedAt }),
        method: "PATCH",
      });
    },
    async updateAttendantAvailability(attendantId, availabilityStatus, updatedAt) {
      await requestJson(`${baseUrl}/api/attendants/${encodeURIComponent(attendantId)}/availability`, {
        body: JSON.stringify({ availabilityStatus, updatedAt }),
        method: "PATCH",
      });
    },
  };
}

async function requestJson<T = unknown>(url: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => undefined);
    const message = hasMessage(errorBody) ? errorBody.message : "Falha ao acessar API de atendentes.";
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function hasMessage(value: unknown): value is { message: string } {
  return Boolean(value && typeof value === "object" && "message" in value && typeof value.message === "string");
}
