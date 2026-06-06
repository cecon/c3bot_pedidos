import type { AttendantPersistenceState } from "./types";

export const initialAttendantPersistenceState: AttendantPersistenceState = { status: "idle" };

export function getLoadingAttendantPersistenceState(): AttendantPersistenceState {
  return { status: "loading" };
}

export function getLoadedAttendantPersistenceState(count: number): AttendantPersistenceState {
  return count > 0 ? { status: "ready" } : { status: "empty" };
}

export function getUnavailableAttendantPersistenceState(): AttendantPersistenceState {
  return {
    status: "unavailable",
    message:
      "API de atendentes indisponivel. Inicie o app com pnpm dev ou configure VITE_C3BOT_API_BASE_URL.",
  };
}

export function getErroredAttendantPersistenceState(error: unknown): AttendantPersistenceState {
  const raw = error instanceof Error ? error.message : "";
  // Network/connection failures surface as raw English browser errors ("Failed to fetch") — translate.
  const isNetwork = /failed to fetch|networkerror|load failed|fetch/i.test(raw);
  return {
    status: "error",
    message: isNetwork
      ? "Não foi possível conectar ao serviço de atendentes. Verifique a conexão e recarregue."
      : raw || "Não foi possível carregar os atendentes.",
  };
}

export function canMutatePersistedAttendants(state: AttendantPersistenceState): boolean {
  return state.status === "ready" || state.status === "empty";
}

export function getAttendantPersistenceLabel(state: AttendantPersistenceState): string | undefined {
  if (state.status === "loading") return "Carregando atendentes do banco local.";
  if (state.status === "unavailable") return state.message;
  if (state.status === "error") return state.message;
  return undefined;
}
