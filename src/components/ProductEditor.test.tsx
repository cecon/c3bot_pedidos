import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { ProductEditor, type ProductEditorValue } from "./ProductEditor";

const BASE: ProductEditorValue = {
  name: "X-Burger",
  description: "",
  unitOfMeasure: "unit",
  referenceWeightGrams: "",
  externalCode: "EXT-1",
};

function renderEditor(initial: Partial<ProductEditorValue> = {}, onSave = vi.fn()) {
  render(
    <MantineProvider>
      <ProductEditor initial={{ ...BASE, ...initial }} onSave={onSave} />
    </MantineProvider>,
  );
  return onSave;
}

describe("ProductEditor", () => {
  it("saves a valid unit product", async () => {
    const onSave = renderEditor();
    const button = screen.getByRole("button", { name: "Salvar produto" });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: "X-Burger", unitOfMeasure: "unit" }));
  });

  it("shows the 'não mapeado' badge when the external code is blank", () => {
    renderEditor({ externalCode: "" });
    expect(screen.getByText("não mapeado")).toBeInTheDocument();
  });

  it("blocks save for a weight product without a reference weight", () => {
    renderEditor({ unitOfMeasure: "weight", referenceWeightGrams: "" });
    expect(screen.getByRole("button", { name: "Salvar produto" })).toBeDisabled();
  });

  it("blocks save when the name is empty", () => {
    renderEditor({ name: "" });
    expect(screen.getByRole("button", { name: "Salvar produto" })).toBeDisabled();
  });
});
