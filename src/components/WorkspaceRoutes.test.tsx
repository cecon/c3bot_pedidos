import { render, screen } from "@testing-library/react";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import type { WorkspaceRoutesProps } from "./WorkspaceRoutes";
import { WorkspaceRoutes } from "./WorkspaceRoutes";

function createProps(overrides: Partial<WorkspaceRoutesProps> = {}): WorkspaceRoutesProps {
  return {
    activeDestinationId: "delivery-attendants",
    activeSessionCountByAttendant: {},
    attendantPersistenceState: { status: "empty" },
    attendants: [],
    automationBindings: [],
    automationGroups: [],
    campaignMessage: "",
    campaignSegment: "",
    campaigns: [],
    channelMode: "human",
    composer: "",
    currentMessages: [],
    customers: [],
    navigateToDestination: vi.fn(),
    newSessionNumber: "",
    onAddProduct: vi.fn(),
    onAddSession: vi.fn(),
    onCampaignMessageChange: vi.fn(),
    onCampaignSegmentChange: vi.fn(),
    onChannelModeChange: vi.fn(),
    onComposerChange: vi.fn(),
    onCreateAttendant: vi.fn(() => ({ ok: true })),
    onDeleteAttendant: vi.fn(() => ({ ok: true })),
    onNewSessionNumberChange: vi.fn(),
    onProductNameChange: vi.fn(),
    onProductPriceChange: vi.fn(),
    onScheduleOrder: vi.fn(),
    onSearchChange: vi.fn(),
    onSelectSession: vi.fn(),
    onSendMessage: vi.fn(),
    onSetAttendantAvailability: vi.fn(),
    onTransferSession: vi.fn(),
    onUpdateAttendant: vi.fn(() => ({ ok: true })),
    orderRows: [],
    productName: "",
    productPrice: 0,
    productRows: [],
    search: "",
    sessionCounts: { connected: 0, connecting: 0, offline: 0, paused: 0 },
    summary: { canceled: 0, done: 0, inProgress: 0, revenueCents: 0, scheduled: 0 },
    transferTargets: [],
    visibleSessions: [],
    ...overrides,
  };
}

describe("WorkspaceRoutes persisted attendant routing", () => {
  it("passes empty persisted attendants without fixture fallback", () => {
    render(
      <MantineProvider>
        <WorkspaceRoutes {...createProps()} />
      </MantineProvider>,
    );

    expect(screen.getByText("Nenhum atendente cadastrado")).toBeInTheDocument();
    expect(screen.queryByText("Ana")).not.toBeInTheDocument();
    expect(screen.queryByText("Lucas")).not.toBeInTheDocument();
  });
});
