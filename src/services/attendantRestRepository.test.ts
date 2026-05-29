import { afterEach, describe, expect, it, vi } from "vitest";
import type { Attendant } from "../domain/types";
import { createRestAttendantRepository } from "./attendantRestRepository";

const attendant: Attendant = {
  active: true,
  availabilityStatus: "offline",
  createdAt: "2026-05-29T10:00:00.000Z",
  displayName: "Ana",
  id: "att-ana",
  name: "Ana Paula",
  role: "attendant",
  updatedAt: "2026-05-29T10:00:00.000Z",
  whatsappNumber: "+55 11 98888-1040",
};

describe("REST attendant repository", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads attendants from the configured API", async () => {
    const fetchMock = vi.fn(async () => jsonResponse([attendant]));
    vi.stubGlobal("fetch", fetchMock);

    const repository = createRestAttendantRepository("http://localhost:3922");

    await expect(repository.listAttendants()).resolves.toEqual([attendant]);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3922/api/attendants",
      expect.objectContaining({ headers: expect.objectContaining({ "Content-Type": "application/json" }) }),
    );
  });

  it("persists mutations through REST endpoints", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    const repository = createRestAttendantRepository("http://localhost:3922");
    await repository.createAttendant(attendant);
    await repository.updateAttendant("att-ana", { displayName: "Ana", name: "Ana Paula", whatsappNumber: "119" }, "now");
    await repository.updateAttendantAvailability("att-ana", "online", "now");
    await repository.softDeleteAttendant("att-ana", "now");

    const calls = fetchMock.mock.calls.map((call) => {
      const [url, init] = call as unknown as [string, RequestInit];
      return [url, init.method];
    });

    expect(calls).toEqual([
      ["http://localhost:3922/api/attendants", "POST"],
      ["http://localhost:3922/api/attendants/att-ana", "PATCH"],
      ["http://localhost:3922/api/attendants/att-ana/availability", "PATCH"],
      ["http://localhost:3922/api/attendants/att-ana", "DELETE"],
    ]);
  });

  it("surfaces API errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ message: "Falha REST" }, false)));

    const repository = createRestAttendantRepository("http://localhost:3922");

    await expect(repository.listAttendants()).rejects.toThrow("Falha REST");
  });
});

function jsonResponse(body: unknown, ok = true) {
  return {
    json: async () => body,
    ok,
    status: ok ? 200 : 500,
  } as Response;
}
