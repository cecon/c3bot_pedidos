# ADR 0004: Product Catalog Architecture

**Status**: Accepted

**Date**: 2026-06-02

## Context

C3Bot needs an operator catalog that mirrors the iFood Food catalog structure (store →
catalog → category → product/item → option groups → options; plus pizza/combo templates),
so a future destination integration can map every sellable element through reserved external
reference codes. C3Bot is an intermediary, not the final fulfillment destination, and no live
synchronization is built yet (feature `005-product-catalog`).

## Decision

- **Layering (hexagonal).** Pure domain rules live in `src/domain/catalog/*` (validation,
  availability, pizza pricing, mapping readiness) with no IO — unit- and mutation-tested
  (StrykerJS ≥ 85% break threshold; catalog domain at ~88%). The HTTP API in `scripts/api/*`
  (the existing `node:http` server) performs persistence via Drizzle, reusing the domain rules
  server-side. React components are presentational (data via props, actions via callbacks) and
  consume a typed client (`src/services/catalogApi.ts`); a single container `CatalogWorkspace`
  orchestrates loading + state.
- **Schema.** `src/db/catalogSchema.ts` + `src/db/pizzaSchema.ts` (re-exported from
  `schema.ts`); the legacy `products` table is extended additively (image_base64,
  external_code, status, pause_until, unit_of_measure, reference_weight_grams) and migrated by
  the idempotent migration `003_product_catalog.sql` (per ADR-0003). Prices are integer cents.
- **External code** is unique per kind (partial unique indexes); a missing code is a
  non-blocking "not mapped" warning, surfaced by the mapping-readiness review.
- **OpenAPI** (`scripts/api/openapi.ts`) is the single source of truth for all endpoints,
  served at `GET /api/openapi.json` and rendered by Swagger UI at `GET /api/docs` (bundled
  `swagger-ui-dist`, offline), reachable from the "API / Docs" workspace menu entry. A test
  guards that every endpoint family is documented.
- **Clarified rules.** Product images are Base64 in the DB; options have no per-option
  quantity (group min/max governs); selling is always entered in units with a price basis of
  unit or weight (per-kg via a per-unit reference weight on the product, estimated and
  re-weighed at dispatch); pizza requires ≥1 flavor priced per size with a configurable
  pricing strategy; CNPJ accepts the new alphanumeric format.

## Consequences

- The catalog is integration-ready without live sync; an adapter can later read the OpenAPI
  contract and map via external codes.
- Domain logic is testable in isolation and carries the mutation gate; UI and API are thin.
- Single store per installation (no multi-tenant).

## Alternatives considered

- A flat product table with free-text category — rejected: cannot express complements, pizza,
  reuse, per-context catalogs, or destination mapping.
- Live iFood API sync now — rejected: deferred; only the destination-mappable model is built.
