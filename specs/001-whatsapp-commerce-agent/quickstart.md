# Quickstart: WhatsApp Commerce Agent Workspace

## Prerequisites

- Node.js compatible with the installed Vite/Vitest toolchain
- pnpm
- Rust and Cargo
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

This starts the Tauri shell, preloads `sqlite:c3bot.db`, and applies migrations.

## Validate

```powershell
pnpm typecheck
pnpm test
pnpm test:mutation
pnpm build
cargo check --manifest-path src-tauri/Cargo.toml
```

## Manual Smoke Test

1. Open the workspace.
2. Add a WhatsApp session number.
3. Select the new session and send a chat message.
4. Add a catalog product with price.
5. Open orders and schedule an order from the active chat.
6. Open groups and confirm MCP, skill, and agent bindings are visible.
7. Open campaigns and create a draft campaign template.
