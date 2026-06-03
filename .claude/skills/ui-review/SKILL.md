---
name: "ui-review"
description: "Review implemented Mantine admin/operator UI against dark-UX, presentational-purity, domain-gated-validation and a11y standards, driving the live preview harness (Claude_Preview) for screenshots/snapshots. Delegates to the mantine-ux agent."
argument-hint: "What UI to review (component path, screen name, or feature). Empty = review the most recently edited components."
compatibility: "Requires .claude/agents/mantine-ux.md, .claude/launch.json (c3bot-dev), Claude_Preview MCP"
metadata:
  author: "c3bot"
  source: "local"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input. If empty, review the UI component(s) most recently changed in
`src/components/` (use `git status`/`git diff --name-only`).

# /ui-review — review operator UI with the harness + mantine-ux specialist

This is the **review hook** for UI work. It runs *after* implementation to critique the rendered UI
against the project's standards, using the live preview harness for visual evidence.

## Steps

1. **Scope the review**: resolve the target component(s)/screen from the argument or from recently
   edited `src/components/*.tsx`. Read those files plus the matching `specs/<feature>/ui-plan.md` (if
   `/ui-plan` produced one) and the UI contract so the review checks against intent.

2. **Bring up the harness** (the agent can do this, or do it here first):
   - `preview_list`; if nothing is running, `preview_start` with config **c3bot-dev** (port 3920).
   - Ensure the dev API is up if the screen needs data (`pnpm api` on :3922) — note it if not.
   - Navigate to the screen under review.

3. **Delegate to the `mantine-ux` agent** to REVIEW. Ask it to:
   - `preview_screenshot` + `preview_snapshot` the screen; `preview_resize` to a narrow operator
     window; `preview_console_logs` for runtime errors/warnings.
   - Produce a prioritized findings list: **[blocker | major | minor]** — what, file+component, which
     standard it violates, and the concrete Mantine fix.
   - Verify: presentational purity (no IO in component), domain-gated validation (disable-until-valid),
     dark/dense/keyboard-friendly, accessible names, status not by color alone, consistency with
     sibling components. Distinguish real defects from the known `NumberInput`/`Textarea` harness
     caveats.

4. **Report**: lead with a verdict (SHIP / CHANGES NEEDED), then the findings list with file
   references and suggested diffs. Offer to apply the agreed fixes.

## Guardrails

- This skill reviews and advises; apply code changes only after the user agrees to the findings.
- Do not fail a review solely on a harness caveat (synthetic `NumberInput` value, `Textarea`
  autosize) — call it out as a harness limitation, not a UI bug.
- Leave the preview running for follow-up unless asked to `preview_stop`.
