// Runtime OpenAPI 3.1 document — the single source of truth for the C3Bot API (FR-033),
// served at GET /api/openapi.json and rendered by Swagger UI at GET /api/docs. Paths are
// added here as endpoints land; T083 verifies router/openapi coverage. Mirrors the design
// contract in specs/005-product-catalog/contracts/openapi.yaml.

const json = (ref: string) => ({ content: { "application/json": { schema: { $ref: ref } } } });
const ok = { "200": { description: "OK" } };

function crud(tag: string, listRef: string, itemRef: string) {
  return {
    get: { tags: [tag], summary: `List ${tag}`, responses: { "200": { description: "List", ...json(listRef) } } },
    post: { tags: [tag], summary: `Create ${tag}`, requestBody: json(itemRef), responses: { "201": { description: "Created", ...json(itemRef) } } },
  };
}

export const openapiDocument = {
  openapi: "3.1.0",
  info: { title: "C3Bot Local API", version: "0.5.0" },
  servers: [{ url: "http://localhost:3922" }],
  tags: [{ name: "Health" }, { name: "Attendants" }, { name: "Store" }, { name: "Catalogs" }, { name: "Docs" }],
  paths: {
    "/api/health": { get: { tags: ["Health"], summary: "Liveness", responses: ok } },
    "/api/attendants": crud("Attendants", "#/components/schemas/AttendantList", "#/components/schemas/Attendant"),
    "/api/attendants/{id}": {
      patch: { tags: ["Attendants"], summary: "Update attendant", responses: ok },
      delete: { tags: ["Attendants"], summary: "Soft-delete attendant", responses: ok },
    },
    "/api/attendants/{id}/availability": { patch: { tags: ["Attendants"], summary: "Set availability", responses: ok } },
    "/api/store": {
      get: { tags: ["Store"], summary: "Get the single store", responses: { "200": { description: "Store", ...json("#/components/schemas/Store") } } },
      put: { tags: ["Store"], summary: "Update store profile", requestBody: json("#/components/schemas/Store"), responses: ok },
    },
    "/api/store/hours": { put: { tags: ["Store"], summary: "Set store weekly hours", responses: ok } },
    "/api/catalogs": crud("Catalogs", "#/components/schemas/CatalogList", "#/components/schemas/Catalog"),
    "/api/catalogs/{id}": {
      get: { tags: ["Catalogs"], summary: "Get catalog", responses: { "200": { description: "Catalog", ...json("#/components/schemas/Catalog") } } },
      put: { tags: ["Catalogs"], summary: "Update catalog", requestBody: json("#/components/schemas/Catalog"), responses: ok },
      delete: { tags: ["Catalogs"], summary: "Remove catalog", responses: ok },
    },
    "/api/catalogs/{id}/hours": { put: { tags: ["Catalogs"], summary: "Set catalog weekly hours", responses: ok } },
    "/api/openapi.json": { get: { tags: ["Docs"], summary: "This document", responses: ok } },
    "/api/docs": { get: { tags: ["Docs"], summary: "Swagger UI", responses: ok } },
  },
  components: {
    schemas: {
      AvailabilityState: { type: "string", enum: ["available", "unavailable", "paused"] },
      Attendant: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, displayName: { type: "string" }, whatsappNumber: { type: "string" } } },
      AttendantList: { type: "array", items: { $ref: "#/components/schemas/Attendant" } },
      Store: {
        type: "object",
        required: ["id", "name"],
        properties: {
          id: { type: "string" }, name: { type: "string" }, cnpj: { type: ["string", "null"] },
          street: { type: ["string", "null"] }, city: { type: ["string", "null"] }, state: { type: ["string", "null"] },
          latitude: { type: ["number", "null"] }, longitude: { type: ["number", "null"] },
          externalCode: { type: ["string", "null"] }, status: { $ref: "#/components/schemas/AvailabilityState" },
        },
      },
      Catalog: {
        type: "object",
        required: ["id", "name", "context"],
        properties: {
          id: { type: "string" }, name: { type: "string" },
          context: { type: "string", enum: ["delivery", "indoor", "takeout"] },
          externalCode: { type: ["string", "null"] }, status: { $ref: "#/components/schemas/AvailabilityState" },
        },
      },
      CatalogList: { type: "array", items: { $ref: "#/components/schemas/Catalog" } },
    },
  },
};
