import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { OptionGroupEditor, type OptionGroupSettings, type OptionView } from "./OptionGroupEditor";

const OPTIONS: OptionView[] = [
  { id: "o1", name: "Bacon", priceCents: 300, externalCode: "EXT-B" },
  { id: "o2", name: "Cebola", priceCents: 0, externalCode: "" },
];

function renderEditor(group: OptionGroupSettings, onSaveGroup = vi.fn(), onAddOption = vi.fn()) {
  render(
    <MantineProvider>
      <OptionGroupEditor group={group} options={OPTIONS} onSaveGroup={onSaveGroup} onAddOption={onAddOption} />
    </MantineProvider>,
  );
  return { onSaveGroup, onAddOption };
}

describe("OptionGroupEditor", () => {
  it("shows the mandatory badge when min >= 1", () => {
    renderEditor({ name: "Escolha o lado", minQuantity: 1, maxQuantity: 1 });
    expect(screen.getByText("Obrigatório")).toBeInTheDocument();
  });

  it("does not show mandatory for an optional group (min 0)", () => {
    renderEditor({ name: "Extras", minQuantity: 0, maxQuantity: 3 });
    expect(screen.queryByText("Obrigatório")).not.toBeInTheDocument();
  });

  it("lists options with price and flags unmapped ones", () => {
    renderEditor({ name: "Extras", minQuantity: 0, maxQuantity: 3 });
    expect(screen.getByText("Bacon")).toBeInTheDocument();
    expect(screen.getByText("não mapeado")).toBeInTheDocument(); // only Cebola
  });

  it("blocks saving the group when max < min", () => {
    renderEditor({ name: "Extras", minQuantity: 2, maxQuantity: 1 });
    expect(screen.getByRole("button", { name: "Salvar grupo" })).toBeDisabled();
  });

  it("adds an option", async () => {
    const { onAddOption } = renderEditor({ name: "Extras", minQuantity: 0, maxQuantity: 3 });
    await userEvent.type(screen.getByLabelText("Nova opção"), "Queijo");
    await userEvent.type(screen.getByLabelText("Preço (R$)"), "2.00");
    await userEvent.tab();
    await userEvent.click(screen.getByRole("button", { name: "Adicionar opção" }));
    expect(onAddOption).toHaveBeenCalledWith(expect.objectContaining({ name: "Queijo", priceReais: 2 }));
  });
});
