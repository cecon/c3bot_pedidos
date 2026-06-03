import type { DayOfWeek, MerchantOperation, MerchantStatusValue, OperationName } from "../types";

// Pure merchant validation rules (no IO). Mutation-tested. See specs/006-merchant-registry.

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

export const DAYS_OF_WEEK: readonly DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];
export const OPERATION_NAMES: readonly OperationName[] = ["DELIVERY", "INDOOR"];
const MERCHANT_STATUSES: readonly MerchantStatusValue[] = ["AVAILABLE", "UNAVAILABLE"];
const TIME_SHAPE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export interface MerchantInput {
  name: string;
  status?: MerchantStatusValue;
  type?: string;
  averageTicketCents?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  cnpj?: string | null;
  externalCode?: string | null;
}

export function validateMerchant(input: MerchantInput): ValidationResult {
  const errors: string[] = [];
  if (!input.name || input.name.trim() === "") {
    errors.push("Nome público do merchant é obrigatório.");
  }
  if (input.type !== undefined && input.type.trim() === "") {
    errors.push("Tipo do merchant não pode ser vazio.");
  }
  if (input.status !== undefined && !MERCHANT_STATUSES.includes(input.status)) {
    errors.push("Status deve ser AVAILABLE ou UNAVAILABLE.");
  }
  if (isPresent(input.averageTicketCents) && (!Number.isInteger(input.averageTicketCents) || input.averageTicketCents < 0)) {
    errors.push("Ticket médio deve ser um inteiro em centavos maior ou igual a zero.");
  }
  if (isPresent(input.latitude) && (input.latitude < -90 || input.latitude > 90)) {
    errors.push("Latitude deve estar entre -90 e 90.");
  }
  if (isPresent(input.longitude) && (input.longitude < -180 || input.longitude > 180)) {
    errors.push("Longitude deve estar entre -180 e 180.");
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

// "Ready for handoff" = mapped to a destination: requires CNPJ and an external reference code.
export function isReadyForHandoff(input: { cnpj?: string | null; externalCode?: string | null }): boolean {
  return nonBlank(input.cnpj) && nonBlank(input.externalCode);
}

export function validateOperation(input: Pick<MerchantOperation, "name" | "salesChannel">): ValidationResult {
  const errors: string[] = [];
  if (!OPERATION_NAMES.includes(input.name)) {
    errors.push("Operação deve ser DELIVERY ou INDOOR.");
  }
  if (!nonBlank(input.salesChannel)) {
    errors.push("Canal de venda (salesChannel) é obrigatório.");
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export interface ShiftInput {
  dayOfWeek: DayOfWeek;
  start: string;
  duration: number;
}

export function validateShift(input: ShiftInput): ValidationResult {
  const errors: string[] = [];
  if (!DAYS_OF_WEEK.includes(input.dayOfWeek)) {
    errors.push("Dia da semana inválido.");
  }
  if (typeof input.start !== "string" || !TIME_SHAPE.test(input.start)) {
    errors.push("Horário de início deve estar no formato HH:MM ou HH:MM:SS.");
  }
  if (!Number.isInteger(input.duration) || input.duration < 1 || input.duration > 1440) {
    errors.push("Duração deve ser um inteiro de minutos entre 1 e 1440.");
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export function isParsableTime(value: string): boolean {
  return TIME_SHAPE.test(value);
}

function isPresent(value: number | null | undefined): value is number {
  return value !== null && value !== undefined;
}

function nonBlank(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim() !== "";
}
