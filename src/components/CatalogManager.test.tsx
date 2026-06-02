import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { CatalogManager, type CatalogSummary } from "./CatalogManager";

const CATALOGS: CatalogSummary[] = [
  { id: "c1", name: "Delivery", context: "delivery" },
  { id: "c2", name: "Café da Manhã", context: "delivery" },
];

function renderManager(onSelect = vi.fn(), onCreate = vi.fn()) {
  render(
    <MantineProvider>
      <CatalogManager catalogs={CATALOGS} activeId="c1" onSelect={onSelect} onCreate={onCreate} />
    </MantineProvider>,
  );
  return { onSelect, onCreate };
}

describe("CatalogManager", () => {
  it("lists catalogs and selects one", async () => {
    const { onSelect } = renderManager();
    await userEvent.click(screen.getByRole("button", { name: "Café da Manhã" }));
    expect(onSelect).toHaveBeenCalledWith("c2");
  });

  it("creates a catalog with the chosen name and context", async () => {
    const { onCreate } = renderManager();
    await userEvent.type(screen.getByLabelText("Novo catálogo"), "Almoço");
    await userEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(onCreate).toHaveBeenCalledWith("Almoço", "delivery");
  });

  it("disables create when the name is blank", () => {
    renderManager();
    expect(screen.getByRole("button", { name: "Criar" })).toBeDisabled();
  });
});
