import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { CategoryItemsPanel, type CategoryItemView } from "./CategoryItemsPanel";

const ITEMS: CategoryItemView[] = [
  { id: "i1", productId: "p1", productName: "X-Burger", priceCents: 2990, status: "available", externalCode: "EXT-1" },
  { id: "i2", productId: "p2", productName: "Coca lata", priceCents: 700, status: "available", externalCode: "" },
];

function renderPanel(onAdd = vi.fn()) {
  render(
    <MantineProvider>
      <CategoryItemsPanel categoryName="Lanches" items={ITEMS} onAdd={onAdd} />
    </MantineProvider>,
  );
  return onAdd;
}

describe("CategoryItemsPanel", () => {
  it("lists items with price and flags unmapped ones", () => {
    renderPanel();
    expect(screen.getByText("X-Burger")).toBeInTheDocument();
    expect(screen.getByText("Coca lata")).toBeInTheDocument();
    expect(screen.getByText("não mapeado")).toBeInTheDocument(); // only the unmapped Coca
  });

  it("disables add until name and price are valid", async () => {
    renderPanel();
    const add = screen.getByRole("button", { name: "Adicionar item" });
    expect(add).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Produto"), "Batata");
    await userEvent.type(screen.getByLabelText("Preço (R$)"), "12.50");
    await userEvent.tab(); // commit the NumberInput value (blur)
    expect(add).toBeEnabled();
  });

  it("emits the add payload and clears the form", async () => {
    const onAdd = renderPanel();
    await userEvent.type(screen.getByLabelText("Produto"), "Batata");
    await userEvent.type(screen.getByLabelText("Preço (R$)"), "12.50");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar item" }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Batata", unitOfMeasure: "unit", priceReais: 12.5 }),
    );
  });
});

describe("CategoryItemsPanel add-to-order guard (FR-012)", () => {
  function renderWithOrder(item: CategoryItemView, onAddToOrder = vi.fn()) {
    render(
      <MantineProvider>
        <CategoryItemsPanel categoryName="Lanches" items={[item]} onAdd={vi.fn()} onAddToOrder={onAddToOrder} />
      </MantineProvider>,
    );
    return onAddToOrder;
  }

  it("adds an available, mapped item with no warnings", async () => {
    const onAddToOrder = renderWithOrder({
      id: "i1",
      productId: "p1",
      productName: "X-Burger",
      priceCents: 2990,
      status: "available",
      externalCode: "EXT-1",
    });
    await userEvent.click(screen.getByRole("button", { name: "Adicionar ao pedido" }));
    expect(onAddToOrder).toHaveBeenCalledWith(expect.objectContaining({ id: "i1" }), []);
  });

  it("adds an unmapped item but passes a non-blocking warning", async () => {
    const onAddToOrder = renderWithOrder({
      id: "i2",
      productId: "p2",
      productName: "Coca lata",
      priceCents: 700,
      status: "available",
      externalCode: "",
    });
    await userEvent.click(screen.getByRole("button", { name: "Adicionar ao pedido" }));
    expect(onAddToOrder).toHaveBeenCalledWith(expect.objectContaining({ id: "i2" }), [
      expect.stringContaining("não mapeado"),
    ]);
  });

  it("blocks adding an unavailable item", () => {
    renderWithOrder({
      id: "i3",
      productId: "p3",
      productName: "Sopa",
      priceCents: 1500,
      status: "unavailable",
      externalCode: "EXT-3",
    });
    expect(screen.getByRole("button", { name: "Adicionar ao pedido" })).toBeDisabled();
    expect(screen.getByText("indisponível")).toBeInTheDocument();
  });
});
