import { describe, expect, it } from "vitest";
import type { MerchantInterruption, MerchantOperation, MerchantShift } from "../types";
import { hasActiveInterruption, isWithinShift, resolveMerchantStatus, type StatusInput } from "./status";

const delivery: MerchantOperation = { name: "DELIVERY", salesChannel: "ifood-app", enabled: true };
// 2026-06-01 is a Monday, 2026-06-02 a Tuesday.
const mondayLunch: MerchantShift = { dayOfWeek: "MONDAY", start: "11:00", duration: 180, enabled: true };
const NOON_MON = "2026-06-01T12:00:00Z";
const EVENING_MON = "2026-06-01T20:00:00Z";
const at = (iso: string) => Date.parse(iso);

function input(overrides: Partial<StatusInput>): StatusInput {
  return { merchantStatus: "AVAILABLE", operations: [delivery], shifts: [mondayLunch], interruptions: [], ...overrides };
}

describe("isWithinShift", () => {
  const half = [{ dayOfWeek: "MONDAY", start: "11:30", duration: 30, enabled: true } as MerchantShift];

  it("includes the start minute and excludes the end minute", () => {
    expect(isWithinShift(half, at("2026-06-01T11:30:00Z"))).toBe(true); // == start
    expect(isWithinShift(half, at("2026-06-01T11:45:00Z"))).toBe(true); // inside (minutes matter)
    expect(isWithinShift(half, at("2026-06-01T11:29:00Z"))).toBe(false); // before start
    expect(isWithinShift(half, at("2026-06-01T12:00:00Z"))).toBe(false); // == end
  });

  it("ignores disabled shifts, invalid starts and the wrong weekday", () => {
    expect(isWithinShift([{ ...mondayLunch, enabled: false }], at(NOON_MON))).toBe(false);
    expect(isWithinShift([{ ...mondayLunch, start: "99:99" }], at(NOON_MON))).toBe(false);
    expect(isWithinShift([{ ...mondayLunch, dayOfWeek: "TUESDAY" }], at(NOON_MON))).toBe(false);
  });

  it("handles shifts that wrap past midnight into the next day", () => {
    const wrap = [{ dayOfWeek: "MONDAY", start: "22:00", duration: 240, enabled: true } as MerchantShift];
    expect(isWithinShift(wrap, at("2026-06-01T23:00:00Z"))).toBe(true); // same day, late
    expect(isWithinShift(wrap, at("2026-06-02T01:00:00Z"))).toBe(true); // next day, before 02:00
    expect(isWithinShift(wrap, at("2026-06-02T03:00:00Z"))).toBe(false); // next day, after end
  });
});

describe("hasActiveInterruption", () => {
  const item: MerchantInterruption = { id: "i", description: "x", start: "2026-06-01T11:30:00Z", end: "2026-06-01T13:00:00Z" };
  it("is active from start (inclusive) until end (exclusive)", () => {
    expect(hasActiveInterruption([item], at("2026-06-01T11:30:00Z"))).toBe(true);
    expect(hasActiveInterruption([item], at("2026-06-01T12:00:00Z"))).toBe(true);
    expect(hasActiveInterruption([item], at("2026-06-01T13:00:00Z"))).toBe(false);
    expect(hasActiveInterruption([item], at("2026-06-01T11:00:00Z"))).toBe(false);
  });

  it("ignores interruptions with unparsable timestamps", () => {
    expect(hasActiveInterruption([mk("bad")], at("2026-06-01T12:00:00Z"))).toBe(false);
  });
});

const mk = (id: string): MerchantInterruption => ({ id, description: "x", start: "bad", end: "worse" });

describe("resolveMerchantStatus", () => {
  it("is OK/available within an open shift and no interruption", () => {
    const [status] = resolveMerchantStatus(input({}), NOON_MON);
    expect(status).toMatchObject({ available: true, state: "OK", reopenable: false, validations: [] });
  });

  it("is CLOSED and reopenable outside opening hours with an enabled shift", () => {
    const [status] = resolveMerchantStatus(input({}), EVENING_MON);
    expect(status).toMatchObject({ available: false, state: "CLOSED", reopenable: true });
    expect(status.validations[0]).toMatchObject({
      code: "OUTSIDE_OPENING_HOURS",
      state: "CLOSED",
      message: { title: "Fora do horário", subtitle: "Fora do horário de funcionamento", description: "O merchant reabre no próximo turno configurado." },
    });
  });

  it("is CLOSED and NOT reopenable outside hours when every shift is disabled", () => {
    const [status] = resolveMerchantStatus(input({ shifts: [{ ...mondayLunch, enabled: false }] }), EVENING_MON);
    expect(status.reopenable).toBe(false);
  });

  it("is CLOSED with an interruption validation when interrupted during a shift", () => {
    const interruption: MerchantInterruption = { id: "i", description: "x", start: "2026-06-01T11:30:00Z", end: "2026-06-01T13:00:00Z" };
    const [status] = resolveMerchantStatus(input({ interruptions: [interruption] }), NOON_MON);
    expect(status).toMatchObject({ available: false, state: "CLOSED", reopenable: true });
    expect(status.validations[0]).toMatchObject({
      code: "ACTIVE_INTERRUPTION",
      message: { title: "Em interrupção", subtitle: "Há uma interrupção ativa agora", description: "O merchant reabre ao fim da interrupção." },
    });
  });

  it("is ERROR when the merchant is UNAVAILABLE", () => {
    const [status] = resolveMerchantStatus(input({ merchantStatus: "UNAVAILABLE" }), NOON_MON);
    expect(status).toMatchObject({ available: false, state: "ERROR", reopenable: false });
    expect(status.validations[0]).toMatchObject({
      code: "MERCHANT_UNAVAILABLE",
      state: "ERROR",
      message: { title: "Merchant indisponível", subtitle: "Status do merchant é UNAVAILABLE", description: "Ative o merchant para aceitar pedidos." },
    });
  });

  it("is ERROR with OPERATION_DISABLED when the operation is disabled", () => {
    const [status] = resolveMerchantStatus(input({ operations: [{ ...delivery, enabled: false }] }), NOON_MON);
    expect(status).toMatchObject({ available: false, state: "ERROR", reopenable: false });
    expect(status.validations[0]).toMatchObject({
      code: "OPERATION_DISABLED",
      message: { title: "Operação desabilitada", subtitle: "A operação DELIVERY está desabilitada", description: "Habilite a operação para aceitar pedidos por este canal." },
    });
  });

  it("returns one status per operation, preserving channel", () => {
    const indoor: MerchantOperation = { name: "INDOOR", salesChannel: "ifood-app", enabled: true };
    const result = resolveMerchantStatus(input({ operations: [delivery, indoor] }), NOON_MON);
    expect(result.map((s) => s.operation)).toEqual(["DELIVERY", "INDOOR"]);
    expect(result[0].salesChannel).toBe("ifood-app");
  });
});
