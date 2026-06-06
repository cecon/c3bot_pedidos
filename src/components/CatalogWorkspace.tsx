import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Divider, Group, Select, Stack, Text } from "@mantine/core";
import type { CatalogSubPageId } from "../domain/navigation";
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
import { CatalogManager, type CatalogSummary } from "./CatalogManager";
import { CategoryTree, type CategorySummary } from "./CategoryTree";
import { CategoryItemsPanel, type AddItemPayload, type CategoryItemView } from "./CategoryItemsPanel";
import { MappingReviewPanel } from "./MappingReviewPanel";
import { ProductDetailPanel } from "./ProductDetailPanel";

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

function toItemViews(itemRows: ItemRow[], products: ProductRow[]): CategoryItemView[] {
  const nameById = new Map(products.map((product) => [product.id, product.name]));
  return itemRows.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: nameById.get(item.productId) ?? "(produto)",
    priceCents: item.priceCents,
    status: item.status,
    externalCode: item.externalCode,
  }));
}

export function CatalogWorkspace({
  client,
  subPage = "catalogo",
}: {
  client?: CatalogApiClient | null;
  subPage?: CatalogSubPageId;
}) {
  const api = useMemo(() => (client === undefined ? defaultClient() : client), [client]);

  const [state, setState] = useState<CatalogPersistenceState>(() =>
    api ? initialCatalogPersistenceState : getUnavailableCatalogPersistenceState(),
  );
  const [catalogs, setCatalogs] = useState<CatalogSummary[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<CategoryItemView[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [selectedItem, setSelectedItem] = useState<CategoryItemView | null>(null);
  const [readiness, setReadiness] = useState<MappingReadiness | null>(null);

  const loadItems = useCallback(
    async (categoryId: string): Promise<CategoryItemView[]> => {
      if (!api) return [];
      const [itemRows, productRows] = await Promise.all([
        api.listItems<ItemRow[]>(categoryId),
        api.listProducts<ProductRow[]>(),
      ]);
      return toItemViews(itemRows, productRows);
    },
    [api],
  );

  useEffect(() => {
    if (!api) return;
    let active = true;
    void (async () => {
      setState(getLoadingCatalogPersistenceState());
      try {
        const list = await api.listCatalogs<CatalogSummary[]>();
        const productRows = await api.listProducts<ProductRow[]>();
        if (!active) return;
        setCatalogs(list);
        setProducts(productRows);
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
    setProducts(await api.listProducts<ProductRow[]>());
    await refreshReadiness();
  };

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId);

  const selectCatalog = (id: string | null) => {
    setActiveId(id ?? undefined);
    setSelectedCategoryId(undefined);
    setSelectedItem(null);
  };
  const selectGroup = (id: string | null) => {
    setSelectedCategoryId(id ?? undefined);
    setSelectedItem(null);
  };

  const catalogPicker = (
    <Select
      label="Catálogo"
      placeholder="Selecione um catálogo"
      data={catalogs.map((catalog) => ({ value: catalog.id, label: catalog.name }))}
      value={activeId ?? null}
      onChange={selectCatalog}
      w={260}
    />
  );
  const groupPicker = (
    <Select
      label="Grupo"
      placeholder={activeId ? "Selecione um grupo" : "Escolha um catálogo primeiro"}
      data={categories.map((category) => ({ value: category.id, label: category.name }))}
      value={selectedCategoryId ?? null}
      onChange={selectGroup}
      disabled={!activeId}
      w={260}
    />
  );

  // Sub-page: catalog registration (create/select catalogs) + integration readiness.
  if (subPage === "catalogo") {
    return (
      <Stack gap="lg">
        <CatalogManager
          catalogs={catalogs}
          activeId={activeId}
          onSelect={setActiveId}
          onCreate={async (name, context) => {
            await api.createCatalog({ name, context });
            setCatalogs(await api.listCatalogs<CatalogSummary[]>());
          }}
        />
        {readiness && (
          <>
            <Divider />
            <MappingReviewPanel readiness={readiness} />
          </>
        )}
      </Stack>
    );
  }

  // Sub-page: groups (categories) of the selected catalog.
  if (subPage === "grupos") {
    return (
      <Stack gap="lg">
        {catalogPicker}
        {activeId ? (
          <CategoryTree
            categories={categories}
            activeId={selectedCategoryId}
            onSelect={(id) => {
              setSelectedCategoryId(id);
              setSelectedItem(null);
            }}
            onCreate={async (name) => {
              await api.createCategory(activeId, { name });
              await reloadCategories();
            }}
            onReorder={async (orderedIds) => {
              if (orderedIds.length > 0) await api.reorderCategories(orderedIds[0], orderedIds);
              await reloadCategories();
            }}
          />
        ) : (
          <Alert color="gray" variant="light">
            Selecione um catálogo para gerenciar seus grupos.
          </Alert>
        )}
      </Stack>
    );
  }

  // Sub-page: products (items) of the selected group.
  return (
    <Stack gap="lg">
      <Group gap="md" align="end">
        {catalogPicker}
        {groupPicker}
      </Group>
      {!activeId ? (
        <Alert color="gray" variant="light">
          Selecione um catálogo e um grupo para gerenciar os produtos.
        </Alert>
      ) : !selectedCategory ? (
        <Alert color="gray" variant="light">
          Selecione um grupo para ver e adicionar produtos.
        </Alert>
      ) : (
        <>
          <CategoryItemsPanel
            categoryName={selectedCategory.name}
            items={items}
            onAdd={addItem}
            onOpenItem={setSelectedItem}
          />
          {selectedItem && (
            <ProductDetailPanel
              client={api}
              productId={selectedItem.productId}
              productName={selectedItem.productName}
              categoryId={selectedCategory.id}
              categoryTemplate={selectedCategory.template}
              itemId={selectedItem.id}
              products={products}
              onClose={() => setSelectedItem(null)}
            />
          )}
        </>
      )}
    </Stack>
  );
}
