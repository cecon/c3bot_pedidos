<!--
Sync Impact Report
Version change: template -> 1.0.0
Modified principles: template placeholders -> C3Bot operating principles
Added sections: Technology Boundaries; Development Workflow
Removed sections: none
Templates requiring updates:
- .specify/templates/plan-template.md: updated
- .specify/templates/tasks-template.md: updated
- .specify/templates/spec-template.md: reviewed, no changes required
Follow-up TODOs: none
-->

# C3Bot Constitution

## Core Principles

### I. Spec-Driven Product Slices
Every capability MUST start from a Spec Kit specification, plan, and task list before
implementation. User stories MUST remain independently testable and deliver visible
operator value, with the first story representing a working MVP slice.

### II. Local-First Desktop Stack
C3Bot MUST be built as a Tauri desktop application using Vite, React, TypeScript,
Mantine, Rust, and SQLite. Data that belongs to the operator workspace MUST persist
locally first, with explicit future integration boundaries for external session APIs,
address enrichment services, and campaign delivery providers.

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
The application MUST open directly into the usable workspace, not a marketing page.
Mantine dark theme is the default. Chat, catalog, orders, customers, campaigns, and
automation groups MUST be optimized for repeated attendant work: dense, readable,
keyboard-friendly, and visually close to WhatsApp where chat behavior is involved.

## Technology Boundaries

- Frontend: Vite, React, TypeScript, Mantine, Lucide icons, Vitest.
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
4. Do not introduce new UI frameworks, databases, or session storage mechanisms unless
   the plan records the reason and the constitution is amended.
5. Keep generated secrets, local databases, logs, and reports out of version control.

## Governance

This constitution supersedes ad hoc implementation choices. Amendments require a
documented rationale, a semantic version bump, and synchronization with templates,
plans, and tasks. Reviews MUST check constitution compliance, especially for security,
data persistence, UI workflow, and quality gates. Versioning follows semantic
versioning: MAJOR for incompatible governance changes, MINOR for new principles or
sections, and PATCH for clarifications.

**Version**: 1.0.0 | **Ratified**: 2026-05-27 | **Last Amended**: 2026-05-27
