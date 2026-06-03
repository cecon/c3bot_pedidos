import type { Merchant } from "./mapping";

// Pure state machine for the merchant workspace container: empty → loading → ready | error.
// No IO. The container dispatches these actions around its async calls; tests cover transitions.

export type MerchantPersistenceState =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "ready"; merchant: Merchant }
  | { status: "error"; message: string };

export type MerchantPersistenceAction =
  | { type: "load" }
  | { type: "loaded"; merchant: Merchant | null }
  | { type: "failed"; message: string };

export const initialMerchantState: MerchantPersistenceState = { status: "empty" };

export function merchantReducer(
  state: MerchantPersistenceState,
  action: MerchantPersistenceAction,
): MerchantPersistenceState {
  switch (action.type) {
    case "load":
      return { status: "loading" };
    case "loaded":
      return action.merchant ? { status: "ready", merchant: action.merchant } : { status: "empty" };
    case "failed":
      return { status: "error", message: action.message };
    default:
      return state;
  }
}
