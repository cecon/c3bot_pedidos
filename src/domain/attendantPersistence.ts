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
    message: "Abra o app pelo Tauri para cadastrar atendentes no banco local.",
  };
}

export function getErroredAttendantPersistenceState(error: unknown): AttendantPersistenceState {
  return {
    status: "error",
    message: error instanceof Error ? error.message : "Nao foi possivel carregar os atendentes.",
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
