import { describe, expect, it } from "vitest";
import {
  canMutatePersistedAttendants,
  getAttendantPersistenceLabel,
  getErroredAttendantPersistenceState,
  getLoadedAttendantPersistenceState,
  getLoadingAttendantPersistenceState,
  getUnavailableAttendantPersistenceState,
  initialAttendantPersistenceState,
} from "./attendantPersistence";

describe("attendant persistence state", () => {
  it("starts idle and resolves loaded states by persisted row count", () => {
    expect(initialAttendantPersistenceState).toEqual({ status: "idle" });
    expect(getLoadedAttendantPersistenceState(0)).toEqual({ status: "empty" });
    expect(getLoadedAttendantPersistenceState(2)).toEqual({ status: "ready" });
  });

  it("allows mutations only when persisted attendants can be changed", () => {
    expect(canMutatePersistedAttendants({ status: "empty" })).toBe(true);
    expect(canMutatePersistedAttendants({ status: "ready" })).toBe(true);
    expect(canMutatePersistedAttendants({ status: "loading" })).toBe(false);
    expect(canMutatePersistedAttendants({ status: "unavailable" })).toBe(false);
    expect(canMutatePersistedAttendants({ status: "error" })).toBe(false);
  });

  it("returns user-facing labels for transient and blocked states", () => {
    expect(getAttendantPersistenceLabel(getLoadingAttendantPersistenceState())).toContain("Carregando");
    expect(getAttendantPersistenceLabel(getUnavailableAttendantPersistenceState())).toContain("Tauri");
    expect(getAttendantPersistenceLabel(getErroredAttendantPersistenceState(new Error("Falha local")))).toBe(
      "Falha local",
    );
    expect(getAttendantPersistenceLabel({ status: "ready" })).toBeUndefined();
  });
});
