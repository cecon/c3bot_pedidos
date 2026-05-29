import type { Attendant, AttendantFormValues, AvailabilityStatus } from "../domain/types";

export interface AttendantManagementRepository {
  createAttendant(attendant: Attendant): Promise<void>;
  listAttendants(): Promise<Attendant[]>;
  softDeleteAttendant(attendantId: string, updatedAt: string): Promise<void>;
  updateAttendant(attendantId: string, values: AttendantFormValues, updatedAt: string): Promise<void>;
  updateAttendantAvailability(
    attendantId: string,
    availabilityStatus: AvailabilityStatus,
    updatedAt: string,
  ): Promise<void>;
}
