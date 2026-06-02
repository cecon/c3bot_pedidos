import type { AvailabilityState, ScheduleWindow } from "../types";

// Pure availability resolution (no IO). Evaluates status, pause auto-return, and weekly
// schedule windows up the scope chain store → catalog → category → item. `now` is injected
// so the logic is deterministic and mutation-testable. See FR-017..020, FR-029/030, SC-006.

export interface AvailabilityInput {
  status: AvailabilityState;
  pauseUntil?: string | null;
}

export interface OrderableInput extends AvailabilityInput {
  externalCode?: string | null;
}

// Windows for each applicable scope. A missing/empty array means "no restriction at this scope".
export interface ScopeSchedules {
  store?: ScheduleWindow[];
  catalog?: ScheduleWindow[];
  category?: ScheduleWindow[];
  item?: ScheduleWindow[];
}

function pad(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

function withinWindows(windows: ScheduleWindow[], now: Date): boolean {
  const day = now.getDay();
  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return windows.some((w) => w.dayOfWeek === day && w.start <= hhmm && hhmm <= w.end);
}

function scopeAllows(windows: ScheduleWindow[] | undefined, now: Date): boolean {
  if (!windows || windows.length === 0) return true;
  return withinWindows(windows, now);
}

export function resolveAvailability(
  element: AvailabilityInput,
  scopeSchedules: ScopeSchedules,
  now: Date,
): "available" | "unavailable" {
  if (element.status === "unavailable") return "unavailable";

  if (element.status === "paused") {
    if (!element.pauseUntil) return "unavailable";
    // Auto-return: once the pause time has passed the element behaves as available again.
    if (new Date(element.pauseUntil).getTime() > now.getTime()) return "unavailable";
  }

  const scopes = [scopeSchedules.store, scopeSchedules.catalog, scopeSchedules.category, scopeSchedules.item];
  for (const windows of scopes) {
    if (!scopeAllows(windows, now)) return "unavailable";
  }
  return "available";
}

export interface OrderGuardResult {
  allowed: boolean;
  warnings: string[];
}

export function canAddToOrder(element: OrderableInput, scopeSchedules: ScopeSchedules, now: Date): OrderGuardResult {
  const allowed = resolveAvailability(element, scopeSchedules, now) === "available";
  const warnings: string[] = [];
  if (!element.externalCode || element.externalCode.trim() === "") {
    warnings.push("Item não mapeado para o destino.");
  }
  return { allowed, warnings };
}
