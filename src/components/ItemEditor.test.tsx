import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { ItemEditor, type ItemEditorValue } from "./ItemEditor";

const BASE: ItemEditorValue = {
  priceReais: 29.9,
  originalPriceReais: "",
  status: "available",
  externalCode: "EXT-1",
};

function renderEditor(initial: Partial<ItemEditorValue> = {}, onSave = vi.fn()) {
  render(
    <MantineProvider>
      <ItemEditor initial={{ ...BASE, ...initial }} onSave={onSave} />
    </MantineProvider>,
  );
  return onSave;
}

describe("ItemEditor", () => {
  it("saves a valid item", async () => {
    const onSave = renderEditor();
    const button = screen.getByRole("button", { name: "Salvar item" });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ priceReais: 29.9, status: "available" }));
  });

  it("blocks save when the promotional reference is below the price", () => {
    renderEditor({ priceReais: 29.9, originalPriceReais: 10 });
    expect(screen.getByRole("button", { name: "Salvar item" })).toBeDisabled();
  });

  it("shows the 'não mapeado' badge when the external code is blank", () => {
    renderEditor({ externalCode: "" });
    expect(screen.getByText("não mapeado")).toBeInTheDocument();
  });
});
