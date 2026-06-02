import type { ScheduleWindow } from "../domain/types";

// Typed client for the catalog HTTP API (consumed via VITE_C3BOT_API_BASE_URL). One function
// per endpoint; payloads are plain objects matching scripts/api/* handlers.

const apiToken = import.meta.env.VITE_C3BOT_API_TOKEN?.trim();

export function getConfiguredCatalogApiBaseUrl(): string | undefined {
  const configuredUrl = import.meta.env.VITE_C3BOT_API_BASE_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");
  if (import.meta.env.DEV && typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3922`;
  }
  return undefined;
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiToken) headers.Authorization = `Bearer ${apiToken}`;
  const response = await fetch(url, { ...init, headers: { ...headers, ...(init?.headers ?? {}) } });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export interface StorePayload {
  name: string;
  cnpj?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  externalCode?: string | null;
}

export interface CatalogPayload {
  name: string;
  context?: "delivery" | "indoor" | "takeout";
  externalCode?: string | null;
}

export interface CategoryPayload {
  name: string;
  template?: "default" | "pizza" | "combo";
  externalCode?: string | null;
}

export interface ProductPayload {
  name: string;
  description?: string | null;
  imageBase64?: string | null;
  unitOfMeasure?: "unit" | "weight";
  referenceWeightGrams?: number | null;
  externalCode?: string | null;
}

export interface ItemPayload {
  productId: string;
  priceCents: number;
  originalPriceCents?: number | null;
  externalCode?: string | null;
}

export interface OptionGroupPayload {
  name: string;
  minQuantity: number;
  maxQuantity: number;
  externalCode?: string | null;
}

export interface OptionPayload {
  name: string;
  priceCents: number;
  externalCode?: string | null;
}

const body = (value: unknown) => JSON.stringify(value);

export function createCatalogClient(baseUrl: string) {
  const json = <T>(path: string, init?: RequestInit) => requestJson<T>(`${baseUrl}${path}`, init);
  const send = (path: string, method: string, value: unknown) => json<unknown>(path, { method, body: body(value) });
  const hours = (path: string, windows: ScheduleWindow[]) => json<{ ok: true }>(path, { method: "PUT", body: body({ windows }) });

  return {
    getStore: <T>() => json<T>("/api/store"),
    updateStore: (payload: StorePayload) => send("/api/store", "PUT", payload),
    setStoreHours: (windows: ScheduleWindow[]) => hours("/api/store/hours", windows),

    listCatalogs: <T>() => json<T>("/api/catalogs"),
    createCatalog: (payload: CatalogPayload) => send("/api/catalogs", "POST", payload),
    updateCatalog: (id: string, payload: CatalogPayload) => send(`/api/catalogs/${encodeURIComponent(id)}`, "PUT", payload),
    removeCatalog: (id: string) => json<unknown>(`/api/catalogs/${encodeURIComponent(id)}`, { method: "DELETE" }),
    setCatalogHours: (id: string, windows: ScheduleWindow[]) => hours(`/api/catalogs/${encodeURIComponent(id)}/hours`, windows),

    listCategories: <T>(catalogId: string) => json<T>(`/api/catalogs/${encodeURIComponent(catalogId)}/categories`),
    createCategory: (catalogId: string, payload: CategoryPayload) =>
      send(`/api/catalogs/${encodeURIComponent(catalogId)}/categories`, "POST", payload),
    updateCategory: (id: string, payload: CategoryPayload) => send(`/api/categories/${encodeURIComponent(id)}`, "PUT", payload),
    removeCategory: (id: string) => json<unknown>(`/api/categories/${encodeURIComponent(id)}`, { method: "DELETE" }),
    reorderCategories: (anyId: string, orderedIds: string[]) =>
      send(`/api/categories/${encodeURIComponent(anyId)}/order`, "PUT", { orderedIds }),

    listProducts: <T>() => json<T>("/api/products"),
    createProduct: (payload: ProductPayload) => send("/api/products", "POST", payload),
    updateProduct: (id: string, payload: ProductPayload) => send(`/api/products/${encodeURIComponent(id)}`, "PUT", payload),
    removeProduct: (id: string) => json<unknown>(`/api/products/${encodeURIComponent(id)}`, { method: "DELETE" }),
    setProductStatus: (id: string, status: "available" | "unavailable" | "paused", pauseUntil: string | null = null) =>
      send(`/api/products/${encodeURIComponent(id)}/status`, "PATCH", { status, pauseUntil }),

    createItem: (categoryId: string, payload: ItemPayload) =>
      send(`/api/categories/${encodeURIComponent(categoryId)}/items`, "POST", payload),
    listItems: <T>(categoryId: string) => json<T>(`/api/categories/${encodeURIComponent(categoryId)}/items`),
    updateItem: (id: string, payload: ItemPayload) => send(`/api/items/${encodeURIComponent(id)}`, "PUT", payload),
    removeItem: (id: string) => json<unknown>(`/api/items/${encodeURIComponent(id)}`, { method: "DELETE" }),

    listOptionGroups: <T>(productId: string) => json<T>(`/api/products/${encodeURIComponent(productId)}/option-groups`),
    createOptionGroup: (productId: string, payload: OptionGroupPayload) =>
      send(`/api/products/${encodeURIComponent(productId)}/option-groups`, "POST", payload),
    updateOptionGroup: (id: string, payload: OptionGroupPayload) =>
      send(`/api/option-groups/${encodeURIComponent(id)}`, "PUT", payload),
    removeOptionGroup: (id: string) => json<unknown>(`/api/option-groups/${encodeURIComponent(id)}`, { method: "DELETE" }),
    listOptions: <T>(groupId: string) => json<T>(`/api/option-groups/${encodeURIComponent(groupId)}/options`),
    createOption: (groupId: string, payload: OptionPayload) =>
      send(`/api/option-groups/${encodeURIComponent(groupId)}/options`, "POST", payload),
    updateOption: (id: string, payload: OptionPayload) => send(`/api/options/${encodeURIComponent(id)}`, "PUT", payload),
    removeOption: (id: string) => json<unknown>(`/api/options/${encodeURIComponent(id)}`, { method: "DELETE" }),

    getPizzaConfig: <T>(categoryId: string) => json<T>(`/api/categories/${encodeURIComponent(categoryId)}/pizza-config`),
    putPizzaConfig: (categoryId: string, pricingStrategy: "highest" | "average") =>
      send(`/api/categories/${encodeURIComponent(categoryId)}/pizza-config`, "PUT", { pricingStrategy }),
    setPizzaSizes: (configId: string, sizes: unknown[]) => send(`/api/pizza-config/${encodeURIComponent(configId)}/sizes`, "PUT", sizes),
    setPizzaCrusts: (configId: string, crusts: unknown[]) => send(`/api/pizza-config/${encodeURIComponent(configId)}/crusts`, "PUT", crusts),
    setPizzaEdges: (configId: string, edges: unknown[]) => send(`/api/pizza-config/${encodeURIComponent(configId)}/edges`, "PUT", edges),
    setPizzaFlavors: (configId: string, flavors: unknown[]) => send(`/api/pizza-config/${encodeURIComponent(configId)}/flavors`, "PUT", flavors),
    setPizzaFlavorPrices: (configId: string, prices: unknown[]) =>
      send(`/api/pizza-config/${encodeURIComponent(configId)}/flavor-prices`, "PUT", prices),
    setComboComponents: (itemId: string, components: unknown[]) =>
      send(`/api/items/${encodeURIComponent(itemId)}/combo-components`, "PUT", components),

    getMappingReadiness: <T>(catalogId: string) =>
      json<T>(`/api/catalogs/${encodeURIComponent(catalogId)}/mapping-readiness`),
  };
}

export type CatalogApiClient = ReturnType<typeof createCatalogClient>;
