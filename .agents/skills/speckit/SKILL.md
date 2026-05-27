---
name: "speckit"
description: "Entry point for the local GitHub Spec Kit workflow in this project. Use when the user asks for speckit, spec kit, SDD, specify, plan, tasks, implementation, or wants to know how to run the workflow."
compatibility: "Requires this repository's .specify/ and .agents/skills/ directories"
---

# C3Bot Spec Kit Entry Point

This project uses GitHub Spec Kit with the Codex integration.

## Available Local Skills

- `$speckit-constitution`: update project principles and governance.
- `$speckit-specify`: create or update a feature specification.
- `$speckit-clarify`: clarify ambiguous requirements.
- `$speckit-plan`: create the implementation plan and design artifacts.
- `$speckit-tasks`: generate implementation tasks.
- `$speckit-implement`: execute tasks.
- `$speckit-analyze`: check cross-artifact consistency.
- `$speckit-checklist`: create validation checklists.

## Terminal Commands

Use the project wrapper from the repository root:

```powershell
pnpm speckit -- --help
pnpm speckit:check
pnpm speckit:workflow:list
pnpm speckit:workflow -- --input "spec=describe the feature"
```

## Slash Command Note

If slash commands do not appear in Codex, use `$speckit-*` skill names or restart
Codex in this repository so it reloads `.agents/skills/`.
