import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Attendant, AttendantFormValues, WhatsAppSession } from "../domain/types";
import type { AttendantManagementRepository } from "../services/attendantRepositoryContract";
import { useAttendantManagement } from "./useAttendantManagement";

vi.mock("../components/ui/toast", () => ({
  toast: vi.fn(),
}));

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

function createRepository(rows: Attendant[] = []): AttendantManagementRepository {
  return {
    createAttendant: vi.fn(async () => undefined),
    listAttendants: vi.fn(async () => rows),
    softDeleteAttendant: vi.fn(async () => undefined),
    updateAttendant: vi.fn(async () => undefined),
    updateAttendantAvailability: vi.fn(async () => undefined),
  };
}

function renderManagement(repository = createRepository(), sessionRows: WhatsAppSession[] = []) {
  const setSessionRows = vi.fn();
  const hook = renderHook(() =>
    useAttendantManagement({
      repository,
      runtimeAvailable: true,
      sessionRows,
      setSessionRows,
    }),
  );

  return { hook, repository, setSessionRows };
}

describe("useAttendantManagement", () => {
  it("loads persisted attendants from the repository", async () => {
    const { hook, repository } = renderManagement(createRepository([attendant]));

    await waitFor(() => expect(hook.result.current.persistenceState.status).toBe("ready"));
    expect(hook.result.current.attendantRows).toEqual([attendant]);
    expect(repository.listAttendants).toHaveBeenCalledTimes(1);
  });

  it("shows unavailable state instead of falling back to mock attendants without a repository", async () => {
    const repository = createRepository([attendant]);
    const hook = renderHook(() =>
      useAttendantManagement({
        repository,
        runtimeAvailable: false,
        sessionRows: [],
        setSessionRows: vi.fn(),
      }),
    );

    await waitFor(() => expect(hook.result.current.persistenceState.status).toBe("unavailable"));
    expect(hook.result.current.attendantRows).toEqual([]);
    expect(repository.listAttendants).not.toHaveBeenCalled();
  });

  it("creates the first persisted attendant and reloads as ready state", async () => {
    const { hook, repository } = renderManagement();
    const values: AttendantFormValues = {
      displayName: "Bruno",
      name: "Bruno Lima",
      whatsappNumber: "11999990000",
    };

    await waitFor(() => expect(hook.result.current.persistenceState.status).toBe("empty"));
    await act(async () => {
      await expect(hook.result.current.createAttendant(values)).resolves.toEqual({ ok: true });
    });

    expect(repository.createAttendant).toHaveBeenCalledWith(expect.objectContaining({ displayName: "Bruno" }));
    expect(hook.result.current.persistenceState.status).toBe("ready");
    expect(hook.result.current.attendantRows[0]).toMatchObject({ displayName: "Bruno" });
  });

  it("rejects stale transfer targets that are not persisted and online", async () => {
    const sessionRows: WhatsAppSession[] = [
      {
        assignedAttendantId: "",
        automationGroupId: "grp",
        displayName: "Sessao",
        id: "ses-1",
        lastMessageAt: "agora",
        phoneNumber: "+55 11 99999-0000",
        status: "connected",
        unread: 0,
      },
    ];
    const { hook, setSessionRows } = renderManagement(createRepository([]), sessionRows);

    await waitFor(() => expect(hook.result.current.persistenceState.status).toBe("empty"));
    act(() => hook.result.current.transferSession("ses-1", "att-mock"));

    expect(setSessionRows).not.toHaveBeenCalled();
  });
});
