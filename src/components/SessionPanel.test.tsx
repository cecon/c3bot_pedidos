import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import type { Attendant, SessionTransferTarget, WhatsAppSession } from "../domain/types";
import { SessionPanel } from "./SessionPanel";

const sessions: WhatsAppSession[] = [
  {
    assignedAttendantId: "",
    automationGroupId: "grp-delivery",
    displayName: "Delivery Centro",
    id: "ses-1",
    lastMessageAt: "agora",
    phoneNumber: "+55 11 99999-0000",
    status: "connected",
    unread: 0,
  },
];

const attendant: Attendant = {
  active: true,
  availabilityStatus: "online",
  createdAt: "2026-05-29T10:00:00.000Z",
  displayName: "Ana",
  id: "att-ana",
  name: "Ana Paula",
  role: "attendant",
  updatedAt: "2026-05-29T10:00:00.000Z",
  whatsappNumber: "+55 11 98888-1040",
};

function renderPanel(transferTargets: SessionTransferTarget[], attendants: Attendant[] = []) {
  render(
    <MantineProvider>
      <SessionPanel
        attendants={attendants}
        currentSessionId="ses-1"
        newSessionNumber=""
        onAddSession={vi.fn()}
        onNewSessionNumberChange={vi.fn()}
        onSearchChange={vi.fn()}
        onSelectSession={vi.fn()}
        onTransferSession={vi.fn()}
        search=""
        sessions={sessions}
        transferBlockedReason="Nenhum atendente online disponivel."
        transferTargets={transferTargets}
      />
    </MantineProvider>,
  );
}

describe("SessionPanel transfer targets", () => {
  it("shows blocked state when no persisted online attendant is available", () => {
    renderPanel([]);

    expect(screen.getByText("Nenhum atendente online disponivel.")).toBeInTheDocument();
    expect(screen.queryByLabelText("Atendente para transferencia")).not.toBeInTheDocument();
  });

  it("renders only provided persisted online targets", () => {
    renderPanel([{ attendantId: "att-ana", displayName: "Ana", whatsappNumber: "+55 11 98888-1040" }], [attendant]);

    expect(screen.getByRole("combobox", { name: "Atendente para transferencia" })).toHaveValue("Ana");
    expect(screen.queryByText("Lucas")).not.toBeInTheDocument();
    expect(screen.getByText("+55 11 99999-0000 - Sem atendente")).toBeInTheDocument();
  });
});
