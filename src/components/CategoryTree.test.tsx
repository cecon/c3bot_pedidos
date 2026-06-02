import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { CategoryTree, type CategorySummary } from "./CategoryTree";

const CATEGORIES: CategorySummary[] = [
  { id: "a", name: "Lanches", status: "available" },
  { id: "b", name: "Bebidas", status: "available" },
  { id: "c", name: "Sobremesas", status: "available" },
];

function renderTree(onCreate = vi.fn(), onReorder = vi.fn()) {
  render(
    <MantineProvider>
      <CategoryTree categories={CATEGORIES} onCreate={onCreate} onReorder={onReorder} />
    </MantineProvider>,
  );
  return { onCreate, onReorder };
}

describe("CategoryTree", () => {
  it("moves a category down, swapping order ids", async () => {
    const { onReorder } = renderTree();
    await userEvent.click(screen.getByLabelText("Mover Lanches para baixo"));
    expect(onReorder).toHaveBeenCalledWith(["b", "a", "c"]);
  });

  it("moves a category up", async () => {
    const { onReorder } = renderTree();
    await userEvent.click(screen.getByLabelText("Mover Bebidas para cima"));
    expect(onReorder).toHaveBeenCalledWith(["b", "a", "c"]);
  });

  it("disables up on the first and down on the last", () => {
    renderTree();
    expect(screen.getByLabelText("Mover Lanches para cima")).toBeDisabled();
    expect(screen.getByLabelText("Mover Sobremesas para baixo")).toBeDisabled();
  });

  it("creates a category", async () => {
    const { onCreate } = renderTree();
    await userEvent.type(screen.getByLabelText("Nova categoria"), "Combos");
    await userEvent.click(screen.getByRole("button", { name: "Criar" }));
    expect(onCreate).toHaveBeenCalledWith("Combos");
  });
});
