import { and, asc, eq } from "drizzle-orm";
import { getAppDatabase, type AppDatabase } from "../db/client";
import { attendants } from "../db/schema";
import type { Attendant, AttendantFormValues, AvailabilityStatus } from "../domain/types";

export type AttendantRecord = typeof attendants.$inferSelect;

export async function listAttendants(database = getAppDatabase()): Promise<Attendant[]> {
  const db = await database;
  const rows = await db
    .select()
    .from(attendants)
    .where(eq(attendants.active, true))
    .orderBy(asc(attendants.displayName));

  return rows.map(mapAttendantRecord);
}

export async function createAttendant(attendant: Attendant, database = getAppDatabase()): Promise<void> {
  const db = await database;
  await db.insert(attendants).values({
    active: attendant.active,
    availabilityStatus: attendant.availabilityStatus,
    createdAt: attendant.createdAt,
    displayName: attendant.displayName,
    id: attendant.id,
    name: attendant.name,
    photoBase64: attendant.photoBase64 ?? null,
    role: attendant.role,
    updatedAt: attendant.updatedAt,
    whatsappNumber: attendant.whatsappNumber,
  });
}

export async function updateAttendant(
  attendantId: string,
  values: AttendantFormValues,
  updatedAt: string,
  database = getAppDatabase(),
): Promise<void> {
  const db = await database;
  await db
    .update(attendants)
    .set({
      displayName: values.displayName.trim(),
      name: values.name.trim(),
      photoBase64: values.photoBase64 ?? null,
      updatedAt,
      whatsappNumber: values.whatsappNumber,
    })
    .where(and(eq(attendants.id, attendantId), eq(attendants.active, true)));
}

export async function updateAttendantAvailability(
  attendantId: string,
  availabilityStatus: AvailabilityStatus,
  updatedAt: string,
  database = getAppDatabase(),
): Promise<void> {
  const db = await database;
  await db
    .update(attendants)
    .set({ availabilityStatus, updatedAt })
    .where(and(eq(attendants.id, attendantId), eq(attendants.active, true)));
}

export async function softDeleteAttendant(attendantId: string, updatedAt: string, database = getAppDatabase()): Promise<void> {
  const db = await database;
  await db
    .update(attendants)
    .set({ active: false, availabilityStatus: "offline", updatedAt })
    .where(eq(attendants.id, attendantId));
}

export function mapAttendantRecord(record: AttendantRecord): Attendant {
  return {
    active: record.active,
    availabilityStatus: record.availabilityStatus,
    createdAt: record.createdAt,
    displayName: record.displayName,
    id: record.id,
    name: record.name,
    photoBase64: record.photoBase64 ?? undefined,
    role: record.role,
    updatedAt: record.updatedAt,
    whatsappNumber: record.whatsappNumber,
  };
}

export type AttendantRepositoryDatabase = Promise<AppDatabase>;
