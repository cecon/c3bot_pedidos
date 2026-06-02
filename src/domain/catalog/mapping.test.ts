import { describe, expect, it } from "vitest";
import { computeMappingReadiness, findDuplicateExternalCodes, type SellableRef } from "./mapping";

describe("computeMappingReadiness", () => {
  it("reports ready when every element has an external code", () => {
    const elements: SellableRef[] = [
      { kind: "product", id: "p1", path: "Bebidas/Coca", externalCode: "C1" },
      { kind: "item", id: "i1", path: "Bebidas/Coca", externalCode: "I1" },
    ];
    expect(computeMappingReadiness(elements)).toEqual({ ready: true, unmapped: [] });
  });

  it("lists exactly the unmapped elements (null or blank) with their path", () => {
    const elements: SellableRef[] = [
      { kind: "product", id: "p1", path: "Bebidas/Coca", externalCode: "C1" },
      { kind: "option", id: "o1", path: "Burger/Extras/Bacon", externalCode: "" },
      { kind: "flavor", id: "f1", path: "Pizzas/Calabresa", externalCode: null },
    ];
    const result = computeMappingReadiness(elements);
    expect(result.ready).toBe(false);
    expect(result.unmapped).toEqual([
      { kind: "option", id: "o1", path: "Burger/Extras/Bacon" },
      { kind: "flavor", id: "f1", path: "Pizzas/Calabresa" },
    ]);
  });
});

describe("findDuplicateExternalCodes", () => {
  it("flags duplicate codes within the same kind", () => {
    const elements: SellableRef[] = [
      { kind: "product", id: "p1", path: "a", externalCode: "DUP" },
      { kind: "product", id: "p2", path: "b", externalCode: "DUP" },
      { kind: "product", id: "p3", path: "c", externalCode: "OK" },
    ];
    expect(findDuplicateExternalCodes(elements)).toEqual([{ kind: "product", externalCode: "DUP", ids: ["p1", "p2"] }]);
  });

  it("does not flag the same code across different kinds (per-kind uniqueness)", () => {
    const elements: SellableRef[] = [
      { kind: "product", id: "p1", path: "a", externalCode: "X" },
      { kind: "option", id: "o1", path: "b", externalCode: "X" },
    ];
    expect(findDuplicateExternalCodes(elements)).toEqual([]);
  });

  it("ignores blank codes", () => {
    const elements: SellableRef[] = [
      { kind: "item", id: "i1", path: "a", externalCode: "" },
      { kind: "item", id: "i2", path: "b", externalCode: null },
    ];
    expect(findDuplicateExternalCodes(elements)).toEqual([]);
  });
});
