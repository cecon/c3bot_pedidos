import { describe, expect, it } from "vitest";
import { normalizeWhatsAppNumber } from "./phone";

describe("normalizeWhatsAppNumber", () => {
  it("formats an 11-digit national number", () => {
    expect(normalizeWhatsAppNumber("11999990000")).toBe("+55 11 99999-0000");
  });

  it("formats a 13-digit number already prefixed with 55", () => {
    expect(normalizeWhatsAppNumber("5511999990000")).toBe("+55 11 99999-0000");
  });

  it("strips non-digits before formatting", () => {
    expect(normalizeWhatsAppNumber("(11) 99999-0000")).toBe("+55 11 99999-0000");
  });

  it("trims and returns the input unchanged when it is not a recognized length", () => {
    expect(normalizeWhatsAppNumber("  12345  ")).toBe("12345");
  });
});
