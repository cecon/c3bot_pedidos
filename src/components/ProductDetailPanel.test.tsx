import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import type { CatalogApiClient } from "../services/catalogApi";
import { ProductDetailPanel } from "./ProductDetailPanel";

function fakeClient(over: Partial<CatalogApiClient> = {}): CatalogApiClient {
  const base = {
    getProduct: vi.fn(async () => ({ status: "available", pauseUntil: null })),
    listOptionGroups: vi.fn(async () => [{ id: "g1", name: "Lados", minQuantity: 1, maxQuantity: 1 }]),
    listOptions: vi.fn(async () => [{ id: "o1", name: "Fritas", priceCents: 500, externalCode: "E" }]),
    createOptionGroup: vi.fn(async () => ({})),
    updateOptionGroup: vi.fn(async () => ({})),
    createOption: vi.fn(async () => ({})),
    setProductStatus: vi.fn(async () => ({})),
    getPizzaConfig: vi.fn(async () => ({
      config: { id: "c", pricingStrategy: "highest" },
      sizes: [],
      crusts: [],
      edges: [],
      flavors: [],
      flavorPrices: [],
    })),
    listComboComponents: vi.fn(async () => []),
  };
  return { ...base, ...over } as unknown as CatalogApiClient;
}

function renderPanel(template: "default" | "pizza" | "combo", client = fakeClient()) {
  render(
    <MantineProvider>
      <ProductDetailPanel
        client={client}
        productId="p1"
        productName="X-Burger"
        categoryId="cat1"
        categoryTemplate={template}
        itemId="it1"
        products={[{ id: "p1", name: "X-Burger" }]}
        onClose={vi.fn()}
      />
    </MantineProvider>,
  );
}

describe("ProductDetailPanel", () => {
  it("shows availability and the product's option groups", async () => {
    renderPanel("default");
    expect(screen.getByText("Complementos")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("Lados")).toBeInTheDocument(); // loaded option group
    expect(screen.getByText("Fritas")).toBeInTheDocument(); // its option
  });

  it("shows the pizza editor for a pizza category", async () => {
    renderPanel("pizza");
    expect(await screen.findByText("Salvar pizza")).toBeInTheDocument();
  });

  it("shows the combo editor for a combo category", async () => {
    renderPanel("combo");
    expect(await screen.findByText("Componentes do combo")).toBeInTheDocument();
  });

  it("creates a new option group", async () => {
    const createOptionGroup = vi.fn(async () => ({}));
    renderPanel("default", fakeClient({ createOptionGroup }));
    await screen.findByText("Complementos");
    await userEvent.type(screen.getByLabelText("Novo grupo"), "Bordas");
    await userEvent.click(screen.getByRole("button", { name: "Criar grupo" }));
    expect(createOptionGroup).toHaveBeenCalledWith("p1", expect.objectContaining({ name: "Bordas" }));
  });
});
