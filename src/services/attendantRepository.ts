import type { Attendant, AttendantFormValues, AvailabilityStatus } from "../domain/types";
import { getDatabase } from "./database";

interface AttendantRow {
  active: number;
  availability_status: AvailabilityStatus;
  created_at: string;
  display_name: string;
  id: string;
  name: string;
  photo_base64?: string | null;
  role: "supervisor" | "attendant";
  updated_at: string;
  whatsapp_number: string;
}

export async function listAttendants(database = getDatabase()): Promise<Attendant[]> {
  const db = await database;
  const rows = await db.select<AttendantRow[]>(
    `SELECT id, name, display_name, whatsapp_number, role, active, availability_status,
            photo_base64, created_at, updated_at
       FROM attendants
      WHERE active = 1
      ORDER BY display_name COLLATE NOCASE`,
  );

  return rows.map(mapAttendantRow);
}

export async function createAttendant(
  attendant: Attendant,
  database = getDatabase(),
): Promise<void> {
  const db = await database;
  await db.execute(
    `INSERT INTO attendants (
       id, name, display_name, whatsapp_number, role, active, availability_status,
       photo_base64, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      attendant.id,
      attendant.name,
      attendant.displayName,
      attendant.whatsappNumber,
      attendant.role,
      attendant.active ? 1 : 0,
      attendant.availabilityStatus,
      attendant.photoBase64 ?? null,
      attendant.createdAt,
      attendant.updatedAt,
    ],
  );
}

export async function updateAttendant(
  attendantId: string,
  values: AttendantFormValues,
  updatedAt: string,
  database = getDatabase(),
): Promise<void> {
  const db = await database;
  await db.execute(
    `UPDATE attendants
        SET name = ?, display_name = ?, whatsapp_number = ?, photo_base64 = ?, updated_at = ?
      WHERE id = ? AND active = 1`,
    [
      values.name.trim(),
      values.displayName.trim(),
      values.whatsappNumber,
      values.photoBase64 ?? null,
      updatedAt,
      attendantId,
    ],
  );
}

export async function updateAttendantAvailability(
  attendantId: string,
  availabilityStatus: AvailabilityStatus,
  updatedAt: string,
  database = getDatabase(),
): Promise<void> {
  const db = await database;
  await db.execute(
    `UPDATE attendants
        SET availability_status = ?, updated_at = ?
      WHERE id = ? AND active = 1`,
    [availabilityStatus, updatedAt, attendantId],
  );
}

export async function softDeleteAttendant(
  attendantId: string,
  updatedAt: string,
  database = getDatabase(),
): Promise<void> {
  const db = await database;
  await db.execute(
    `UPDATE attendants
        SET active = 0, availability_status = 'offline', updated_at = ?
      WHERE id = ?`,
    [updatedAt, attendantId],
  );
}

export function mapAttendantRow(row: AttendantRow): Attendant {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    whatsappNumber: row.whatsapp_number,
    role: row.role,
    active: row.active === 1,
    availabilityStatus: row.availability_status,
    photoBase64: row.photo_base64 ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type AttendantRepositoryDatabase = ReturnType<typeof getDatabase>;
