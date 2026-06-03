import { describe, expect, it } from "vitest";
import {
  DEFAULT_DESTINATION_ID,
  NAVIGATION_DESTINATIONS,
  getDestinationById,
  getVisibleNavigationGroups,
  normalizeRouteHash,
  resolveDestinationFromHash,
  shouldConfirmNavigation,
} from "./navigation";

describe("navigation helpers", () => {
  it("defines unique primary destinations with direct hash routes", () => {
    const ids = new Set(NAVIGATION_DESTINATIONS.map((destination) => destination.id));
    const paths = new Set(NAVIGATION_DESTINATIONS.map((destination) => destination.path));

    expect(NAVIGATION_DESTINATIONS).toHaveLength(11);
    expect(ids.size).toBe(NAVIGATION_DESTINATIONS.length);
    expect(paths.size).toBe(NAVIGATION_DESTINATIONS.length);
    expect(NAVIGATION_DESTINATIONS.every((destination) => destination.isPrimary)).toBe(true);
    expect(NAVIGATION_DESTINATIONS.map((destination) => destination.path)).toContain("#/sessions");
    expect(NAVIGATION_DESTINATIONS.map((destination) => destination.path)).toContain("#/delivery-attendants");
  });

  it("groups primary destinations without rendering empty groups", () => {
    const groups = getVisibleNavigationGroups();

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ id: "operations", label: "Operacao" });
    expect(groups[0].destinationIds).toContain("sessions");
    expect(groups[1]).toMatchObject({ id: "administration", label: "Administracao" });
    expect(groups[1].destinationIds).toContain("delivery-attendants");
    expect(groups[1].destinationIds).toContain("automation-groups");
    expect(groups.every((group) => group.destinationIds.length > 0)).toBe(true);
  });

  it("normalizes root and direct route inputs", () => {
    expect(normalizeRouteHash("")).toBe("#/dashboard");
    expect(normalizeRouteHash("#")).toBe("#/dashboard");
    expect(normalizeRouteHash("#/")).toBe("#/dashboard");
    expect(normalizeRouteHash(" #/orders ")).toBe("#/orders");
    expect(normalizeRouteHash("#//orders")).toBe("#/orders");
    expect(normalizeRouteHash("/customers")).toBe("#/customers");
    expect(normalizeRouteHash("orders")).toBe("#/orders");
    expect(normalizeRouteHash("#catalog")).toBe("#/catalog");
    expect(normalizeRouteHash("#/campaigns")).toBe("#/campaigns");
    expect(normalizeRouteHash("delivery-attendants")).toBe("#/delivery-attendants");
  });

  it("resolves known routes and falls back from unknown routes", () => {
    expect(getDestinationById("missing" as never).id).toBe(DEFAULT_DESTINATION_ID);
    expect(resolveDestinationFromHash("#/orders")).toMatchObject({
      destination: getDestinationById("orders"),
      wasFallback: false,
    });
    expect(resolveDestinationFromHash("#/delivery-attendants")).toMatchObject({
      destination: getDestinationById("delivery-attendants"),
      wasFallback: false,
    });

    const fallback = resolveDestinationFromHash("#/missing");

    expect(fallback.destination.id).toBe(DEFAULT_DESTINATION_ID);
    expect(fallback.wasFallback).toBe(true);
    expect(fallback.message).toContain("#/missing");
  });

  it("detects when navigation away from a dirty section needs confirmation", () => {
    expect(
      shouldConfirmNavigation(
        {
          activeDestinationId: "catalog",
          dirtySectionIds: ["catalog"],
        },
        "orders",
      ),
    ).toBe(true);
    expect(
      shouldConfirmNavigation(
        {
          activeDestinationId: "catalog",
          dirtySectionIds: ["catalog"],
        },
        "catalog",
      ),
    ).toBe(false);
    expect(
      shouldConfirmNavigation(
        {
          activeDestinationId: "sessions",
          dirtySectionIds: ["catalog"],
        },
        "orders",
      ),
    ).toBe(false);
  });
});
