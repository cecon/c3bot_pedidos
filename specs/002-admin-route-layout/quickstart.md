# Quickstart: Admin Route Layout

## Prerequisites

- Node.js compatible with the installed Vite/Vitest toolchain
- pnpm
- Rust and Cargo for full desktop validation
- Tauri desktop prerequisites for the target operating system

## Install

```powershell
pnpm install
```

## Run Web Workspace

```powershell
pnpm dev
```

Open the Vite URL printed by the command, usually `http://localhost:3920`.

## Run Desktop App

```powershell
pnpm tauri dev
```

## Manual Navigation Smoke Test

1. Open the workspace and confirm it starts in an operational admin shell.
2. Confirm the sidebar and header remain visible.
3. Open dashboard, sessions, catalog, orders, customers, automation groups,
   campaigns, and settings from the menu.
4. Confirm the browser hash changes between `#/dashboard`, `#/sessions`,
   `#/catalog`, `#/orders`, `#/customers`, `#/automation-groups`, `#/campaigns`,
   and `#/settings`.
5. Confirm each destination shows focused content for that function only.
6. Select a chat session, navigate to another section, return to sessions, and confirm
   the selected session is still active.
7. Add a product draft value, navigate away, return to catalog, and confirm the draft
   is preserved unless submitted or cleared.
8. Open an unknown hash route such as `#/missing` and confirm the app returns to a safe
   workspace section with a clear message.
9. Reduce the desktop window width and confirm header, sidebar, and content text do
   not overlap.

## Validate

```powershell
pnpm typecheck
pnpm test
pnpm test:mutation
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
```

## Expected Result

- Every primary function is reachable as a separate destination.
- The active menu item and page title are clear.
- The app no longer defaults to showing all primary modules in one workspace grid.
- Route helper tests and mutation coverage pass.
