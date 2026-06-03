import { Badge, Card, Paper, Table, Tooltip, createTheme, type MantineColorsTuple } from "@mantine/core";
import { makeScale, tablerColors } from "./themePalettes";

// Single source of truth for the UI, aligned to the Tabler admin look + Tabler's theme logic
// (selectable primary color, radius, font, color mode). Surfaces per color scheme live in
// styles.css; the live settings (primary/radius/font) are applied by ThemeSettingsProvider.

export { PRIMARY_OPTIONS } from "./themePalettes";

// Semantic palettes (named by meaning), fixed regardless of the chosen primary.
const success = makeScale("#2fb344");
const danger = makeScale("#d63939");
const warning = makeScale("#f59f00");
const info = makeScale("#17a2b8");

// Dark surfaces tuned to Tabler dark (body #040a11, surface #182433, border #25384f, text #dce1e7).
const dark: MantineColorsTuple = [
  "#dce1e7",
  "#aeb6c2",
  "#7c8797",
  "#566274",
  "#25384f",
  "#1c2a3d",
  "#182433",
  "#0e1726",
  "#040a11",
  "#020509",
];

// Build a Mantine theme for the given primary color key (a Tabler color name). "brand" tracks the
// selected primary so existing `color="brand"` usages follow the picker.
export function buildTheme(primary: string) {
  const brand = tablerColors[primary] ?? tablerColors.blue;
  return createTheme({
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
    fontFamilyMonospace: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    primaryColor: "brand",
    primaryShade: { light: 6, dark: 5 },
    defaultRadius: "sm",
    autoContrast: true,
    luminanceThreshold: 0.4,
    white: "#ffffff",
    black: "#182433",
    fontSizes: { xs: "0.75rem", sm: "0.8125rem", md: "0.875rem", lg: "1rem", xl: "1.125rem" },
    colors: { ...tablerColors, brand, success, danger, warning, info, dark },
    headings: { fontWeight: "600" },
    components: {
      Paper: Paper.extend({ defaultProps: { withBorder: true, radius: "sm" } }),
      Card: Card.extend({ defaultProps: { withBorder: true, radius: "sm" } }),
      Badge: Badge.extend({ defaultProps: { variant: "light" } }),
      Tooltip: Tooltip.extend({ defaultProps: { withArrow: true } }),
      Table: Table.extend({ defaultProps: { highlightOnHover: true, verticalSpacing: "xs" } }),
    },
  });
}

// Default theme (blue primary) — used by tests and as the provider's initial value.
export const theme = buildTheme("blue");

// ── Tabler-style theme settings (persisted; applied by ThemeSettingsProvider) ──────────────────

export type FontKey = "sans" | "serif" | "mono";

export interface ThemeSettings {
  primary: string; // Tabler color name
  radius: number; // px
  font: FontKey;
}

export const DEFAULT_THEME_SETTINGS: ThemeSettings = { primary: "blue", radius: 4, font: "sans" };

export const RADIUS_OPTIONS = [
  { value: 0, label: "0" },
  { value: 2, label: "Pequeno" },
  { value: 4, label: "Padrão" },
  { value: 6, label: "Médio" },
  { value: 8, label: "Grande" },
];

export const FONT_OPTIONS: { value: FontKey; label: string; family: string }[] = [
  { value: "sans", label: "Sans", family: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif" },
  { value: "serif", label: "Serif", family: "Georgia, Cambria, 'Times New Roman', Times, serif" },
  { value: "mono", label: "Mono", family: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" },
];

const STORAGE_KEY = "c3bot-theme-settings";

export function loadThemeSettings(): ThemeSettings {
  if (typeof window === "undefined") return DEFAULT_THEME_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ThemeSettings>;
    return {
      primary: typeof parsed.primary === "string" && tablerColors[parsed.primary] ? parsed.primary : DEFAULT_THEME_SETTINGS.primary,
      radius: typeof parsed.radius === "number" ? parsed.radius : DEFAULT_THEME_SETTINGS.radius,
      font: parsed.font === "serif" || parsed.font === "mono" ? parsed.font : "sans",
    };
  } catch {
    return DEFAULT_THEME_SETTINGS;
  }
}

export function saveThemeSettings(settings: ThemeSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore persistence errors
  }
}

export function fontFamilyFor(font: FontKey): string {
  return (FONT_OPTIONS.find((f) => f.value === font) ?? FONT_OPTIONS[0]).family;
}

// Semantic color tokens — components reference these instead of literal color names.
export type StatusState = "OK" | "WARNING" | "CLOSED" | "ERROR";

export const STATUS_COLORS: Record<StatusState, string> = {
  OK: "success",
  WARNING: "warning",
  CLOSED: "gray",
  ERROR: "danger",
};

export const UNMAPPED_COLOR = "warning";
export const MONEY_COLOR = "success";
