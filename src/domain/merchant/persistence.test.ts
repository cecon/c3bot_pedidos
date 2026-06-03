import { describe, expect, it } from "vitest";
import { initialMerchantState, merchantReducer } from "./persistence";
import type { Merchant } from "./mapping";

const merchant = { id: "store-default", name: "Edu" } as Merchant;

describe("merchantReducer", () => {
  it("starts empty and moves to loading", () => {
    expect(initialMerchantState).toEqual({ status: "empty" });
    expect(merchantReducer(initialMerchantState, { type: "load" })).toEqual({ status: "loading" });
  });

  it("becomes ready with a merchant, empty when none", () => {
    expect(merchantReducer({ status: "loading" }, { type: "loaded", merchant })).toEqual({ status: "ready", merchant });
    expect(merchantReducer({ status: "loading" }, { type: "loaded", merchant: null })).toEqual({ status: "empty" });
  });

  it("captures an error message", () => {
    expect(merchantReducer({ status: "loading" }, { type: "failed", message: "boom" })).toEqual({ status: "error", message: "boom" });
  });
});
