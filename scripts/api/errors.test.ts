import { describe, expect, it } from "vitest";
import { ERROR_CATALOG, apiError, errorStatus } from "./errors";

// FR-016/FR-017: the shared error catalog must expose the documented codes with correct
// statuses and a stable { code, message } shape.

describe("merchant error catalog", () => {
  it("documents every required standardized code", () => {
    const required = [
      "InvalidMerchant",
      "InvalidInterruption",
      "IrremovableInterruption",
      "InterruptionOverlap",
      "InterruptionNotFound",
      "InvalidOpeningHours",
      "RecentlyCreatedInterruption",
    ];
    for (const code of required) {
      expect(ERROR_CATALOG).toHaveProperty(code);
    }
  });

  it("maps codes to the expected HTTP statuses (FR-017 distinguishes 401 vs 403)", () => {
    expect(errorStatus("InvalidMerchant")).toBe(400);
    expect(errorStatus("InterruptionOverlap")).toBe(409);
    expect(errorStatus("RecentlyCreatedInterruption")).toBe(409);
    expect(errorStatus("MerchantNotFound")).toBe(404);
    expect(errorStatus("Unauthorized")).toBe(401);
    expect(errorStatus("Forbidden")).toBe(403);
  });

  it("builds a { code, message } body and allows overriding the message", () => {
    expect(apiError("InvalidMerchant")).toEqual({ code: "InvalidMerchant", message: ERROR_CATALOG.InvalidMerchant.message });
    expect(apiError("InvalidMerchant", "Nome obrigatório.")).toEqual({ code: "InvalidMerchant", message: "Nome obrigatório." });
  });
});
