import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { CategoryItemsPanel, type CategoryItemView } from "./CategoryItemsPanel";

const ITEMS: CategoryItemView[] = [
  { id: "i1", productName: "X-Burger", priceCents: 2990, status: "available", externalCode: "EXT-1" },
  { id: "i2", productName: "Coca lata", priceCents: 700, status: "available", externalCode: "" },
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
