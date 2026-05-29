import { isTauriRuntime } from "./database";
import * as tauriRepository from "./attendantRepository";
import {
  createRestAttendantRepository,
  getConfiguredAttendantApiBaseUrl,
} from "./attendantRestRepository";
import type { AttendantManagementRepository } from "./attendantRepositoryContract";

const restBaseUrl = getConfiguredAttendantApiBaseUrl();
const restRepository = restBaseUrl ? createRestAttendantRepository(restBaseUrl) : undefined;

export function getDefaultAttendantRepository(): AttendantManagementRepository | undefined {
  if (restRepository) return restRepository;
  if (isTauriRuntime()) return tauriRepository;
  return undefined;
}

export function isDefaultAttendantRepositoryAvailable(): boolean {
  return Boolean(getDefaultAttendantRepository());
}
