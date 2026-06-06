import { describe, expect, it } from "vitest";
import { DEFAULT_APPEARANCE, loadAppearance, serializeAppearance } from "./appearance";

describe("loadAppearance", () => {
  it("returns defaults when storage is empty", () => {
    expect(loadAppearance(null)).toEqual(DEFAULT_APPEARANCE);
  });

  it("returns defaults on malformed JSON", () => {
    expect(loadAppearance("{not json")).toEqual(DEFAULT_APPEARANCE);
  });

  it("falls back per-field for invalid/out-of-enum values", () => {
    const result = loadAppearance(JSON.stringify({ colorMode: "neon", radiusPreset: "huge", density: 5 }));
    expect(result.colorMode).toBe("dark");
    expect(result.radiusPreset).toBe("md");
    expect(result.density).toBe("normal");
  });

  it("keeps valid stored values", () => {
    const stored = { ...DEFAULT_APPEARANCE, colorMode: "light" as const, primaryColor: "emerald" as const, sidebarCollapsed: true };
    expect(loadAppearance(serializeAppearance(stored))).toEqual(stored);
  });

  it("migrates the legacy Mantine `primary` key into primaryColor", () => {
    expect(loadAppearance(JSON.stringify({ primary: "rose" })).primaryColor).toBe("rose");
  });

  it("ignores a legacy primary that is not a known option", () => {
    expect(loadAppearance(JSON.stringify({ primary: "chartreuse" })).primaryColor).toBe(DEFAULT_APPEARANCE.primaryColor);
  });
});
