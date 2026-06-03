import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { InterruptionsEditor } from "./InterruptionsEditor";
import type { MerchantInterruption } from "../domain/types";
import { theme } from "../theme";

const items: MerchantInterruption[] = [
  { id: "i1", description: "Manutenção", start: "2026-06-03T14:00:00Z", end: "2026-06-03T16:00:00Z" },
];

function renderEditor(onCreate = vi.fn(), onDelete = vi.fn()) {
  render(
    <MantineProvider theme={theme}>
      <InterruptionsEditor interruptions={items} onCreate={onCreate} onDelete={onDelete} />
    </MantineProvider>,
  );
  return { onCreate, onDelete };
}

describe("InterruptionsEditor", () => {
  it("lists existing interruptions", () => {
    renderEditor();
    expect(screen.getByText("Manutenção")).toBeInTheDocument();
  });

  it("disables create until the draft is valid, then emits it", async () => {
    const { onCreate } = renderEditor();
    const create = screen.getByRole("button", { name: "Criar interrupção" });
    expect(create).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Descrição"), "Falta de insumo");
    await userEvent.type(screen.getByLabelText("Início (ISO-8601)"), "2026-06-04T10:00:00Z");
    await userEvent.type(screen.getByLabelText("Fim (ISO-8601)"), "2026-06-04T12:00:00Z");
    expect(create).toBeEnabled();
    await userEvent.click(create);
    expect(onCreate).toHaveBeenCalledWith({ description: "Falta de insumo", start: "2026-06-04T10:00:00Z", end: "2026-06-04T12:00:00Z" });
  });

  it("delegates deletion", async () => {
    const { onDelete } = renderEditor();
    await userEvent.click(screen.getByRole("button", { name: "Remover interrupção" }));
    expect(onDelete).toHaveBeenCalledWith("i1");
  });
});
