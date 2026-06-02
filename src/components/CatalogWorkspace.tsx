import { useEffect, useMemo, useState } from "react";
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
import { createCatalogClient, getConfiguredCatalogApiBaseUrl, type CatalogApiClient } from "../services/catalogApi";
import { StoreSettingsEditor, type StoreSettingsValue } from "./StoreSettingsEditor";
import { CatalogManager, type CatalogSummary } from "./CatalogManager";
import { CategoryTree, type CategorySummary } from "./CategoryTree";

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

export function CatalogWorkspace({ client }: { client?: CatalogApiClient | null }) {
  // Resolve once: an injected client (tests/app), or the configured default. Memoized so the
  // load effects do not re-run every render.
  const api = useMemo(() => (client === undefined ? defaultClient() : client), [client]);

  const [state, setState] = useState<CatalogPersistenceState>(() =>
    api ? initialCatalogPersistenceState : getUnavailableCatalogPersistenceState(),
  );
  const [store, setStore] = useState<StoreRow | null>(null);
  const [catalogs, setCatalogs] = useState<CatalogSummary[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<CategorySummary[]>([]);

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
    return () => {
      active = false;
    };
  }, [api, activeId]);

  if (!api || state.status !== "ready") {
    return <Text c="dimmed">{getCatalogPersistenceLabel(state) ?? "Carregando catálogo..."}</Text>;
  }

  const reloadCatalogs = async () => {
    const list = await api.listCatalogs<CatalogSummary[]>();
    setCatalogs(list);
  };
  const reloadCategories = async () => {
    if (activeId) setCategories(await api.listCategories<CategorySummary[]>(activeId));
  };

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
          await reloadCatalogs();
        }}
      />
      <Divider />
      <CategoryTree
        categories={activeId ? categories : []}
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
    </Stack>
  );
}
