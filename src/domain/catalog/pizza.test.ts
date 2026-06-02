import { describe, expect, it } from "vitest";
import { computePizzaPrice } from "./pizza";

describe("computePizzaPrice", () => {
  it("prices by the highest selected flavor plus crust and edge", () => {
    const result = computePizzaPrice(
      { flavorPricesForSize: [3000, 4500], crustPriceCents: 500, edgePriceCents: 700 },
      { strategy: "highest", maxFlavors: 4 },
    );
    expect(result).toEqual({ ok: true, priceCents: 4500 + 500 + 700 });
  });

  it("prices by the rounded average of selected flavors", () => {
    const result = computePizzaPrice(
      { flavorPricesForSize: [3000, 4500] },
      { strategy: "average", maxFlavors: 4 },
    );
    expect(result).toEqual({ ok: true, priceCents: 3750 });
  });

  it("rounds the average to the nearest cent", () => {
    const result = computePizzaPrice({ flavorPricesForSize: [1000, 1001] }, { strategy: "average", maxFlavors: 4 });
    expect(result).toEqual({ ok: true, priceCents: 1001 }); // 1000.5 -> 1001
  });

  it("requires at least one flavor", () => {
    expect(computePizzaPrice({ flavorPricesForSize: [] }, { strategy: "highest", maxFlavors: 4 }).ok).toBe(false);
  });

  it("rejects more flavors than the size allows", () => {
    expect(
      computePizzaPrice({ flavorPricesForSize: [1, 2, 3] }, { strategy: "highest", maxFlavors: 2 }).ok,
    ).toBe(false);
  });

  it("rejects a flavor without a price for the chosen size", () => {
    expect(
      computePizzaPrice({ flavorPricesForSize: [3000, null] }, { strategy: "highest", maxFlavors: 4 }).ok,
    ).toBe(false);
  });
});
