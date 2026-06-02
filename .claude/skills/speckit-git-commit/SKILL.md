---
name: "speckit-git-commit"
description: "Stage and commit outstanding changes — the commit step used by the Spec Kit lifecycle hooks (before/after specify, plan, tasks, implement, etc.). Optionally pass a commit message as the argument."
argument-hint: "Optional commit message (defaults to a generated conventional message)"
compatibility: "Requires a Git repository; uses the git extension under .specify/extensions/git/"
metadata:
  author: "github-spec-kit"
  source: ".specify/extensions/git/commands/speckit.git.commit.md"
user-invocable: true
disable-model-invocation: false
---

# Commit outstanding changes

Stage and commit the working tree. This is the same logical step the Spec Kit lifecycle
hooks invoke (`speckit.git.commit`); here it is exposed as a directly invocable command.

## Resolve the mode

1. **Hook context (event-driven).** If this command was dispatched by a lifecycle hook, an
   event name is available (e.g. `after_specify`, `before_plan`, `after_implement`). In that
   case delegate to the config-gated script so the per-event `enabled`/`message` settings in
   `.specify/extensions/git/git-config.yml` are honored:
   - **Bash**: `.specify/extensions/git/scripts/bash/auto-commit.sh <event_name>`
   - **PowerShell**: `.specify/extensions/git/scripts/powershell/auto-commit.ps1 <event_name>`
   The script no-ops when the event is disabled, there are no changes, or Git is unavailable.

2. **Manual invocation (no event).** When a user runs `/speckit-git-commit` directly, do NOT
   gate on `git-config.yml` (that config only governs automatic hook firing). Commit the
   outstanding changes now:
   - If the user passed text as the argument, use it verbatim as the commit message.
   - Otherwise, generate a concise Conventional-Commits-style message from the staged diff
     (`type(scope): summary`), summarizing what changed.

## Execution (manual)

1. **Preconditions** — run `git rev-parse --is-inside-work-tree`; if it fails, report
   "not a Git repository" and stop. Run `git status --porcelain`; if empty, report
   "nothing to commit" and stop.
2. **Review** — run `git status -sb` and `git diff --stat` (and `git diff --staged --stat`)
   to understand the change set before composing a message.
3. **Stage** — `git add -A` (or stage only the relevant paths if the user scoped the request).
4. **Commit** — `git commit` with the resolved message. Follow this repo's commit conventions,
   including the trailer:

   ```
   Co-Authored-By: Claude <noreply@anthropic.com>
   ```

   (Match the exact trailer mandated by the project/global instructions if it differs.)
5. **Confirm** — report the new commit hash and one-line subject (`git log --oneline -1`).

## Guardrails

- Commit on the current branch. If on the default branch (`main`) and the change is feature
  work, warn the user and offer to create a branch first rather than committing to `main`
  directly (per the project's Git guidance).
- Never commit secrets, local databases, build output, or `.env*` files — rely on
  `.gitignore`; if such paths are staged, unstage them and warn.
- Do not push unless the user explicitly asks.

## Notes

- This command does not replace the lifecycle hooks; it is the manual entry point to the same
  commit behavior. The hooks remain configured in `.specify/extensions.yml` and gated by
  `.specify/extensions/git/git-config.yml`.
