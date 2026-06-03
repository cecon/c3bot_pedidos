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
  tags: [{ name: "Health" }, { name: "Attendants" }, { name: "Store" }, { name: "Catalogs" }, { name: "Merchant" }, { name: "Docs" }],
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
    "/api/catalogs/{id}/categories": {
      get: { tags: ["Catalogs"], summary: "List categories", responses: ok },
      post: { tags: ["Catalogs"], summary: "Create category", responses: ok },
    },
    "/api/categories/{id}": {
      put: { tags: ["Catalogs"], summary: "Update category", responses: ok },
      delete: { tags: ["Catalogs"], summary: "Remove category", responses: ok },
    },
    "/api/categories/{id}/order": { put: { tags: ["Catalogs"], summary: "Reorder categories", responses: ok } },
    "/api/categories/{id}/hours": { put: { tags: ["Catalogs"], summary: "Set category hours", responses: ok } },
    "/api/products": {
      get: { tags: ["Products"], summary: "List products", responses: ok },
      post: { tags: ["Products"], summary: "Create product", responses: ok },
    },
    "/api/products/{id}": {
      get: { tags: ["Products"], summary: "Get product", responses: ok },
      put: { tags: ["Products"], summary: "Update product", responses: ok },
      delete: { tags: ["Products"], summary: "Remove product", responses: ok },
    },
    "/api/products/{id}/status": { patch: { tags: ["Products"], summary: "Set product status/pause", responses: ok } },
    "/api/products/{id}/option-groups": {
      get: { tags: ["Options"], summary: "List option groups", responses: ok },
      post: { tags: ["Options"], summary: "Create option group", responses: ok },
    },
    "/api/option-groups/{id}": {
      put: { tags: ["Options"], summary: "Update option group", responses: ok },
      delete: { tags: ["Options"], summary: "Remove option group", responses: ok },
    },
    "/api/option-groups/{id}/options": {
      get: { tags: ["Options"], summary: "List options", responses: ok },
      post: { tags: ["Options"], summary: "Create option", responses: ok },
    },
    "/api/options/{id}": {
      put: { tags: ["Options"], summary: "Update option", responses: ok },
      delete: { tags: ["Options"], summary: "Remove option", responses: ok },
    },
    "/api/categories/{id}/items": {
      get: { tags: ["Items"], summary: "List items", responses: ok },
      post: { tags: ["Items"], summary: "Create item", responses: ok },
    },
    "/api/items/{id}": {
      put: { tags: ["Items"], summary: "Update item", responses: ok },
      delete: { tags: ["Items"], summary: "Remove item", responses: ok },
    },
    "/api/items/{id}/hours": { put: { tags: ["Items"], summary: "Set item hours", responses: ok } },
    "/api/items/{id}/combo-components": {
      get: { tags: ["Items"], summary: "List combo components", responses: ok },
      put: { tags: ["Items"], summary: "Set combo components", responses: ok },
    },
    "/api/categories/{id}/pizza-config": {
      get: { tags: ["Pizza"], summary: "Get pizza config", responses: ok },
      put: { tags: ["Pizza"], summary: "Create/replace pizza config", responses: ok },
    },
    "/api/pizza-config/{id}/sizes": { put: { tags: ["Pizza"], summary: "Set sizes", responses: ok } },
    "/api/pizza-config/{id}/crusts": { put: { tags: ["Pizza"], summary: "Set crusts", responses: ok } },
    "/api/pizza-config/{id}/edges": { put: { tags: ["Pizza"], summary: "Set edges", responses: ok } },
    "/api/pizza-config/{id}/flavors": { put: { tags: ["Pizza"], summary: "Set flavors", responses: ok } },
    "/api/pizza-config/{id}/flavor-prices": { put: { tags: ["Pizza"], summary: "Set flavor prices", responses: ok } },
    "/api/catalogs/{id}/mapping-readiness": { get: { tags: ["Mapping"], summary: "Mapping readiness", responses: ok } },
    "/api/merchants": {
      get: { tags: ["Merchant"], summary: "List merchants (paginated; single merchant)", responses: { "200": { description: "Merchant list", ...json("#/components/schemas/MerchantList") } } },
    },
    "/api/merchants/{id}": {
      get: { tags: ["Merchant"], summary: "Merchant detail", responses: { "200": { description: "Merchant", ...json("#/components/schemas/Merchant") } } },
      put: { tags: ["Merchant"], summary: "Update merchant profile", requestBody: json("#/components/schemas/Merchant"), responses: ok },
    },
    "/api/merchants/{id}/status": { get: { tags: ["Merchant"], summary: "Status for all operations", responses: ok } },
    "/api/merchants/{id}/status/{operation}": { get: { tags: ["Merchant"], summary: "Status for one operation", responses: ok } },
    "/api/merchants/{id}/opening-hours": {
      get: { tags: ["Merchant"], summary: "Get opening-hours shifts", responses: ok },
      put: { tags: ["Merchant"], summary: "Replace opening-hours shifts", responses: ok },
    },
    "/api/merchants/{id}/interruptions": {
      get: { tags: ["Merchant"], summary: "List current/future interruptions", responses: ok },
      post: { tags: ["Merchant"], summary: "Create interruption", responses: ok },
    },
    "/api/merchants/{id}/interruptions/{interruptionId}": {
      delete: { tags: ["Merchant"], summary: "Delete interruption", responses: ok },
    },
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
      MerchantOperation: {
        type: "object",
        required: ["name", "salesChannel", "enabled"],
        properties: {
          name: { type: "string", enum: ["DELIVERY", "INDOOR"] },
          salesChannel: { type: "string", example: "ifood-app" },
          enabled: { type: "boolean" },
        },
      },
      MerchantAddress: {
        type: "object",
        properties: {
          country: { type: ["string", "null"] }, state: { type: ["string", "null"] }, city: { type: ["string", "null"] },
          postalCode: { type: ["string", "null"] }, district: { type: ["string", "null"] }, street: { type: ["string", "null"] },
          number: { type: ["string", "null"] }, complement: { type: ["string", "null"] },
          latitude: { type: ["number", "null"] }, longitude: { type: ["number", "null"] },
        },
      },
      Merchant: {
        type: "object",
        required: ["id", "name", "type", "status"],
        properties: {
          id: { type: "string" }, name: { type: "string" }, corporateName: { type: ["string", "null"] },
          description: { type: ["string", "null"] }, averageTicket: { type: ["integer", "null"] },
          exclusive: { type: "boolean" }, type: { type: "string", example: "RESTAURANT" },
          status: { type: "string", enum: ["AVAILABLE", "UNAVAILABLE"] },
          cnpj: { type: ["string", "null"] }, externalCode: { type: ["string", "null"] },
          mappedToDestination: { type: "boolean" },
          address: { $ref: "#/components/schemas/MerchantAddress" },
          operations: { type: "array", items: { $ref: "#/components/schemas/MerchantOperation" } },
          createdAt: { type: ["string", "null"] },
        },
      },
      MerchantList: { type: "array", items: { $ref: "#/components/schemas/Merchant" } },
    },
  },
};
