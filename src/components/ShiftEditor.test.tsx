import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { ShiftEditor, type ShiftRow } from "./ShiftEditor";
import { theme } from "../theme";

function renderEditor(shifts: ShiftRow[], onSave = vi.fn()) {
  render(
    <MantineProvider theme={theme}>
      <ShiftEditor shifts={shifts} onSave={onSave} />
    </MantineProvider>,
  );
  return onSave;
}

describe("ShiftEditor", () => {
  it("disables save when a shift is invalid", () => {
    renderEditor([{ dayOfWeek: "MONDAY", start: "99:99", duration: 180, enabled: true }]);
    expect(screen.getByRole("button", { name: "Salvar horários" })).toBeDisabled();
  });

  it("enables save and emits the rows when all shifts are valid", async () => {
    const rows: ShiftRow[] = [{ dayOfWeek: "MONDAY", start: "11:00", duration: 180, enabled: true }];
    const onSave = renderEditor(rows);
    const save = screen.getByRole("button", { name: "Salvar horários" });
    expect(save).toBeEnabled();
    await userEvent.click(save);
    expect(onSave).toHaveBeenCalledWith(rows);
  });

  it("shows the closed-day hint when there are no shifts", () => {
    renderEditor([]);
    expect(screen.getByText(/o merchant fica fechado/i)).toBeInTheDocument();
  });
});
