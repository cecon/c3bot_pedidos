import { describe, expect, it } from "vitest";
import { openapiDocument } from "./openapi";

// Coverage guard (T083 / FR-033): every endpoint family the catalog API exposes must be
// documented in the OpenAPI source of truth. Update this list when adding endpoints.
const REQUIRED_PATHS = [
  "/api/health",
  "/api/attendants",
  "/api/attendants/{id}",
  "/api/store",
  "/api/store/hours",
  "/api/catalogs",
  "/api/catalogs/{id}",
  "/api/catalogs/{id}/hours",
  "/api/catalogs/{id}/categories",
  "/api/categories/{id}",
  "/api/categories/{id}/order",
  "/api/categories/{id}/hours",
  "/api/categories/{id}/items",
  "/api/categories/{id}/pizza-config",
  "/api/products",
  "/api/products/{id}",
  "/api/products/{id}/status",
  "/api/products/{id}/option-groups",
  "/api/option-groups/{id}",
  "/api/option-groups/{id}/options",
  "/api/options/{id}",
  "/api/items/{id}",
  "/api/items/{id}/hours",
  "/api/items/{id}/combo-components",
  "/api/pizza-config/{id}/sizes",
  "/api/pizza-config/{id}/crusts",
  "/api/pizza-config/{id}/edges",
  "/api/pizza-config/{id}/flavors",
  "/api/pizza-config/{id}/flavor-prices",
  "/api/catalogs/{id}/mapping-readiness",
  "/api/openapi.json",
  "/api/docs",
];

describe("openapi document", () => {
  it("is a valid OpenAPI 3.1 document", () => {
    expect(openapiDocument.openapi).toBe("3.1.0");
    expect(openapiDocument.info.title).toBe("C3Bot Local API");
  });

  it("documents every required endpoint (single source of truth)", () => {
    const documented = Object.keys(openapiDocument.paths);
    const missing = REQUIRED_PATHS.filter((path) => !documented.includes(path));
    expect(missing).toEqual([]);
  });
});
