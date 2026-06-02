import { describe, expect, it } from "vitest";
import { validateCatalogItem, validateCnpj, validateProduct } from "./validation";

describe("validateCnpj", () => {
  it("accepts a valid legacy 14-digit CNPJ (with or without formatting)", () => {
    expect(validateCnpj("11.222.333/0001-81")).toEqual({ ok: true });
    expect(validateCnpj("11222333000181")).toEqual({ ok: true });
  });

  it("accepts a valid new alphanumeric CNPJ and is case-insensitive", () => {
    expect(validateCnpj("12.ABC.345/01DE-35")).toEqual({ ok: true });
    expect(validateCnpj("12abc34501de35")).toEqual({ ok: true });
  });

  it("rejects wrong check digits (legacy and alphanumeric)", () => {
    expect(validateCnpj("11222333000182").ok).toBe(false);
    expect(validateCnpj("12ABC34501DE34").ok).toBe(false);
  });

  it("rejects a repeated-character CNPJ", () => {
    expect(validateCnpj("00000000000000").ok).toBe(false);
  });

  it("rejects the wrong length or non-numeric check digits", () => {
    expect(validateCnpj("123").ok).toBe(false);
    expect(validateCnpj("12ABC34501DEA5").ok).toBe(false); // check digit must be numeric
  });
});

describe("validateProduct", () => {
  it("requires a non-empty name", () => {
    expect(validateProduct({ name: "", unitOfMeasure: "unit" }).ok).toBe(false);
    expect(validateProduct({ name: "   ", unitOfMeasure: "unit" }).ok).toBe(false);
    expect(validateProduct({ name: "Coca lata", unitOfMeasure: "unit" })).toEqual({ ok: true });
  });

  it("requires a positive reference weight for weight products", () => {
    expect(validateProduct({ name: "Pão", unitOfMeasure: "weight" }).ok).toBe(false);
    expect(validateProduct({ name: "Pão", unitOfMeasure: "weight", referenceWeightGrams: 0 }).ok).toBe(false);
    expect(validateProduct({ name: "Pão", unitOfMeasure: "weight", referenceWeightGrams: 50 })).toEqual({ ok: true });
  });

  it("does not require a reference weight for unit products", () => {
    expect(validateProduct({ name: "Coca lata", unitOfMeasure: "unit", referenceWeightGrams: null })).toEqual({ ok: true });
  });
});

describe("validateCatalogItem", () => {
  it("rejects negative or non-integer prices", () => {
    expect(validateCatalogItem({ priceCents: -1 }).ok).toBe(false);
    expect(validateCatalogItem({ priceCents: 9.9 }).ok).toBe(false);
    expect(validateCatalogItem({ priceCents: 0 })).toEqual({ ok: true });
    expect(validateCatalogItem({ priceCents: 1990 })).toEqual({ ok: true });
  });

  it("requires the promotional reference price to be >= current price", () => {
    expect(validateCatalogItem({ priceCents: 1990, originalPriceCents: 2490 })).toEqual({ ok: true });
    expect(validateCatalogItem({ priceCents: 1990, originalPriceCents: 1500 }).ok).toBe(false);
    expect(validateCatalogItem({ priceCents: 1990, originalPriceCents: -1 }).ok).toBe(false);
  });
});
