import { Badge, Card, Paper, Table, Tooltip, createTheme, type MantineColorsTuple } from "@mantine/core";

// Single source of truth for the UI, aligned to the Tabler admin look (https://tabler.io).
// Tabler tokens: primary #066fd1, green #2fb344, red #d63939, yellow #f59f00, cyan #17a2b8,
// teal #0ca678; radius 4px; base font 14px; Inter. Surfaces (body/card/border) per color scheme
// are driven by CSS variables in styles.css. Components MUST use these theme tokens — never hex.

// Tabler primary blue (#066fd1 at the light primary shade).
const brand: MantineColorsTuple = [
  "#e7f0fb",
  "#cfe1f7",
  "#9ec3ef",
  "#6ea5e7",
  "#3d87df",
  "#1f76d6",
  "#066fd1",
  "#085fb3",
  "#0a4f95",
  "#0b3f77",
];

// Semantic palettes (named by meaning) using Tabler hues.
const success: MantineColorsTuple = [
  "#e9f9ec",
  "#c9f0d0",
  "#9ee3aa",
  "#6fd382",
  "#46c563",
  "#2fb344",
  "#28a03c",
  "#1f8a32",
  "#177528",
  "#0f5e1f",
];

const danger: MantineColorsTuple = [
  "#fde9e9",
  "#f9caca",
  "#f2a0a0",
  "#ea7575",
  "#e25151",
  "#d63939",
  "#c22f2f",
  "#a72727",
  "#8c2020",
  "#701919",
];

const warning: MantineColorsTuple = [
  "#fff6e2",
  "#ffe9b8",
  "#ffd87f",
  "#ffc647",
  "#fbb21f",
  "#f59f00",
  "#d98c00",
  "#b67400",
  "#925d00",
  "#6f4700",
];

const info: MantineColorsTuple = [
  "#e6f7fa",
  "#c5ecf1",
  "#95dbe6",
  "#63c9da",
  "#39b8cd",
  "#17a2b8",
  "#138ba0",
  "#0f7184",
  "#0b5867",
  "#08404b",
];

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

export const theme = createTheme({
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
  fontFamilyMonospace: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  primaryColor: "brand",
  primaryShade: { light: 6, dark: 5 },
  defaultRadius: "sm", // 4px — matches Tabler
  autoContrast: true,
  luminanceThreshold: 0.4,
  white: "#ffffff",
  black: "#182433",
  // Tabler runs a denser 14px base scale.
  fontSizes: { xs: "0.75rem", sm: "0.8125rem", md: "0.875rem", lg: "1rem", xl: "1.125rem" },
  colors: { brand, success, danger, warning, info, dark },
  headings: { fontWeight: "600" },
  components: {
    Paper: Paper.extend({ defaultProps: { withBorder: true, radius: "sm" } }),
    Card: Card.extend({ defaultProps: { withBorder: true, radius: "sm" } }),
    Badge: Badge.extend({ defaultProps: { variant: "light" } }),
    Tooltip: Tooltip.extend({ defaultProps: { withArrow: true } }),
    Table: Table.extend({ defaultProps: { highlightOnHover: true, verticalSpacing: "xs" } }),
  },
});

// Semantic color tokens — components reference these instead of literal color names.
export type StatusState = "OK" | "WARNING" | "CLOSED" | "ERROR";

export const STATUS_COLORS: Record<StatusState, string> = {
  OK: "success",
  WARNING: "warning",
  CLOSED: "gray",
  ERROR: "danger",
};

// Element not yet mapped to an external destination (catalog "não mapeado" / merchant handoff).
export const UNMAPPED_COLOR = "warning";
// Monetary values (prices, average ticket).
export const MONEY_COLOR = "success";
