import { useCallback, useEffect, useMemo, useState } from "react";
import { Divider, Stack, Text } from "@mantine/core";
import {
  getCatalogPersistenceLabel,
  getErroredCatalogPersistenceState,
  getLoadedCatalogPersistenceState,
  getLoadingCatalogPersistenceState,
  getUnavailableCatalogPersistenceState,
  initialCatalogPersistenceState,
} from "../domain/catalogPersistence";
import type { CatalogPersistenceState } from "../domain/types";
import type { MappingReadiness } from "../domain/catalog/mapping";
import { createCatalogClient, getConfiguredCatalogApiBaseUrl, type CatalogApiClient } from "../services/catalogApi";
import { StoreSettingsEditor, type StoreSettingsValue } from "./StoreSettingsEditor";
import { CatalogManager, type CatalogSummary } from "./CatalogManager";
import { CategoryTree, type CategorySummary } from "./CategoryTree";
import { CategoryItemsPanel, type AddItemPayload, type CategoryItemView } from "./CategoryItemsPanel";
import { MappingReviewPanel } from "./MappingReviewPanel";

interface StoreRow {
  id: string;
  name: string;
  cnpj: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;
  externalCode: string | null;
}
interface ItemRow {
  id: string;
  productId: string;
  priceCents: number;
  status: "available" | "unavailable" | "paused";
  externalCode: string | null;
}
interface ProductRow {
  id: string;
  name: string;
}

function defaultClient(): CatalogApiClient | null {
  const baseUrl = getConfiguredCatalogApiBaseUrl();
  return baseUrl ? createCatalogClient(baseUrl) : null;
}

function toStoreValue(store: StoreRow | null): StoreSettingsValue {
  return {
    name: store?.name ?? "",
    cnpj: store?.cnpj ?? "",
    street: store?.street ?? "",
    city: store?.city ?? "",
    state: store?.state ?? "",
    latitude: store?.latitude ?? "",
    longitude: store?.longitude ?? "",
    externalCode: store?.externalCode ?? "",
  };
}

function toItemViews(itemRows: ItemRow[], products: ProductRow[]): CategoryItemView[] {
  const nameById = new Map(products.map((product) => [product.id, product.name]));
  return itemRows.map((item) => ({
    id: item.id,
    productName: nameById.get(item.productId) ?? "(produto)",
    priceCents: item.priceCents,
    status: item.status,
    externalCode: item.externalCode,
  }));
}

export function CatalogWorkspace({ client }: { client?: CatalogApiClient | null }) {
  const api = useMemo(() => (client === undefined ? defaultClient() : client), [client]);

  const [state, setState] = useState<CatalogPersistenceState>(() =>
    api ? initialCatalogPersistenceState : getUnavailableCatalogPersistenceState(),
  );
  const [store, setStore] = useState<StoreRow | null>(null);
  const [catalogs, setCatalogs] = useState<CatalogSummary[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<CategoryItemView[]>([]);
  const [readiness, setReadiness] = useState<MappingReadiness | null>(null);

  const loadItems = useCallback(
    async (categoryId: string): Promise<CategoryItemView[]> => {
      if (!api) return [];
      const [itemRows, products] = await Promise.all([
        api.listItems<ItemRow[]>(categoryId),
        api.listProducts<ProductRow[]>(),
      ]);
      return toItemViews(itemRows, products);
    },
    [api],
  );

  useEffect(() => {
    if (!api) return;
    let active = true;
    void (async () => {
      setState(getLoadingCatalogPersistenceState());
      try {
        const loadedStore = await api.getStore<StoreRow | null>();
        const list = await api.listCatalogs<CatalogSummary[]>();
        if (!active) return;
        setStore(loadedStore);
        setCatalogs(list);
        setActiveId((current) => current ?? list[0]?.id);
        setState(getLoadedCatalogPersistenceState(list.length));
      } catch (error) {
        if (active) setState(getErroredCatalogPersistenceState(error));
      }
    })();
    return () => {
      active = false;
    };
  }, [api]);

  useEffect(() => {
    if (!api || !activeId) return;
    let active = true;
    api
      .listCategories<CategorySummary[]>(activeId)
      .then((list) => active && setCategories(list))
      .catch(() => active && setCategories([]));
    api
      .getMappingReadiness<MappingReadiness>(activeId)
      .then((value) => active && setReadiness(value))
      .catch(() => active && setReadiness(null));
    return () => {
      active = false;
    };
  }, [api, activeId]);

  useEffect(() => {
    if (!selectedCategoryId) return;
    let active = true;
    loadItems(selectedCategoryId)
      .then((views) => active && setItems(views))
      .catch(() => active && setItems([]));
    return () => {
      active = false;
    };
  }, [selectedCategoryId, loadItems]);

  if (!api || state.status !== "ready") {
    return <Text c="dimmed">{getCatalogPersistenceLabel(state) ?? "Carregando catálogo..."}</Text>;
  }

  const refreshReadiness = async () => {
    if (activeId) setReadiness(await api.getMappingReadiness<MappingReadiness>(activeId));
  };
  const reloadCategories = async () => {
    if (activeId) setCategories(await api.listCategories<CategorySummary[]>(activeId));
    await refreshReadiness();
  };

  const addItem = async (payload: AddItemPayload) => {
    if (!selectedCategoryId) return;
    const created = (await api.createProduct({
      name: payload.name,
      unitOfMeasure: payload.unitOfMeasure,
      referenceWeightGrams: payload.referenceWeightGrams,
      externalCode: payload.externalCode || null,
    })) as { id: string };
    await api.createItem(selectedCategoryId, {
      productId: created.id,
      priceCents: typeof payload.priceReais === "number" ? Math.round(payload.priceReais * 100) : 0,
      externalCode: payload.externalCode || null,
    });
    setItems(await loadItems(selectedCategoryId));
    await refreshReadiness();
  };

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);

  return (
    <Stack gap="lg">
      <StoreSettingsEditor
        initial={toStoreValue(store)}
        onSave={async (value) => {
          await api.updateStore({
            name: value.name,
            cnpj: value.cnpj || null,
            street: value.street || null,
            city: value.city || null,
            state: value.state || null,
            latitude: typeof value.latitude === "number" ? value.latitude : null,
            longitude: typeof value.longitude === "number" ? value.longitude : null,
            externalCode: value.externalCode || null,
          });
          setStore(await api.getStore<StoreRow | null>());
        }}
      />
      <Divider />
      <CatalogManager
        catalogs={catalogs}
        activeId={activeId}
        onSelect={setActiveId}
        onCreate={async (name, context) => {
          await api.createCatalog({ name, context });
          setCatalogs(await api.listCatalogs<CatalogSummary[]>());
        }}
      />
      <Divider />
      <CategoryTree
        categories={activeId ? categories : []}
        activeId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        onCreate={async (name) => {
          if (!activeId) return;
          await api.createCategory(activeId, { name });
          await reloadCategories();
        }}
        onReorder={async (orderedIds) => {
          if (orderedIds.length > 0) await api.reorderCategories(orderedIds[0], orderedIds);
          await reloadCategories();
        }}
      />
      {selectedCategory && (
        <>
          <Divider />
          <CategoryItemsPanel categoryName={selectedCategory.name} items={items} onAdd={addItem} />
        </>
      )}
      {readiness && (
        <>
          <Divider />
          <MappingReviewPanel readiness={readiness} />
        </>
      )}
    </Stack>
  );
}
