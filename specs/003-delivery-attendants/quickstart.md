# Quickstart: Delivery Attendants

## Prerequisites

- Node.js compatible with the installed Vite/Vitest toolchain
- pnpm
- Rust and Cargo for desktop validation
- Tauri desktop prerequisites for Windows

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

This starts the Tauri shell, preloads `sqlite:c3bot.db`, and applies registered
migrations.

## Manual Attendants Smoke Test

1. Open the workspace and confirm the dark admin shell loads.
2. Open the `Atendentes` menu item.
3. Confirm the first view is the attendants list with an add action.
4. Add an attendant with name, display name, WhatsApp phone, and a valid image.
5. Confirm the new attendant appears in the list with photo, phone, and offline
   status.
6. Try saving another active attendant with the same WhatsApp phone and confirm the
   save is blocked.
7. Toggle the attendant online and confirm the row action changes to set offline.
8. Toggle the attendant offline and confirm the row action changes to set online.
9. Open the session transfer surface and confirm offline attendants are not valid
   transfer targets.
10. Try deleting an attendant with active assigned sessions and confirm deletion is
    blocked with a clear message.
11. Delete an attendant without active assigned sessions and confirm the row leaves
    the active list after confirmation.

## Validate

```powershell
pnpm typecheck
pnpm test
pnpm test:mutation
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
```

## Expected Result

- The admin menu includes a dedicated attendants destination.
- Attendant create/edit/list/status/delete flows work from the focused page.
- Photos persist as Base64 image data in the local attendant record.
- Offline and inactive attendants cannot receive transferred sessions.
- Domain tests and mutation coverage protect validation and transfer eligibility.
