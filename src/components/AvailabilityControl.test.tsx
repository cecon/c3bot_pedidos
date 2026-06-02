import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import { AvailabilityControl } from "./AvailabilityControl";

describe("AvailabilityControl", () => {
  it("shows the auto-return field only when paused", () => {
    const { rerender } = render(
      <MantineProvider>
        <AvailabilityControl status="available" pauseUntil={null} onChange={vi.fn()} />
      </MantineProvider>,
    );
    expect(screen.queryByLabelText("Retorno automático")).not.toBeInTheDocument();
    rerender(
      <MantineProvider>
        <AvailabilityControl status="paused" pauseUntil={null} onChange={vi.fn()} />
      </MantineProvider>,
    );
    expect(screen.getByLabelText("Retorno automático")).toBeInTheDocument();
    expect(screen.getByText(/permanece pausado/)).toBeInTheDocument();
  });

  it("emits the auto-return time when set on a paused item", async () => {
    const onChange = vi.fn();
    render(
      <MantineProvider>
        <AvailabilityControl status="paused" pauseUntil={null} onChange={onChange} />
      </MantineProvider>,
    );
    await userEvent.type(screen.getByLabelText("Retorno automático"), "2026-12-01T10:00");
    expect(onChange).toHaveBeenCalledWith("paused", expect.stringContaining("2026-12-01"));
  });
});
