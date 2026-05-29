import { describe, expect, it, vi } from "vitest";
import { createAppDatabase } from "../db/client";
import type { TauriSqlDatabase } from "../db/tauriSqlProxy";
import {
  createAttendant,
  listAttendants,
  mapAttendantRecord,
  updateAttendantAvailability,
  type AttendantRecord,
} from "./attendantRepository";

const savedDriverRow = {
  id: "att-ana",
  name: "Ana Paula",
  whatsapp_number: "+55 11 98888-1040",
  active: true,
  display_name: "Ana",
  role: "attendant",
  availability_status: "online",
  photo_base64: null,
  created_at: "2026-05-29T10:00:00.000Z",
  updated_at: "2026-05-29T10:00:00.000Z",
};

const savedRecord: AttendantRecord = {
  active: true,
  availabilityStatus: "online",
  createdAt: "2026-05-29T10:00:00.000Z",
  displayName: "Ana",
  id: "att-ana",
  name: "Ana Paula",
  photoBase64: null,
  role: "attendant",
  updatedAt: "2026-05-29T10:00:00.000Z",
  whatsappNumber: "+55 11 98888-1040",
};

function createDatabase(rows = [savedDriverRow]): TauriSqlDatabase & {
  execute: ReturnType<typeof vi.fn>;
  select: ReturnType<typeof vi.fn>;
} {
  const database = {
    execute: vi.fn(async () => ({ rowsAffected: 1 })),
    select: vi.fn(async <T>() => rows as T),
  };

  return database as TauriSqlDatabase & {
    execute: ReturnType<typeof vi.fn>;
    select: ReturnType<typeof vi.fn>;
  };
}

describe("attendantRepository", () => {
  it("maps ORM attendant records to the domain shape", () => {
    expect(mapAttendantRecord(savedRecord)).toMatchObject({
      active: true,
      availabilityStatus: "online",
      displayName: "Ana",
      id: "att-ana",
      name: "Ana Paula",
      photoBase64: undefined,
      role: "attendant",
      whatsappNumber: "+55 11 98888-1040",
    });
  });

  it("lists active attendants through the Drizzle client", async () => {
    const database = createDatabase();
    const attendants = await listAttendants(Promise.resolve(createAppDatabase(database)));

    expect(attendants).toHaveLength(1);
    expect(attendants[0].displayName).toBe("Ana");
    expect(database.select.mock.calls[0][0]).toContain("from \"attendants\"");
  });

  it("creates and updates attendants through ORM-generated SQL", async () => {
    const database = createDatabase();
    const appDatabase = Promise.resolve(createAppDatabase(database));

    await createAttendant(mapAttendantRecord(savedRecord), appDatabase);
    await updateAttendantAvailability("att-ana", "offline", "2026-05-29T11:00:00.000Z", appDatabase);

    expect(database.execute).toHaveBeenCalledTimes(2);
    expect(database.execute.mock.calls[0][0]).toContain("insert into \"attendants\"");
    expect(database.execute.mock.calls[1][0]).toContain("update \"attendants\"");
  });
});
