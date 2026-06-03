import type { MerchantInterruption } from "../types";

// Pure interruption rules (no IO). Mutation-tested. See specs/006-merchant-registry.

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };

export const RECENTLY_CREATED_THRESHOLD_SECONDS = 60;

export interface InterruptionInput {
  description: string;
  start: string; // ISO-8601
  end: string; // ISO-8601
}

function parseIso(value: string): number | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

export function validateInterruption(input: InterruptionInput): ValidationResult {
  const errors: string[] = [];
  if (!input.description || input.description.trim() === "") {
    errors.push("Descrição da interrupção é obrigatória.");
  }
  const start = parseIso(input.start);
  const end = parseIso(input.end);
  if (start === null) errors.push("Início inválido (use ISO-8601).");
  if (end === null) errors.push("Fim inválido (use ISO-8601).");
  if (start !== null && end !== null && start >= end) {
    errors.push("Início deve ser anterior ao fim.");
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

// Two intervals overlap when each starts before the other ends (half-open [start, end)).
function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// Returns the first existing interruption whose window intersects the candidate's, else null.
export function findInterruptionOverlap(
  candidate: InterruptionInput,
  existing: readonly MerchantInterruption[],
): MerchantInterruption | null {
  const start = parseIso(candidate.start);
  const end = parseIso(candidate.end);
  if (start === null || end === null) return null;
  for (const item of existing) {
    const itemStart = parseIso(item.start);
    const itemEnd = parseIso(item.end);
    if (itemStart === null || itemEnd === null) continue;
    if (overlaps(start, end, itemStart, itemEnd)) return item;
  }
  return null;
}

// Block deletion within the recently-created threshold of createdAt (FR-012).
export function canDeleteInterruption(
  interruption: Pick<MerchantInterruption, "createdAt">,
  nowIso: string,
  thresholdSeconds: number = RECENTLY_CREATED_THRESHOLD_SECONDS,
): boolean {
  const created = parseIso(interruption.createdAt ?? "");
  const now = parseIso(nowIso);
  if (created === null || now === null) return true; // no reliable timestamp -> allow deletion
  return now - created >= thresholdSeconds * 1000;
}

// Current and future interruptions (end >= now), for the listing endpoint.
export function listCurrentAndFuture(
  interruptions: readonly MerchantInterruption[],
  nowIso: string,
): MerchantInterruption[] {
  const now = parseIso(nowIso);
  if (now === null) return [...interruptions];
  return interruptions.filter((item) => {
    const end = parseIso(item.end);
    return end === null || end >= now;
  });
}
