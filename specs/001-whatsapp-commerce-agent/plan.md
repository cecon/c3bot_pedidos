# Implementation Plan: WhatsApp Commerce Agent Workspace

**Branch**: `001-whatsapp-commerce-agent` | **Date**: 2026-05-27 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-whatsapp-commerce-agent/spec.md`

## Summary

Build a local-first desktop workspace for WhatsApp attendants. The first increment
establishes the Spec Kit project, Tauri/Vite/React/Mantine scaffold, SQLite schema
migrations, a dark WhatsApp-like operations UI, and the initial domain test and mutation
gate. Later increments replace mock data with repository-backed workflows and real
session/address/campaign adapters.

## Technical Context

**Language/Version**: TypeScript 5.8, React 19, Rust 2021 edition

**Primary Dependencies**: Tauri 2, Vite 7, Mantine 9, Lucide React, Tauri SQL plugin,
Vitest 4, StrykerJS 9

**Storage**: SQLite local database (`sqlite:c3bot.db`) with Rust-registered migrations

**Testing**: Vitest unit tests, StrykerJS mutation tests, TypeScript typecheck, Vite
production build, Cargo check

**Target Platform**: Windows desktop first through Tauri; cross-platform desktop kept
available by Tauri defaults

**Project Type**: Desktop application

**Performance Goals**: First workspace render under 2 seconds after app startup on a
typical office workstation; chat send feedback under 250 ms for local state changes

**Constraints**: No landing page; dark UI; local data persistence; session credentials
and passwords excluded from logs; mutation break threshold 85% for covered domain code

**Scale/Scope**: Initial workspace supports dozens of sessions, hundreds of products,
thousands of customers/orders locally, and group-based automation configuration

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec-first traceability: PASS. Spec, checklist, plan, research, model, contracts,
  quickstart, and tasks are created under `specs/001-whatsapp-commerce-agent/`.
- Stack boundary: PASS. Current scaffold uses Tauri 2, Vite, React, TypeScript,
  Mantine, Rust, and SQLite.
- Privacy boundary: PASS with follow-up. The initial schema separates users, sessions,
  customers, and credentials; production password hashing and secret handling remain
  explicit tasks.
- Quality gate: PASS. `pnpm test` and `pnpm test:mutation` are configured; mutation
  threshold is 85%.
- Operator UX: PASS. The app opens directly into the dark workspace with sessions,
  chat, catalog, orders, groups, and campaigns.

## Project Structure

### Documentation (this feature)

```text
specs/001-whatsapp-commerce-agent/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-and-adapter-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── App.tsx
├── main.tsx
├── styles.css
├── theme.ts
├── domain/
│   ├── analytics.ts
│   ├── analytics.test.ts
│   ├── mockData.ts
│   └── types.ts
└── services/
    └── database.ts

src-tauri/
├── Cargo.toml
├── tauri.conf.json
├── capabilities/
│   └── default.json
├── migrations/
│   └── 001_init.sql
└── src/
    ├── lib.rs
    └── main.rs
```

**Structure Decision**: Keep a single Tauri/Vite app at the repository root so Spec Kit
artifacts, frontend, Rust shell, and tests share one workspace. Domain logic is isolated
under `src/domain/` so unit and mutation tests can grow before persistence and provider
adapters are wired in.

## Complexity Tracking

No constitution violations are required for the initial implementation.
