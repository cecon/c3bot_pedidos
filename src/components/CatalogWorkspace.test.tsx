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
    updateStore: vi.fn(async () => ({})),
    createCatalog: vi.fn(async () => ({})),
    createCategory: vi.fn(async () => ({})),
    reorderCategories: vi.fn(async () => ({})),
  };
  return { ...base, ...overrides } as unknown as CatalogApiClient;
}

function renderWorkspace(client: CatalogApiClient | null) {
  render(
    <MantineProvider>
      <CatalogWorkspace client={client} />
    </MantineProvider>,
  );
}

describe("CatalogWorkspace", () => {
  it("shows the unavailable state when no API client is configured", () => {
    renderWorkspace(null);
    expect(screen.getByText(/indisponivel/i)).toBeInTheDocument();
  });

  it("loads and renders the store, catalogs and categories hierarchy", async () => {
    renderWorkspace(fakeClient());
    // Store profile (name input value)
    expect(await screen.findByDisplayValue("Minha Loja")).toBeInTheDocument();
    // Catalog selector
    expect(screen.getByRole("button", { name: "Delivery" })).toBeInTheDocument();
    // Category under the active catalog
    expect(await screen.findByText("Lanches")).toBeInTheDocument();
  });
});
