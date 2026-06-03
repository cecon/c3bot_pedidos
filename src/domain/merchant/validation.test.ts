import { describe, expect, it } from "vitest";
import { isReadyForHandoff, validateMerchant, validateOperation, validateShift } from "./validation";

describe("validateMerchant", () => {
  it("accepts a minimal valid merchant", () => {
    expect(validateMerchant({ name: "Pizzaria do Edu" })).toEqual({ ok: true });
  });

  it("requires a non-empty public name", () => {
    const result = validateMerchant({ name: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/Nome público/);
  });

  it("rejects an invalid status, negative ticket and out-of-range coordinates", () => {
    const result = validateMerchant({
      name: "X",
      status: "OPEN" as never,
      averageTicketCents: -5,
      latitude: 91,
      longitude: -181,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBe(4);
  });

  it("accepts boundary coordinates and zero ticket", () => {
    expect(validateMerchant({ name: "X", averageTicketCents: 0, latitude: -90, longitude: 180 })).toEqual({ ok: true });
  });
});

describe("isReadyForHandoff", () => {
  it("is true only when both cnpj and external code are present", () => {
    expect(isReadyForHandoff({ cnpj: "12ABC34501DE35", externalCode: "M-1" })).toBe(true);
    expect(isReadyForHandoff({ cnpj: "12ABC34501DE35", externalCode: "  " })).toBe(false);
    expect(isReadyForHandoff({ cnpj: null, externalCode: "M-1" })).toBe(false);
  });
});

describe("validateOperation", () => {
  it("accepts DELIVERY with a sales channel", () => {
    expect(validateOperation({ name: "DELIVERY", salesChannel: "ifood-app" })).toEqual({ ok: true });
  });

  it("rejects an unknown operation and a blank channel", () => {
    const result = validateOperation({ name: "PICKUP" as never, salesChannel: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBe(2);
  });
});

describe("validateShift", () => {
  it("accepts HH:MM and HH:MM:SS with valid duration", () => {
    expect(validateShift({ dayOfWeek: "MONDAY", start: "11:00", duration: 180 })).toEqual({ ok: true });
    expect(validateShift({ dayOfWeek: "SUNDAY", start: "18:00:00", duration: 1 })).toEqual({ ok: true });
  });

  it("rejects bad day, bad start and non-positive / too-long duration", () => {
    expect(validateShift({ dayOfWeek: "FUNDAY" as never, start: "11:00", duration: 60 }).ok).toBe(false);
    expect(validateShift({ dayOfWeek: "MONDAY", start: "25:00", duration: 60 }).ok).toBe(false);
    expect(validateShift({ dayOfWeek: "MONDAY", start: "11:00", duration: 0 }).ok).toBe(false);
    expect(validateShift({ dayOfWeek: "MONDAY", start: "11:00", duration: 1441 }).ok).toBe(false);
  });
});
