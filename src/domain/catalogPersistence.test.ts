import { describe, expect, it } from "vitest";
import {
  canMutatePersistedCatalog,
  getCatalogPersistenceLabel,
  getErroredCatalogPersistenceState,
  getLoadedCatalogPersistenceState,
  getLoadingCatalogPersistenceState,
  getUnavailableCatalogPersistenceState,
  initialCatalogPersistenceState,
} from "./catalogPersistence";

describe("catalogPersistence", () => {
  it("starts idle", () => {
    expect(initialCatalogPersistenceState).toEqual({ status: "idle" });
  });

  it("maps a non-empty load to ready and an empty load to empty", () => {
    expect(getLoadedCatalogPersistenceState(3)).toEqual({ status: "ready" });
    expect(getLoadedCatalogPersistenceState(0)).toEqual({ status: "empty" });
  });

  it("loading state has no actionable label beyond a progress hint", () => {
    expect(getLoadingCatalogPersistenceState()).toEqual({ status: "loading" });
    expect(getCatalogPersistenceLabel({ status: "loading" })).toMatch(/Carregando/);
  });

  it("surfaces the unavailable message as the label", () => {
    const state = getUnavailableCatalogPersistenceState();
    expect(state.status).toBe("unavailable");
    expect(getCatalogPersistenceLabel(state)).toBe(state.status === "unavailable" ? state.message : undefined);
  });

  it("derives an error message from an Error and falls back otherwise", () => {
    expect(getErroredCatalogPersistenceState(new Error("boom"))).toEqual({ status: "error", message: "boom" });
    expect(getErroredCatalogPersistenceState("x")).toEqual({
      status: "error",
      message: "Nao foi possivel carregar o catalogo.",
    });
  });

  it("allows mutation only when ready or empty", () => {
    expect(canMutatePersistedCatalog({ status: "ready" })).toBe(true);
    expect(canMutatePersistedCatalog({ status: "empty" })).toBe(true);
    expect(canMutatePersistedCatalog({ status: "loading" })).toBe(false);
    expect(canMutatePersistedCatalog({ status: "error", message: "x" })).toBe(false);
    expect(canMutatePersistedCatalog({ status: "unavailable", message: "x" })).toBe(false);
  });

  it("returns no label for ready/empty/idle", () => {
    expect(getCatalogPersistenceLabel({ status: "ready" })).toBeUndefined();
    expect(getCatalogPersistenceLabel({ status: "empty" })).toBeUndefined();
    expect(getCatalogPersistenceLabel({ status: "idle" })).toBeUndefined();
  });
});
