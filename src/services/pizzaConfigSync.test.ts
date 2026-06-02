import { describe, expect, it, vi } from "vitest";
import type { CatalogApiClient } from "./catalogApi";
import { savePizzaConfig } from "./pizzaConfigSync";
import type { PizzaConfigData } from "../components/PizzaConfigEditor";

const DATA: PizzaConfigData = {
  pricingStrategy: "average",
  sizes: [{ name: "M", maxFlavors: 2 }],
  crusts: [{ name: "Tradicional", priceReais: 0 }],
  edges: [],
  flavors: ["Calabresa", "Mussarela"],
  prices: [
    { flavorIndex: 0, sizeIndex: 0, priceReais: 30 },
    { flavorIndex: 1, sizeIndex: 0, priceReais: 28 },
  ],
};

describe("savePizzaConfig", () => {
  it("upserts the config and maps index-based prices to created flavor/size ids", async () => {
    const setPizzaFlavorPrices = vi.fn(async () => ({}));
    const client = {
      putPizzaConfig: vi.fn(async () => ({})),
      getPizzaConfig: vi.fn(async () => ({
        config: { id: "cfg1" },
        sizes: [{ id: "size-M" }],
        flavors: [{ id: "fl-cal" }, { id: "fl-mus" }],
      })),
      setPizzaSizes: vi.fn(async () => ({})),
      setPizzaCrusts: vi.fn(async () => ({})),
      setPizzaEdges: vi.fn(async () => ({})),
      setPizzaFlavors: vi.fn(async () => ({})),
      setPizzaFlavorPrices,
    } as unknown as CatalogApiClient;

    await savePizzaConfig(client, "cat1", DATA);

    expect(setPizzaFlavorPrices).toHaveBeenCalledWith("cfg1", [
      { pizzaFlavorId: "fl-cal", pizzaSizeId: "size-M", priceCents: 3000 },
      { pizzaFlavorId: "fl-mus", pizzaSizeId: "size-M", priceCents: 2800 },
    ]);
  });
});
