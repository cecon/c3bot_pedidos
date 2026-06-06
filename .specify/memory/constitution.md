<!--
Sync Impact Report
Version change: 1.0.0 -> 2.0.0 (MAJOR)
Rationale: Backward-incompatible governance change to the mandated UI stack —
Mantine is replaced by Tailwind CSS + shadcn/ui (Radix UI primitives) + TanStack Table + Lucide.
Modified principles:
- II. Local-First Desktop Stack: frontend stack redefined (Mantine removed; Tailwind/shadcn/Radix/TanStack/Lucide added).
- V. Operator-Grade Dark UX: dark default now delivered via CSS-variable theming (class light/dark) instead of the Mantine dark theme.
Modified sections:
- Technology Boundaries: Frontend line updated to the new stack.
- Development Workflow: item 4 updated to reflect the approved UI stack.
Added sections: none
Removed sections: none
Feature status notes:
- 006-merchant-registry: implemented on Mantine (historical).
- 007-admin-ux-shell (premium admin UX on Mantine): SUPERSEDED by this platform change; to be
  rewritten on shadcn/ui under a new feature.
Templates requiring updates:
- .specify/templates/plan-template.md: ✅ reviewed, Constitution Check is generic (no Mantine reference) — aligned
- .specify/templates/spec-template.md: ✅ reviewed, tech-agnostic — no change required
- .specify/templates/tasks-template.md: ✅ reviewed, aligned
- .specify/extensions/git/commands/*.md: ✅ reviewed, aligned
Runtime guidance reviewed:
- CLAUDE.md: ✅ points to current plan via SPECKIT markers
- README.md / AGENTS.md: ⚠ pending — update stack references when the re-platform feature lands
Follow-up TODOs: none
-->

# C3Bot Constitution

## Core Principles

### I. Spec-Driven Product Slices
Every capability MUST start from a Spec Kit specification, plan, and task list before
implementation. User stories MUST remain independently testable and deliver visible
operator value, with the first story representing a working MVP slice.

### II. Local-First Desktop Stack
C3Bot MUST be built as a Tauri 2 desktop application. The frontend MUST use Vite, React,
TypeScript, Tailwind CSS, and shadcn/ui components built on Radix UI primitives (copied and
adjusted in-repo under `src/components/ui`), with TanStack Table for data tables and Lucide for
icons. The desktop shell MUST use Rust, and storage MUST use SQLite. Data that belongs to the
operator workspace MUST persist locally first, with explicit future integration boundaries for
external session APIs, address enrichment services, and campaign delivery providers. Mantine MUST
NOT be used.

### III. Session Security and Privacy
WhatsApp sessions MUST be scoped by phone number, status, assigned attendant, and
automation group. Session tokens, credentials, passwords, and personally identifiable
customer data MUST NOT be logged, hard-coded, or exposed through unrestricted UI or SQL
access. Password storage MUST use a one-way hash before production use.

### IV. Test and Mutation Gates
Domain behavior MUST have unit tests. Mutation testing MUST run on the covered domain
surface with an initial break threshold of 85%. Any shared workflow, pricing,
normalization, authorization, scheduling, or routing rule MUST include tests before or
with implementation.

### V. Operator-Grade Dark UX
The application MUST open directly into the usable workspace, not a marketing page. A dark
theme is the default, delivered through CSS variables with a class-based light/dark (and auto)
strategy. Chat, catalog, orders, customers, campaigns, and automation groups MUST be optimized
for repeated attendant work: dense, readable, keyboard-friendly, and visually close to WhatsApp
where chat behavior is involved.

## Technology Boundaries

- Frontend: Vite, React, TypeScript, Tailwind CSS, shadcn/ui (Radix UI primitives), TanStack
  Table, Lucide icons, Vitest.
- Desktop shell: Tauri 2 with Rust command/plugin boundary.
- Storage: SQLite managed by migrations; schema changes MUST be versioned.
- Integration boundaries: WhatsApp session API, address enrichment, MCP/skill/agent
  registry, and campaign delivery MUST be adapter-based and testable without live
  vendor calls.
- Data model MUST preserve traceability from WhatsApp number to customer, session,
  order, attendant, and automation group.

## Development Workflow

1. Update Spec Kit artifacts before implementation when scope changes.
2. Keep each task small enough to validate with unit tests, typecheck, and build.
3. Run `pnpm typecheck`, `pnpm test`, `pnpm test:mutation`, `pnpm build`, and
   `cargo check` before marking a feature ready.
4. Do not introduce UI frameworks, component libraries, databases, or session storage mechanisms
   outside the approved stack (Tailwind + shadcn/ui on Radix, TanStack Table, Lucide, SQLite)
   unless the plan records the reason and the constitution is amended.
5. Keep generated secrets, local databases, logs, and reports out of version control.

## Governance

This constitution supersedes ad hoc implementation choices. Amendments require a
documented rationale, a semantic version bump, and synchronization with templates,
plans, and tasks. Reviews MUST check constitution compliance, especially for security,
data persistence, UI workflow, and quality gates. Versioning follows semantic
versioning: MAJOR for incompatible governance changes, MINOR for new principles or
sections, and PATCH for clarifications.

**Version**: 2.0.0 | **Ratified**: 2026-05-27 | **Last Amended**: 2026-06-06
