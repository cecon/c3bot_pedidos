import { Badge, Card, Paper, Table, Tooltip, createTheme, type MantineColorsTuple } from "@mantine/core";

// Single source of truth for the operator-grade dark UI (Constitution V).
// Every color, radius, spacing and component default lives here — components MUST consume these
// tokens (theme colors / semantic maps below) and never hard-code hex/rgb values.

const brand: MantineColorsTuple = [
  "#effcf6",
  "#d8f7e8",
  "#aeeccd",
  "#80e0af",
  "#5ad698",
  "#3fce86",
  "#2ec97b",
  "#20b169",
  "#149d5c",
  "#00884d",
];

// Semantic palettes — named by meaning, not hue, so status/availability signals stay consistent.
const success = brand;

const warning: MantineColorsTuple = [
  "#fff8e1",
  "#ffecb3",
  "#ffe082",
  "#ffd54f",
  "#ffca28",
  "#ffc107",
  "#ffb300",
  "#ffa000",
  "#ff8f00",
  "#ff6f00",
];

const danger: MantineColorsTuple = [
  "#fff5f5",
  "#ffe3e3",
  "#ffc9c9",
  "#ffa8a8",
  "#ff8787",
  "#ff6b6b",
  "#fa5252",
  "#f03e3e",
  "#e03131",
  "#c92a2a",
];

const info: MantineColorsTuple = [
  "#e7f5ff",
  "#d0ebff",
  "#a5d8ff",
  "#74c0fc",
  "#4dabf7",
  "#339af0",
  "#228be6",
  "#1c7ed6",
  "#1971c2",
  "#1864ab",
];

export const theme = createTheme({
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  fontFamilyMonospace: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  primaryColor: "brand",
  // Brand reads well on dark surfaces at shade 5; a touch darker on the (rare) light scheme.
  primaryShade: { light: 6, dark: 5 },
  defaultRadius: "sm",
  autoContrast: true,
  luminanceThreshold: 0.4,
  colors: { brand, success, warning, danger, info },
  headings: { fontWeight: "700" },
  components: {
    Paper: Paper.extend({ defaultProps: { withBorder: true, radius: "sm" } }),
    Card: Card.extend({ defaultProps: { withBorder: true, radius: "sm" } }),
    Badge: Badge.extend({ defaultProps: { variant: "light" } }),
    Tooltip: Tooltip.extend({ defaultProps: { withArrow: true } }),
    Table: Table.extend({ defaultProps: { highlightOnHover: true, verticalSpacing: "xs" } }),
  },
});

// Semantic color tokens — components reference these instead of literal color names, so a palette
// change here propagates everywhere. `state` maps to MerchantStatus (OK | WARNING | CLOSED | ERROR).
export type StatusState = "OK" | "WARNING" | "CLOSED" | "ERROR";

export const STATUS_COLORS: Record<StatusState, string> = {
  OK: "success",
  WARNING: "warning",
  CLOSED: "gray",
  ERROR: "danger",
};

// Element not yet mapped to an external destination (catalog "não mapeado" badge, merchant handoff).
export const UNMAPPED_COLOR = "warning";
// Monetary values (prices, average ticket).
export const MONEY_COLOR = "success";
