import { describe, expect, it } from "vitest";
import type { MerchantInterruption } from "../types";
import {
  canDeleteInterruption,
  findInterruptionOverlap,
  listCurrentAndFuture,
  validateInterruption,
} from "./interruptions";

const mk = (id: string, start: string, end: string, createdAt?: string): MerchantInterruption => ({
  id,
  description: "x",
  start,
  end,
  createdAt,
});

function errorsOf(result: ReturnType<typeof validateInterruption>): string[] {
  return result.ok ? [] : result.errors;
}

describe("validateInterruption", () => {
  it("accepts a valid window", () => {
    expect(validateInterruption({ description: "Manutenção", start: "2026-06-03T14:00:00Z", end: "2026-06-03T16:00:00Z" })).toEqual({ ok: true });
  });

  it("flags only the missing description", () => {
    const errors = errorsOf(validateInterruption({ description: "  ", start: "2026-06-03T14:00:00Z", end: "2026-06-03T16:00:00Z" }));
    expect(errors).toEqual(["Descrição da interrupção é obrigatória."]);
  });

  it("flags only an invalid start", () => {
    const errors = errorsOf(validateInterruption({ description: "x", start: "nope", end: "2026-06-03T16:00:00Z" }));
    expect(errors).toEqual(["Início inválido (use ISO-8601)."]);
  });

  it("flags only an invalid end", () => {
    const errors = errorsOf(validateInterruption({ description: "x", start: "2026-06-03T14:00:00Z", end: "nope" }));
    expect(errors).toEqual(["Fim inválido (use ISO-8601)."]);
  });

  it("rejects start equal to or after end with the ordering message", () => {
    const equal = errorsOf(validateInterruption({ description: "x", start: "2026-06-03T16:00:00Z", end: "2026-06-03T16:00:00Z" }));
    expect(equal).toEqual(["Início deve ser anterior ao fim."]);
    const after = errorsOf(validateInterruption({ description: "x", start: "2026-06-03T17:00:00Z", end: "2026-06-03T16:00:00Z" }));
    expect(after).toEqual(["Início deve ser anterior ao fim."]);
  });
});

describe("findInterruptionOverlap", () => {
  const existing = [mk("a", "2026-06-03T10:00:00Z", "2026-06-03T12:00:00Z")];

  it("detects an overlapping window", () => {
    expect(findInterruptionOverlap({ description: "x", start: "2026-06-03T11:00:00Z", end: "2026-06-03T13:00:00Z" }, existing)?.id).toBe("a");
  });

  it("returns null when the candidate starts exactly at an existing end (no overlap)", () => {
    expect(findInterruptionOverlap({ description: "x", start: "2026-06-03T12:00:00Z", end: "2026-06-03T13:00:00Z" }, existing)).toBeNull();
  });

  it("returns null when the candidate ends exactly at an existing start (no overlap)", () => {
    expect(findInterruptionOverlap({ description: "x", start: "2026-06-03T09:00:00Z", end: "2026-06-03T10:00:00Z" }, existing)).toBeNull();
  });

  it("returns null when either side of the candidate window is unparsable", () => {
    expect(findInterruptionOverlap({ description: "x", start: "bad", end: "also-bad" }, existing)).toBeNull();
    expect(findInterruptionOverlap({ description: "x", start: "2026-06-03T11:00:00Z", end: "bad" }, existing)).toBeNull();
    expect(findInterruptionOverlap({ description: "x", start: "bad", end: "2026-06-03T13:00:00Z" }, existing)).toBeNull();
  });

  it("skips existing items with unparsable windows and still finds a valid overlap", () => {
    const withBad = [mk("bad", "nope", "nope"), mk("good", "2026-06-03T10:00:00Z", "2026-06-03T12:00:00Z")];
    expect(findInterruptionOverlap({ description: "x", start: "2026-06-03T11:00:00Z", end: "2026-06-03T13:00:00Z" }, withBad)?.id).toBe("good");
    // Only a bad-date existing item -> nothing to overlap with.
    expect(findInterruptionOverlap({ description: "x", start: "2026-06-03T11:00:00Z", end: "2026-06-03T13:00:00Z" }, [mk("bad", "nope", "nope")])).toBeNull();
  });

  it("finds the matching item among several, not just the first", () => {
    const many = [mk("a", "2026-06-03T08:00:00Z", "2026-06-03T09:00:00Z"), mk("b", "2026-06-03T14:00:00Z", "2026-06-03T16:00:00Z")];
    expect(findInterruptionOverlap({ description: "x", start: "2026-06-03T15:00:00Z", end: "2026-06-03T15:30:00Z" }, many)?.id).toBe("b");
  });
});

describe("canDeleteInterruption", () => {
  const created = "2026-06-03T10:00:00Z";

  it("blocks within the 60s window and allows at/after the boundary", () => {
    expect(canDeleteInterruption({ createdAt: created }, "2026-06-03T10:00:30Z")).toBe(false); // 30s
    expect(canDeleteInterruption({ createdAt: created }, "2026-06-03T10:00:59Z")).toBe(false); // 59s
    expect(canDeleteInterruption({ createdAt: created }, "2026-06-03T10:01:00Z")).toBe(true); // exactly 60s
    expect(canDeleteInterruption({ createdAt: created }, "2026-06-03T10:02:00Z")).toBe(true); // later
  });

  it("respects a custom threshold", () => {
    expect(canDeleteInterruption({ createdAt: created }, "2026-06-03T10:01:30Z", 120)).toBe(false); // 90s < 120s
  });

  it("allows deletion when there is no reliable timestamp", () => {
    expect(canDeleteInterruption({ createdAt: undefined }, "2026-06-03T10:00:30Z")).toBe(true);
    expect(canDeleteInterruption({ createdAt: "2026-06-03T10:00:00Z" }, "bad-now")).toBe(true);
  });
});

describe("listCurrentAndFuture", () => {
  const now = "2026-06-03T00:00:00Z";

  it("keeps interruptions ending at or after now and drops strictly-past ones", () => {
    const items = [
      mk("past", "2026-06-01T10:00:00Z", "2026-06-02T23:59:59Z"),
      mk("edge", "2026-06-02T00:00:00Z", "2026-06-03T00:00:00Z"), // ends exactly now -> kept
      mk("future", "2026-06-10T10:00:00Z", "2026-06-10T12:00:00Z"),
    ];
    expect(listCurrentAndFuture(items, now).map((i) => i.id)).toEqual(["edge", "future"]);
  });

  it("keeps items whose end is unparsable", () => {
    expect(listCurrentAndFuture([mk("weird", "bad", "bad")], now).map((i) => i.id)).toEqual(["weird"]);
  });
});
