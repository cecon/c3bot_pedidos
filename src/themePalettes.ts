import type { MantineColorsTuple } from "@mantine/core";

// Tabler primary color options (https://tabler.io). Each base hex is expanded into a 10-shade
// Mantine tuple (base at index 6) so any of them can serve as the selectable primary color —
// mirroring Tabler's theme settings ("data-bs-theme-primary").

export const TABLER_BASE: Record<string, string> = {
  blue: "#066fd1",
  azure: "#4299e1",
  indigo: "#4263eb",
  purple: "#ae3ec9",
  pink: "#d6336c",
  red: "#d63939",
  orange: "#f76707",
  yellow: "#f59f00",
  lime: "#74b816",
  green: "#2fb344",
  teal: "#0ca678",
  cyan: "#17a2b8",
};

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function toHex(rgb: [number, number, number]): string {
  return "#" + rgb.map((c) => clampByte(c).toString(16).padStart(2, "0")).join("");
}

// Mix `hex` toward `target` by `amount` (0..1) in RGB space.
function mix(hex: string, target: [number, number, number], amount: number): string {
  const [r, g, b] = toRgb(hex);
  return toHex([r + (target[0] - r) * amount, g + (target[1] - g) * amount, b + (target[2] - b) * amount]);
}

const WHITE: [number, number, number] = [255, 255, 255];
const BLACK: [number, number, number] = [0, 0, 0];

// Build a 10-shade ramp: 6 lighter steps, the base at index 6, then 3 darker steps.
export function makeScale(hex: string): MantineColorsTuple {
  const lighter = [0.92, 0.78, 0.6, 0.42, 0.26, 0.12].map((a) => mix(hex, WHITE, a));
  const darker = [0.12, 0.28, 0.45].map((a) => mix(hex, BLACK, a));
  return [...lighter, hex, ...darker] as unknown as MantineColorsTuple;
}

// All Tabler colors as Mantine palettes (keyed by Tabler name).
export const tablerColors: Record<string, MantineColorsTuple> = Object.fromEntries(
  Object.entries(TABLER_BASE).map(([name, hex]) => [name, makeScale(hex)]),
);

export interface PrimaryOption {
  value: string;
  label: string;
  hex: string;
}

export const PRIMARY_OPTIONS: PrimaryOption[] = Object.entries(TABLER_BASE).map(([value, hex]) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
  hex,
}));
