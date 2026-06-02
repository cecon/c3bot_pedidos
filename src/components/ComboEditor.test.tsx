import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { ComboEditor, type ComboProduct } from "./ComboEditor";

const PRODUCTS: ComboProduct[] = [
  { id: "p1", name: "X-Burger" },
  { id: "p2", name: "Coca lata" },
];

function renderEditor(onSave = vi.fn()) {
  render(
    <MantineProvider>
      <ComboEditor products={PRODUCTS} initial={[{ componentProductId: "p1", quantity: 1 }]} onSave={onSave} />
    </MantineProvider>,
  );
  return onSave;
}

describe("ComboEditor", () => {
  it("renders existing components with quantity and product name", () => {
    renderEditor();
    expect(screen.getByText("1× X-Burger")).toBeInTheDocument();
  });

  it("removes a component", async () => {
    const onSave = renderEditor();
    await userEvent.click(screen.getByLabelText("Remover componente 1"));
    await userEvent.click(screen.getByRole("button", { name: "Salvar combo" }));
    expect(onSave).toHaveBeenCalledWith([]);
  });

  it("saves the current components", async () => {
    const onSave = renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Salvar combo" }));
    expect(onSave).toHaveBeenCalledWith([{ componentProductId: "p1", quantity: 1 }]);
  });
});
