import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AttendantsPanel } from "./AttendantsPanel";
import type { Attendant } from "../domain/types";

function attendant(id: string): Attendant {
  return {
    id,
    name: `${id} full`,
    displayName: id,
    whatsappNumber: "+55 11 90000-0000",
    active: true,
    availabilityStatus: "online",
    role: "attendant",
    createdAt: "2026-06-06T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z",
  };
}

function renderPanel(attendants: Attendant[], overrides = {}) {
  const handlers = {
    onCreateAttendant: vi.fn(async () => ({ ok: true as const })),
    onUpdateAttendant: vi.fn(async () => ({ ok: true as const })),
    onDeleteAttendant: vi.fn(async () => ({ ok: true as const })),
    onSetAvailability: vi.fn(),
    ...overrides,
  };
  render(<AttendantsPanel attendants={attendants} persistenceState={{ status: "ready" }} {...handlers} />);
  return handlers;
}

describe("AttendantsPanel", () => {
  it("shows an empty state when there are no attendants", () => {
    renderPanel([]);
    expect(screen.getByText(/Nenhum atendente cadastrado/i)).toBeInTheDocument();
  });

  it("renders an attendant row with its display name and status", () => {
    renderPanel([attendant("Ana")]);
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("opens the create form when the add button is clicked", async () => {
    renderPanel([]);
    await userEvent.click(screen.getByRole("button", { name: /Adicionar atendente/i }));
    expect(screen.getByText("Novo atendente")).toBeInTheDocument();
  });

  it("confirms before deleting and then calls onDeleteAttendant", async () => {
    const { onDeleteAttendant } = renderPanel([attendant("Bia")]);
    await userEvent.click(screen.getByRole("button", { name: /Excluir Bia/i }));
    await userEvent.click(screen.getByRole("button", { name: /Confirmar exclusão/i }));
    expect(onDeleteAttendant).toHaveBeenCalledWith("Bia");
  });
});
