import type { CatalogApiClient } from "./catalogApi";
import type { PizzaConfigData } from "../components/PizzaConfigEditor";

// Persist a pizza configuration: upsert the config, replace its children, then map the
// editor's index-based price grid onto the created flavor/size ids (read back in order) and
// set per-size flavor prices. Kept here so the editor/panel stay presentational.
function toCents(value: number | string): number {
  return typeof value === "number" ? Math.round(value * 100) : 0;
}

interface PizzaConfigReadback {
  config: { id: string };
  sizes: Array<{ id: string }>;
  flavors: Array<{ id: string }>;
}

interface FullReadback {
  config: { pricingStrategy: "highest" | "average" };
  sizes: Array<{ id: string; name: string; maxFlavors: number }>;
  crusts: Array<{ name: string; priceCents: number }>;
  edges: Array<{ name: string; priceCents: number }>;
  flavors: Array<{ id: string; name: string }>;
  flavorPrices: Array<{ pizzaFlavorId: string; pizzaSizeId: string; priceCents: number }>;
}

export function emptyPizzaConfigData(): PizzaConfigData {
  return { pricingStrategy: "highest", sizes: [], crusts: [], edges: [], flavors: [], prices: [] };
}

// Map a getPizzaConfig readback into the editor's index-based shape.
export function toPizzaConfigData(readback: FullReadback): PizzaConfigData {
  const sizeIndex = new Map(readback.sizes.map((size, index) => [size.id, index]));
  const flavorIndex = new Map(readback.flavors.map((flavor, index) => [flavor.id, index]));
  return {
    pricingStrategy: readback.config.pricingStrategy,
    sizes: readback.sizes.map((size) => ({ name: size.name, maxFlavors: size.maxFlavors })),
    crusts: readback.crusts.map((crust) => ({ name: crust.name, priceReais: crust.priceCents / 100 })),
    edges: readback.edges.map((edge) => ({ name: edge.name, priceReais: edge.priceCents / 100 })),
    flavors: readback.flavors.map((flavor) => flavor.name),
    prices: readback.flavorPrices.map((price) => ({
      flavorIndex: flavorIndex.get(price.pizzaFlavorId) ?? 0,
      sizeIndex: sizeIndex.get(price.pizzaSizeId) ?? 0,
      priceReais: price.priceCents / 100,
    })),
  };
}

export async function savePizzaConfig(client: CatalogApiClient, categoryId: string, data: PizzaConfigData): Promise<void> {
  await client.putPizzaConfig(categoryId, data.pricingStrategy);
  const configId = (await client.getPizzaConfig<PizzaConfigReadback>(categoryId)).config.id;

  await client.setPizzaSizes(
    configId,
    data.sizes.map((size) => ({ name: size.name, slices: 0, maxFlavors: typeof size.maxFlavors === "number" ? size.maxFlavors : 1 })),
  );
  await client.setPizzaCrusts(configId, data.crusts.map((crust) => ({ name: crust.name, priceCents: toCents(crust.priceReais) })));
  await client.setPizzaEdges(configId, data.edges.map((edge) => ({ name: edge.name, priceCents: toCents(edge.priceReais) })));
  await client.setPizzaFlavors(configId, data.flavors.map((name) => ({ name })));

  const readback = await client.getPizzaConfig<PizzaConfigReadback>(categoryId);
  const flavorPrices = data.prices
    .map((price) => ({
      pizzaFlavorId: readback.flavors[price.flavorIndex]?.id,
      pizzaSizeId: readback.sizes[price.sizeIndex]?.id,
      priceCents: toCents(price.priceReais),
    }))
    .filter((price): price is { pizzaFlavorId: string; pizzaSizeId: string; priceCents: number } =>
      Boolean(price.pizzaFlavorId && price.pizzaSizeId),
    );
  await client.setPizzaFlavorPrices(configId, flavorPrices);
}
