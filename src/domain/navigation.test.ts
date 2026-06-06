import { describe, expect, it } from "vitest";
import {
  DEFAULT_DESTINATION_ID,
  NAVIGATION_DESTINATIONS,
  getDestinationById,
  normalizeRouteHash,
  resolveDestinationFromHash,
} from "./navigation";

describe("navigation", () => {
  it("exposes exactly the Dashboard and Attendants destinations", () => {
    expect(NAVIGATION_DESTINATIONS.map((d) => d.id)).toEqual(["dashboard", "attendants"]);
  });

  it("normalizes empty/root hashes to the default destination path", () => {
    expect(normalizeRouteHash("")).toBe("#/dashboard");
    expect(normalizeRouteHash("#/")).toBe("#/dashboard");
    expect(normalizeRouteHash("attendants")).toBe("#/attendants");
  });

  it("resolves known routes", () => {
    expect(resolveDestinationFromHash("#/attendants")).toMatchObject({
      destination: getDestinationById("attendants"),
      wasFallback: false,
    });
  });

  it("falls back to the dashboard for removed/unknown routes", () => {
    const fallback = resolveDestinationFromHash("#/catalog");
    expect(fallback.destination.id).toBe(DEFAULT_DESTINATION_ID);
    expect(fallback.wasFallback).toBe(true);
    expect(fallback.message).toContain("#/catalog");
  });
});
