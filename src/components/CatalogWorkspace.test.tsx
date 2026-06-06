import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import type { CatalogApiClient } from "../services/catalogApi";
import { CatalogWorkspace } from "./CatalogWorkspace";

function fakeClient(overrides: Partial<CatalogApiClient> = {}): CatalogApiClient {
  const base = {
    getStore: vi.fn(async () => ({ id: "s1", name: "Minha Loja", cnpj: "", street: "", city: "", state: "" })),
    listCatalogs: vi.fn(async () => [{ id: "c1", name: "Delivery", context: "delivery" }]),
    listCategories: vi.fn(async () => [{ id: "cat1", name: "Lanches", status: "available" }]),
    listItems: vi.fn(async () => [
      { id: "it1", productId: "p1", priceCents: 2990, status: "available", externalCode: "EXT-1" },
    ]),
    listProducts: vi.fn(async () => [{ id: "p1", name: "X-Burger" }]),
    updateStore: vi.fn(async () => ({})),
    createCatalog: vi.fn(async () => ({})),
    createCategory: vi.fn(async () => ({})),
    reorderCategories: vi.fn(async () => ({})),
    createProduct: vi.fn(async () => ({ id: "p2" })),
    createItem: vi.fn(async () => ({})),
    getMappingReadiness: vi.fn(async () => ({ ready: false, unmapped: [] })),
  };
  return { ...base, ...overrides } as unknown as CatalogApiClient;
}

function renderWorkspace(client: CatalogApiClient | null, subPage?: "catalogo" | "grupos" | "produtos") {
  render(
    <MantineProvider>
      <CatalogWorkspace client={client} subPage={subPage} />
    </MantineProvider>,
  );
}

describe("CatalogWorkspace", () => {
  it("shows the unavailable state when no API client is configured", () => {
    renderWorkspace(null);
    expect(screen.getByText(/indisponivel/i)).toBeInTheDocument();
  });

  it("registration sub-page lists the catalogs to select", async () => {
    renderWorkspace(fakeClient(), "catalogo");
    expect(await screen.findByRole("button", { name: "Delivery" })).toBeInTheDocument();
  });

  it("groups sub-page lists the categories of the active catalog", async () => {
    renderWorkspace(fakeClient(), "grupos");
    expect(await screen.findByText("Lanches")).toBeInTheDocument();
  });

  it("products sub-page offers catalog + group pickers and gates until a group is chosen", async () => {
    renderWorkspace(fakeClient(), "produtos");
    // Both top selectors are present.
    expect(await screen.findByLabelText("Catálogo")).toBeInTheDocument();
    expect(screen.getByLabelText("Grupo")).toBeInTheDocument();
    // No group selected yet → the products area is gated with a hint instead of an items panel.
    expect(screen.getByText(/Selecione um grupo/i)).toBeInTheDocument();
    expect(screen.queryByText("Itens de Lanches")).not.toBeInTheDocument();
  });
});
