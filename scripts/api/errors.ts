// Shared error catalog for the merchant API (feature 006, FR-016/FR-017). Single source of the
// standardized `{ code, message }` payloads and their HTTP status, reused by every handler so
// codes stay consistent and testable. The 401/403 distinction is modeled here (FR-017); the
// actual identity provider is out of scope.

export interface ApiError {
  code: string;
  message: string;
}

export const ERROR_CATALOG = {
  InvalidMerchant: { status: 400, message: "Dados do merchant inválidos." },
  InvalidOpeningHours: { status: 400, message: "Horário de funcionamento inválido." },
  InvalidInterruption: { status: 400, message: "Interrupção inválida (verifique descrição e início < fim)." },
  InterruptionOverlap: { status: 409, message: "A interrupção se sobrepõe a uma já existente." },
  RecentlyCreatedInterruption: { status: 409, message: "Interrupção recém-criada não pode ser removida ainda." },
  IrremovableInterruption: { status: 409, message: "Interrupção não pode ser removida." },
  InterruptionNotFound: { status: 404, message: "Interrupção não encontrada." },
  MerchantNotFound: { status: 404, message: "Merchant não encontrado." },
  InvalidOperation: { status: 400, message: "Operação inválida (use DELIVERY ou INDOOR)." },
  Unauthorized: { status: 401, message: "Não autenticado." },
  Forbidden: { status: 403, message: "Sem acesso a este merchant." },
} as const;

export type ErrorCode = keyof typeof ERROR_CATALOG;

/** Build the standardized error body for a catalog code, optionally overriding the message. */
export function apiError(code: ErrorCode, message?: string): ApiError {
  return { code, message: message ?? ERROR_CATALOG[code].message };
}

/** HTTP status for a catalog code. */
export function errorStatus(code: ErrorCode): number {
  return ERROR_CATALOG[code].status;
}
