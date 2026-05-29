import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("App attendant data source", () => {
  it("does not import runtime attendants from mockData", () => {
    const source = readFileSync("src/App.tsx", "utf8");

    expect(source).not.toContain("attendants as initialAttendants");
    expect(source).not.toContain("initialAttendants");
  });
});
