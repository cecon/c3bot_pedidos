import type { PizzaPricingStrategy } from "../types";

// Pure pizza price computation (no IO). The pricing strategy is a configuration value and the
// set is extensible by adding an enum value + a branch here, with no schema change.
// See FR-021..023, SC-005 and the clarification: >=1 flavor, per-size flavor prices, a flavor
// without a per-size price is invalid.

export interface PizzaSelection {
  // Selected flavors' prices FOR THE CHOSEN SIZE (cents). `null` marks a flavor that has no
  // price configured for that size (invalid).
  flavorPricesForSize: Array<number | null>;
  crustPriceCents?: number;
  edgePriceCents?: number;
}

export interface PizzaPricingConfig {
  strategy: PizzaPricingStrategy;
  maxFlavors: number;
}

export type PizzaPriceResult = { ok: true; priceCents: number } | { ok: false; error: string };

function baseFromStrategy(strategy: PizzaPricingStrategy, prices: number[]): number {
  if (strategy === "average") {
    const sum = prices.reduce((total, price) => total + price, 0);
    return Math.round(sum / prices.length);
  }
  // "highest"
  return Math.max(...prices);
}

export function computePizzaPrice(selection: PizzaSelection, config: PizzaPricingConfig): PizzaPriceResult {
  const flavors = selection.flavorPricesForSize;
  if (flavors.length < 1) {
    return { ok: false, error: "Selecione ao menos 1 sabor." };
  }
  if (flavors.length > config.maxFlavors) {
    return { ok: false, error: `Máximo de ${config.maxFlavors} sabores para este tamanho.` };
  }
  if (flavors.some((price) => price === null || !Number.isFinite(price))) {
    return { ok: false, error: "Sabor sem preço para o tamanho escolhido." };
  }

  const prices = flavors as number[];
  const base = baseFromStrategy(config.strategy, prices);
  const priceCents = base + (selection.crustPriceCents ?? 0) + (selection.edgePriceCents ?? 0);
  return { ok: true, priceCents };
}
