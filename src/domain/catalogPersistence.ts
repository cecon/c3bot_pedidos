import type { CatalogPersistenceState } from "./types";

// Catalog persistence state machine (mirrors attendantPersistence). Pure functions only —
// no IO — so the load/empty/error/unavailable states are unit- and mutation-testable.

export const initialCatalogPersistenceState: CatalogPersistenceState = { status: "idle" };

export function getLoadingCatalogPersistenceState(): CatalogPersistenceState {
  return { status: "loading" };
}

export function getLoadedCatalogPersistenceState(catalogCount: number): CatalogPersistenceState {
  return catalogCount > 0 ? { status: "ready" } : { status: "empty" };
}

export function getUnavailableCatalogPersistenceState(): CatalogPersistenceState {
  return {
    status: "unavailable",
    message: "API do catalogo indisponivel. Inicie o app com pnpm dev ou configure VITE_C3BOT_API_BASE_URL.",
  };
}

export function getErroredCatalogPersistenceState(error: unknown): CatalogPersistenceState {
  return {
    status: "error",
    message: error instanceof Error ? error.message : "Nao foi possivel carregar o catalogo.",
  };
}

export function canMutatePersistedCatalog(state: CatalogPersistenceState): boolean {
  return state.status === "ready" || state.status === "empty";
}

export function getCatalogPersistenceLabel(state: CatalogPersistenceState): string | undefined {
  if (state.status === "loading") return "Carregando catalogo do banco local.";
  if (state.status === "unavailable") return state.message;
  if (state.status === "error") return state.message;
  return undefined;
}
