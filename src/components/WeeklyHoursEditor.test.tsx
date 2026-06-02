import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import type { ScheduleWindow } from "../domain/types";
import { WeeklyHoursEditor } from "./WeeklyHoursEditor";

function renderEditor(value: ScheduleWindow[], onChange = vi.fn()) {
  render(
    <MantineProvider>
      <WeeklyHoursEditor value={value} onChange={onChange} />
    </MantineProvider>,
  );
  return onChange;
}

describe("WeeklyHoursEditor", () => {
  it("shows 'Fechado' for days without a window", () => {
    renderEditor([{ dayOfWeek: 1, start: "09:00", end: "11:00" }]);
    // 6 closed days (all except Monday).
    expect(screen.getAllByText("Fechado")).toHaveLength(6);
  });

  it("adds a window for a day with the default range", async () => {
    const onChange = renderEditor([]);
    await userEvent.click(screen.getByLabelText("Adicionar janela Seg"));
    expect(onChange).toHaveBeenCalledWith([{ dayOfWeek: 1, start: "08:00", end: "18:00" }]);
  });

  it("edits a window's start time", async () => {
    const onChange = renderEditor([{ dayOfWeek: 1, start: "09:00", end: "11:00" }]);
    const start = screen.getByLabelText("Seg início");
    await userEvent.clear(start);
    await userEvent.type(start, "10:00");
    expect(onChange).toHaveBeenCalled();
  });

  it("removes a window", async () => {
    const onChange = renderEditor([{ dayOfWeek: 1, start: "09:00", end: "11:00" }]);
    await userEvent.click(screen.getByLabelText("Remover janela Seg"));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
