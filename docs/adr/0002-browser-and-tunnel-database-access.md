# ADR 0002: Browser and Tunnel Database Access Through REST API

**Status**: Accepted

**Date**: 2026-05-29

## Context

C3Bot can render the same Vite frontend inside the Tauri WebView or in a regular
browser at `http://localhost:3920`. The Tauri SQL plugin is available only inside the
Tauri WebView. Running the Tauri desktop app does not expose the local SQLite plugin
to a separate browser tab, and a tunnel only exposes the web frontend unless an
explicit backend API is also exposed.

Delivery attendant management needs to support browser and tunnel usage without
reintroducing mock runtime attendants, direct SQL from UI code, or unsafe direct
access to the local SQLite database.

## Decision

Database-backed operations from a non-Tauri browser or tunnel must go through an
authenticated REST API. The browser client must not attempt to use the Tauri SQL
plugin, connect directly to SQLite, or bypass the ORM governance defined in
[ADR 0001](./0001-database-access-and-migrations.md).

The frontend must select the persistence adapter by runtime:

- Inside the Tauri WebView, it may use the Tauri SQL adapter backed by Drizzle ORM.
- Outside Tauri, it may use a REST adapter only when an API base URL is configured,
  for example through `VITE_C3BOT_API_BASE_URL`.
- Outside Tauri with no REST API configured, database mutations must stay disabled
  and show an explicit unavailable state.

The REST API owns all database access and must use the approved ORM-based access
boundary. For delivery attendants, the API surface should expose the same persistence
capabilities as the local repository:

```text
GET    /api/attendants
POST   /api/attendants
PATCH  /api/attendants/:id
PATCH  /api/attendants/:id/availability
DELETE /api/attendants/:id
```

The local development REST API must default to the same application data database
used by Tauri, such as `%APPDATA%\br.com.c3bot.app\c3bot.db` on Windows, unless
`C3BOT_DB_PATH` explicitly points to another database for tests or an isolated
environment.

Created attendants start offline. Deletion remains a soft delete. Transfer targets
must continue to come only from persisted active attendants with `online`
availability.

Any deployment reachable through a tunnel must require authentication, restrict CORS
to approved origins, use HTTPS at the exposed edge, avoid logging WhatsApp numbers or
Base64 photos, and enforce request size limits for photo payloads.

## Consequences

- Browser and tunnel support requires a backend API before attendant mutations can be
  enabled outside the Tauri WebView.
- The current browser-only Vite preview remains valid for layout checks, but it must
  not fabricate database-backed data or silently write to a different storage layer.
- Future implementation should add separate repository adapters for Tauri SQL and
  REST while keeping the UI and domain workflow behind the same attendant repository
  contract.
- Schema changes for the API-backed persistence path still follow ADR 0001: ORM
  access and command-generated migrations are mandatory.

## Rejected Alternatives

- **Use Tauri SQL from a regular browser tab**: rejected because the plugin exists
  only inside the Tauri WebView and is not available to external browser contexts.
- **Expose SQLite directly to the browser or tunnel**: rejected because it bypasses
  the application access boundary and creates avoidable security and data integrity
  risks.
- **Fallback to mock attendants outside Tauri**: rejected because operational mock
  data can be mistaken for real employees and was explicitly removed from runtime
  persistence flows.
