import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { PizzaConfigEditor, type PizzaConfigData } from "./PizzaConfigEditor";

const EMPTY: PizzaConfigData = { pricingStrategy: "highest", sizes: [], crusts: [], edges: [], flavors: [], prices: [] };

function renderEditor(initial: PizzaConfigData = EMPTY, onSave = vi.fn()) {
  render(
    <MantineProvider>
      <PizzaConfigEditor initial={initial} onSave={onSave} />
    </MantineProvider>,
  );
  return onSave;
}

describe("PizzaConfigEditor", () => {
  it("renders the per-size flavor price grid when sizes and flavors exist", () => {
    renderEditor({
      pricingStrategy: "average",
      sizes: [{ name: "M", maxFlavors: 2 }],
      crusts: [],
      edges: [],
      flavors: ["Calabresa"],
      prices: [],
    });
    expect(screen.getByLabelText("Grade de preços por tamanho")).toBeInTheDocument();
    expect(screen.getByLabelText("Preço Calabresa M")).toBeInTheDocument();
  });

  it("adds a size and a flavor", async () => {
    renderEditor();
    await userEvent.type(screen.getByLabelText("Novo tamanho"), "Grande");
    await userEvent.click(screen.getByRole("button", { name: "Tamanho" }));
    await userEvent.type(screen.getByLabelText("Novo sabor"), "Mussarela");
    await userEvent.click(screen.getByRole("button", { name: "Sabor" }));
    // grid now renders for the new size/flavor
    expect(screen.getByLabelText("Preço Mussarela Grande")).toBeInTheDocument();
  });

  it("emits the full config on save", async () => {
    const onSave = renderEditor({
      pricingStrategy: "highest",
      sizes: [{ name: "M", maxFlavors: 2 }],
      crusts: [],
      edges: [],
      flavors: ["Calabresa"],
      prices: [{ flavorIndex: 0, sizeIndex: 0, priceReais: 30 }],
    });
    await userEvent.click(screen.getByRole("button", { name: "Salvar pizza" }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        pricingStrategy: "highest",
        sizes: [{ name: "M", maxFlavors: 2 }],
        flavors: ["Calabresa"],
        prices: [{ flavorIndex: 0, sizeIndex: 0, priceReais: 30 }],
      }),
    );
  });
});
