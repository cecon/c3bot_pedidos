import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MantineProvider } from "@mantine/core";
import { describe, expect, it, vi } from "vitest";
import type {
  Attendant,
  AttendantFormValues,
  AttendantMutationResult,
  AvailabilityStatus,
} from "../domain/types";
import { AttendantsPanel } from "./AttendantsPanel";

const attendants: Attendant[] = [
  {
    id: "att-ana",
    name: "Ana Paula",
    displayName: "Ana",
    whatsappNumber: "+55 11 98888-1040",
    role: "attendant",
    active: true,
    availabilityStatus: "online",
    photoBase64: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
    createdAt: "2026-05-28T10:00:00.000Z",
    updatedAt: "2026-05-28T10:00:00.000Z",
  },
  {
    id: "att-maria",
    name: "Maria Alves",
    displayName: "Maria",
    whatsappNumber: "+55 11 96666-9988",
    role: "attendant",
    active: true,
    availabilityStatus: "offline",
    createdAt: "2026-05-28T10:10:00.000Z",
    updatedAt: "2026-05-28T10:10:00.000Z",
  },
];

function renderPanel(
  overrides: Partial<{
    activeSessionCountByAttendant: Record<string, number>;
    attendants: Attendant[];
    onCreateAttendant: (values: AttendantFormValues) => AttendantMutationResult;
    onDeleteAttendant: (attendantId: string) => AttendantMutationResult;
    onSetAvailability: (attendantId: string, availabilityStatus: AvailabilityStatus) => void;
    onUpdateAttendant: (attendantId: string, values: AttendantFormValues) => AttendantMutationResult;
  }> = {},
) {
  const props = {
    activeSessionCountByAttendant: { "att-ana": 2 },
    attendants,
    onCreateAttendant: vi.fn(() => ({ ok: true })),
    onDeleteAttendant: vi.fn(() => ({ ok: true })),
    onSetAvailability: vi.fn(),
    onUpdateAttendant: vi.fn(() => ({ ok: true })),
    ...overrides,
  };

  render(
    <MantineProvider>
      <AttendantsPanel {...props} />
    </MantineProvider>,
  );

  return props;
}

describe("AttendantsPanel", () => {
  it("renders attendant list with identity, status, photo placeholder, and row actions", () => {
    renderPanel();

    expect(screen.getByText("Atendentes")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Ana Paula")).toBeInTheDocument();
    expect(screen.getByText("+55 11 98888-1040")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Editar Ana" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excluir Ana" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tornar offline Ana" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tornar online Maria" })).toBeInTheDocument();
  });

  it("renders an empty state with an add action", () => {
    renderPanel({ attendants: [] });

    expect(screen.getByText("Nenhum atendente cadastrado")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Adicionar primeiro atendente" })).toBeInTheDocument();
  });

  it("validates required fields and creates a new attendant with a loaded photo", async () => {
    const user = userEvent.setup();
    const onCreateAttendant = vi.fn((values: AttendantFormValues) => {
      void values;
      return { ok: true };
    });
    renderPanel({ onCreateAttendant });

    await user.click(screen.getByRole("button", { name: "Adicionar atendente" }));
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Informe o nome do funcionario.")).toBeInTheDocument();
    expect(screen.getByText("Informe o nome para exibicao.")).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Nome$/), "Lucas Rocha");
    await user.type(screen.getByLabelText(/Nome para exibicao/), "Lucas");
    await user.type(screen.getByLabelText(/WhatsApp obrigatorio/), "11977772030");
    await user.upload(
      screen.getByLabelText(/Foto do funcionario/),
      new File(["avatar"], "avatar.png", { type: "image/png" }),
    );

    expect(await screen.findByText("Foto carregada")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(onCreateAttendant).toHaveBeenCalledTimes(1));
    expect(onCreateAttendant.mock.calls[0][0]).toMatchObject({
      name: "Lucas Rocha",
      displayName: "Lucas",
      whatsappNumber: "11977772030",
      photoBase64: expect.stringMatching(/^data:image\/png;base64,/),
    });
  });

  it("edits attendants, toggles availability, and confirms deletion", async () => {
    const user = userEvent.setup();
    const onUpdateAttendant = vi.fn(() => ({ ok: true }));
    const onSetAvailability = vi.fn();
    const onDeleteAttendant = vi.fn(() => ({
      ok: false,
      message: "Transfira ou resolva as sessoes ativas antes de excluir este atendente.",
    }));
    renderPanel({ onDeleteAttendant, onSetAvailability, onUpdateAttendant });

    await user.click(screen.getByRole("button", { name: "Editar Ana" }));
    await user.clear(screen.getByLabelText(/Nome para exibicao/));
    await user.type(screen.getByLabelText(/Nome para exibicao/), "Ana Delivery");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onUpdateAttendant).toHaveBeenCalledWith(
      "att-ana",
      expect.objectContaining({ displayName: "Ana Delivery" }),
    );

    await user.click(screen.getByRole("button", { name: "Tornar offline Ana" }));
    expect(onSetAvailability).toHaveBeenCalledWith("att-ana", "offline");

    await user.click(screen.getByRole("button", { name: "Excluir Ana" }));
    await user.click(screen.getByRole("button", { name: "Confirmar exclusao" }));

    expect(onDeleteAttendant).toHaveBeenCalledWith("att-ana");
    expect(
      screen.getByText("Transfira ou resolva as sessoes ativas antes de excluir este atendente."),
    ).toBeInTheDocument();
  });
});
