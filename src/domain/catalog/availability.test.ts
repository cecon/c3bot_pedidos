import { describe, expect, it } from "vitest";
import { canAddToOrder, resolveAvailability } from "./availability";

// Monday 2026-06-01 10:00 local time as the reference "now".
const monday10 = new Date(2026, 5, 1, 10, 0, 0);

describe("resolveAvailability", () => {
  it("is unavailable when status is unavailable", () => {
    expect(resolveAvailability({ status: "unavailable" }, {}, monday10)).toBe("unavailable");
  });

  it("is available when status is available and no schedules restrict it", () => {
    expect(resolveAvailability({ status: "available" }, {}, monday10)).toBe("available");
  });

  it("treats a pause with a future return time as unavailable, and auto-returns after it", () => {
    const future = new Date(2026, 5, 1, 12, 0, 0).toISOString();
    const past = new Date(2026, 5, 1, 9, 0, 0).toISOString();
    expect(resolveAvailability({ status: "paused", pauseUntil: future }, {}, monday10)).toBe("unavailable");
    expect(resolveAvailability({ status: "paused", pauseUntil: past }, {}, monday10)).toBe("available");
  });

  it("treats an indefinite pause (no return time) as unavailable", () => {
    expect(resolveAvailability({ status: "paused" }, {}, monday10)).toBe("unavailable");
  });

  it("honors a schedule window for the current day/time", () => {
    const lunch = [{ dayOfWeek: 1, start: "09:00", end: "11:00" }];
    const dinner = [{ dayOfWeek: 1, start: "18:00", end: "22:00" }];
    expect(resolveAvailability({ status: "available" }, { category: lunch }, monday10)).toBe("available");
    expect(resolveAvailability({ status: "available" }, { category: dinner }, monday10)).toBe("unavailable");
  });

  it("requires EVERY scope with windows to include now (scope chain)", () => {
    const open = [{ dayOfWeek: 1, start: "08:00", end: "23:00" }];
    const closedNow = [{ dayOfWeek: 1, start: "18:00", end: "22:00" }];
    expect(resolveAvailability({ status: "available" }, { store: open, catalog: open }, monday10)).toBe("available");
    expect(resolveAvailability({ status: "available" }, { store: open, catalog: closedNow }, monday10)).toBe("unavailable");
  });
});

describe("canAddToOrder", () => {
  it("blocks an unavailable element", () => {
    expect(canAddToOrder({ status: "unavailable", externalCode: "X1" }, {}, monday10)).toEqual({
      allowed: false,
      warnings: [],
    });
  });

  it("allows an available mapped element with no warnings", () => {
    expect(canAddToOrder({ status: "available", externalCode: "X1" }, {}, monday10)).toEqual({
      allowed: true,
      warnings: [],
    });
  });

  it("allows an available unmapped element but warns (non-blocking)", () => {
    const result = canAddToOrder({ status: "available", externalCode: "" }, {}, monday10);
    expect(result.allowed).toBe(true);
    expect(result.warnings).toHaveLength(1);
  });
});
