import type { UnitOfMeasure } from "../types";

// Pure catalog validation rules (no IO). Mutation-tested (see stryker.config.json).

export type ValidationResult = { ok: true } | { ok: false; errors: string[] };
export type CnpjResult = { ok: true } | { ok: false; reason: string };

// CNPJ: unified validation for the legacy 14-digit numeric format AND the new alphanumeric
// format (12 alphanumeric positions + 2 numeric check digits, effective Jul/2026). Never
// assumes digits-only. Check digits use the official mod-11 rule over each character's value
// (ASCII − 48), per Receita Federal / Serpro. See docs and FR-028.
const CNPJ_SHAPE = /^[A-Z0-9]{12}[0-9]{2}$/;
const DV1_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const DV2_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function normalizeCnpj(value: string): string {
  return value.replace(/[.\-/\s]/g, "").toUpperCase();
}

function charValue(char: string): number {
  return char.charCodeAt(0) - 48;
}

function checkDigit(chars: string, weights: number[]): number {
  let sum = 0;
  for (let i = 0; i < weights.length; i += 1) {
    sum += charValue(chars[i]) * weights[i];
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function validateCnpj(value: string): CnpjResult {
  const cnpj = normalizeCnpj(value ?? "");
  if (!CNPJ_SHAPE.test(cnpj)) {
    return { ok: false, reason: "CNPJ deve ter 14 caracteres: 12 alfanuméricos + 2 dígitos verificadores." };
  }
  if (/^(.)\1{13}$/.test(cnpj)) {
    return { ok: false, reason: "CNPJ não pode ser um único caractere repetido." };
  }
  const dv1 = checkDigit(cnpj.slice(0, 12), DV1_WEIGHTS);
  const dv2 = checkDigit(cnpj.slice(0, 13), DV2_WEIGHTS);
  if (charValue(cnpj[12]) !== dv1 || charValue(cnpj[13]) !== dv2) {
    return { ok: false, reason: "Dígitos verificadores do CNPJ inválidos." };
  }
  return { ok: true };
}

export interface ProductInput {
  name: string;
  unitOfMeasure: UnitOfMeasure;
  referenceWeightGrams?: number | null;
}

export function validateProduct(input: ProductInput): ValidationResult {
  const errors: string[] = [];
  if (!input.name || input.name.trim() === "") {
    errors.push("Nome do produto é obrigatório.");
  }
  if (input.unitOfMeasure === "weight" && !(typeof input.referenceWeightGrams === "number" && input.referenceWeightGrams > 0)) {
    errors.push("Produtos por peso exigem um peso de referência (g) maior que zero.");
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export interface OptionGroupInput {
  minQuantity: number;
  maxQuantity: number;
  required: boolean;
}

// Selection counts are governed solely by the group's min/max (iFood: no per-option quantity).
// `required` must be consistent with minQuantity (required iff min >= 1). See FR-013/014/016.
export function validateOptionGroup(input: OptionGroupInput): ValidationResult {
  const errors: string[] = [];
  if (!Number.isInteger(input.minQuantity) || input.minQuantity < 0) {
    errors.push("Quantidade mínima deve ser um inteiro maior ou igual a zero.");
  }
  if (!Number.isInteger(input.maxQuantity) || input.maxQuantity < 1) {
    errors.push("Quantidade máxima deve ser um inteiro maior ou igual a um.");
  }
  if (input.maxQuantity < input.minQuantity) {
    errors.push("Quantidade máxima deve ser maior ou igual à mínima.");
  }
  if (input.required !== input.minQuantity >= 1) {
    errors.push("Grupo obrigatório deve ter mínimo ≥ 1 (e opcional, mínimo 0).");
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

export interface CatalogItemInput {
  priceCents: number;
  originalPriceCents?: number | null;
}

export function validateCatalogItem(input: CatalogItemInput): ValidationResult {
  const errors: string[] = [];
  if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
    errors.push("Preço deve ser um inteiro em centavos maior ou igual a zero.");
  }
  if (input.originalPriceCents !== undefined && input.originalPriceCents !== null) {
    if (!Number.isInteger(input.originalPriceCents) || input.originalPriceCents < 0) {
      errors.push("Preço promocional de referência deve ser um inteiro não negativo.");
    } else if (input.originalPriceCents < input.priceCents) {
      errors.push("Preço promocional de referência deve ser maior ou igual ao preço atual.");
    }
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
