// Single source of design tokens. The concrete CSS-variable values live in src/index.css
// (:root / .dark); this module names the selectable options the appearance settings expose and the
// defaults that seed the provider. Keep token names framework-agnostic.

export const PRIMARY_OPTIONS = [
  "blue", "violet", "emerald", "amber", "rose", "cyan", "slate",
] as const;
export type PrimaryColor = (typeof PRIMARY_OPTIONS)[number];

export const FONT_OPTIONS = ["inter", "poppins", "roboto", "openSans", "montserrat"] as const;
export type FontFamily = (typeof FONT_OPTIONS)[number];

export const FONT_STACKS: Record<FontFamily, string> = {
  inter: "Inter, ui-sans-serif, system-ui, sans-serif",
  poppins: "Poppins, ui-sans-serif, system-ui, sans-serif",
  roboto: "Roboto, ui-sans-serif, system-ui, sans-serif",
  openSans: "'Open Sans', ui-sans-serif, system-ui, sans-serif",
  montserrat: "Montserrat, ui-sans-serif, system-ui, sans-serif",
};

export const DENSITY_OPTIONS = ["compact", "normal", "comfortable"] as const;
export type Density = (typeof DENSITY_OPTIONS)[number];

export const RADIUS_OPTIONS = ["sm", "md", "lg"] as const;
export type RadiusPreset = (typeof RADIUS_OPTIONS)[number];
export const RADIUS_REM: Record<RadiusPreset, string> = { sm: "0.375rem", md: "0.5rem", lg: "0.75rem" };

export const COLOR_MODES = ["light", "dark", "auto"] as const;
export type ColorMode = (typeof COLOR_MODES)[number];

// HSL triplets (used as `hsl(var(--primary))`) for the selectable primary colors.
export const PRIMARY_HSL: Record<PrimaryColor, string> = {
  blue: "217 91% 60%",
  violet: "262 83% 66%",
  emerald: "160 84% 39%",
  amber: "38 92% 50%",
  rose: "347 77% 60%",
  cyan: "189 94% 43%",
  slate: "215 20% 65%",
};

// Ready-to-use CSS color strings for rendering palette swatches in the appearance picker.
export const PRIMARY_SWATCH: Record<PrimaryColor, string> = Object.fromEntries(
  PRIMARY_OPTIONS.map((c) => [c, `hsl(${PRIMARY_HSL[c]})`]),
) as Record<PrimaryColor, string>;
