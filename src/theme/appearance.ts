import {
  COLOR_MODES,
  DENSITY_OPTIONS,
  FONT_OPTIONS,
  PRIMARY_OPTIONS,
  RADIUS_OPTIONS,
  type ColorMode,
  type Density,
  type FontFamily,
  type PrimaryColor,
  type RadiusPreset,
} from "./themeTokens";

export const APPEARANCE_STORAGE_KEY = "c3bot-theme-settings";

export interface AppearanceSettings {
  colorMode: ColorMode;
  primaryColor: PrimaryColor;
  fontFamily: FontFamily;
  density: Density;
  radiusPreset: RadiusPreset;
  sidebarCollapsed: boolean;
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  colorMode: "dark",
  primaryColor: "blue",
  fontFamily: "inter",
  density: "normal",
  radiusPreset: "md",
  sidebarCollapsed: false,
};

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

// Migration-safe: merge stored JSON over defaults; fall back per field for missing/invalid/legacy data.
export function loadAppearance(raw: string | null): AppearanceSettings {
  if (!raw) return { ...DEFAULT_APPEARANCE };
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
  // Legacy keys from the Mantine era: { primary, radius, font }.
  const legacyPrimary = pick(parsed.primary, PRIMARY_OPTIONS, DEFAULT_APPEARANCE.primaryColor);
  return {
    colorMode: pick(parsed.colorMode, COLOR_MODES, DEFAULT_APPEARANCE.colorMode),
    primaryColor: pick(parsed.primaryColor ?? legacyPrimary, PRIMARY_OPTIONS, DEFAULT_APPEARANCE.primaryColor),
    fontFamily: pick(parsed.fontFamily, FONT_OPTIONS, DEFAULT_APPEARANCE.fontFamily),
    density: pick(parsed.density, DENSITY_OPTIONS, DEFAULT_APPEARANCE.density),
    radiusPreset: pick(parsed.radiusPreset, RADIUS_OPTIONS, DEFAULT_APPEARANCE.radiusPreset),
    sidebarCollapsed: typeof parsed.sidebarCollapsed === "boolean" ? parsed.sidebarCollapsed : DEFAULT_APPEARANCE.sidebarCollapsed,
  };
}

export function serializeAppearance(settings: AppearanceSettings): string {
  return JSON.stringify(settings);
}
