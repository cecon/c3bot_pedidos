import type {
  DayOfWeek,
  MerchantInterruption,
  MerchantOperation,
  MerchantShift,
  MerchantStatus,
  MerchantStatusValue,
  StatusValidation,
} from "../types";

// Pure availability/status resolution (no IO). Mutation-tested. Times are interpreted as UTC
// wall-clock so the result is deterministic regardless of host timezone. See FR-013..015, SC-006.

export interface StatusInput {
  merchantStatus: MerchantStatusValue;
  operations: readonly MerchantOperation[];
  shifts: readonly MerchantShift[];
  interruptions: readonly MerchantInterruption[];
}

// Index 0..6 = Sun..Sat (matches Date#getUTCDay).
const WEEKDAY_BY_INDEX: readonly DayOfWeek[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

function startMinutes(start: string): number | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)/.exec(start);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

// True when `now` falls inside an enabled shift, including shifts that wrap past midnight.
export function isWithinShift(shifts: readonly MerchantShift[], nowMs: number): boolean {
  const now = new Date(nowMs);
  const todayIdx = now.getUTCDay();
  const today = WEEKDAY_BY_INDEX[todayIdx];
  const yesterday = WEEKDAY_BY_INDEX[(todayIdx + 6) % 7];
  const minutesNow = now.getUTCHours() * 60 + now.getUTCMinutes();
  for (const shift of shifts) {
    if (!shift.enabled) continue;
    const start = startMinutes(shift.start);
    if (start === null) continue;
    const end = start + shift.duration;
    if (shift.dayOfWeek === today && minutesNow >= start && minutesNow < Math.min(end, 1440)) {
      return true;
    }
    // A shift that wraps midnight covers part of the following day.
    if (shift.dayOfWeek === yesterday && end > 1440 && minutesNow < end - 1440) {
      return true;
    }
  }
  return false;
}

export function hasActiveInterruption(interruptions: readonly MerchantInterruption[], nowMs: number): boolean {
  return interruptions.some((item) => {
    const start = Date.parse(item.start);
    const end = Date.parse(item.end);
    return !Number.isNaN(start) && !Number.isNaN(end) && start <= nowMs && nowMs < end;
  });
}

function validation(code: string, state: MerchantStatus["state"], title: string, subtitle: string, description: string): StatusValidation {
  return { id: code, code, state, message: { title, subtitle, description } };
}

function resolveOne(operation: MerchantOperation, input: StatusInput, nowMs: number): MerchantStatus {
  const base = { operation: operation.name, salesChannel: operation.salesChannel };
  if (input.merchantStatus !== "AVAILABLE") {
    return {
      ...base,
      available: false,
      state: "ERROR",
      reopenable: false,
      validations: [validation("MERCHANT_UNAVAILABLE", "ERROR", "Merchant indisponível", "Status do merchant é UNAVAILABLE", "Ative o merchant para aceitar pedidos.")],
    };
  }
  if (!operation.enabled) {
    return {
      ...base,
      available: false,
      state: "ERROR",
      reopenable: false,
      validations: [validation("OPERATION_DISABLED", "ERROR", "Operação desabilitada", `A operação ${operation.name} está desabilitada`, "Habilite a operação para aceitar pedidos por este canal.")],
    };
  }
  if (hasActiveInterruption(input.interruptions, nowMs)) {
    return {
      ...base,
      available: false,
      state: "CLOSED",
      reopenable: true,
      validations: [validation("ACTIVE_INTERRUPTION", "CLOSED", "Em interrupção", "Há uma interrupção ativa agora", "O merchant reabre ao fim da interrupção.")],
    };
  }
  if (!isWithinShift(input.shifts, nowMs)) {
    const hasEnabledShift = input.shifts.some((s) => s.enabled);
    return {
      ...base,
      available: false,
      state: "CLOSED",
      reopenable: hasEnabledShift,
      validations: [validation("OUTSIDE_OPENING_HOURS", "CLOSED", "Fora do horário", "Fora do horário de funcionamento", "O merchant reabre no próximo turno configurado.")],
    };
  }
  return { ...base, available: true, state: "OK", reopenable: false, validations: [] };
}

// Resolve status for every operation. `nowIso` defaults to allow callers to inject a fixed clock.
export function resolveMerchantStatus(input: StatusInput, nowIso: string): MerchantStatus[] {
  const nowMs = Date.parse(nowIso);
  const clock = Number.isNaN(nowMs) ? 0 : nowMs;
  return input.operations.map((operation) => resolveOne(operation, input, clock));
}
