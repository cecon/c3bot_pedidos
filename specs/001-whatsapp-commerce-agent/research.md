# Research: WhatsApp Commerce Agent Workspace

## Decision: Use Tauri 2 with Vite React scaffold

**Rationale**: The requested desktop stack is Tauri, Vite, and React. The official
Tauri docs recommend `create-tauri-app` or adding the Tauri CLI to an existing frontend.
Because Spec Kit already owns the repository root, the scaffold was generated separately
and merged into the existing workspace.

**Alternatives considered**: Electron was rejected because the stack was explicitly
Tauri. A web-only Vite app was rejected because local desktop packaging and SQLite
storage are required.

## Decision: Use Mantine 9 as the UI system

**Rationale**: Mantine provides the required dark theme, forms, tabs, tables, badges,
notifications, and layout primitives while keeping the workspace dense and operational.

**Alternatives considered**: Hand-built CSS only was rejected because it would slow down
form and dashboard work. Other UI kits were rejected because Mantine was requested.

## Decision: Use Tauri SQL plugin for SQLite bootstrap

**Rationale**: The Tauri SQL plugin supports SQLite and Rust-registered migrations.
This gives the app a local database immediately while leaving room to move sensitive
business commands behind Rust APIs as the domain matures.

**Alternatives considered**: Browser storage was rejected because local SQLite was
required. A separate local HTTP backend was rejected for the initial desktop-only scope.

## Decision: Use Vitest and StrykerJS for quality gates

**Rationale**: Vitest integrates with Vite and TypeScript. StrykerJS has an official
Vitest runner, allowing mutation testing over domain logic without replacing the test
runner.

**Alternatives considered**: Jest was rejected because Vitest is the natural Vite test
runner. Running mutation over the whole UI was deferred because the initial component
test surface is not broad enough yet.

## Decision: Model provider integrations as adapters

**Rationale**: WhatsApp session APIs, address enrichment, MCP registries, skills,
agents, and campaigns will vary by provider. Adapter boundaries keep workflows testable
without live vendor credentials.

**Alternatives considered**: Direct provider calls from UI were rejected due to
security, testability, and credential exposure risk.
