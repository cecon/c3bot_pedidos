---
name: "ui-plan"
description: "Plan a Mantine admin/operator UI before coding: delegates to the mantine-ux agent to produce a component tree, props/callback contract, domain-gated validation map, and dark-UX/a11y notes."
argument-hint: "What screen/panel to plan (e.g. 'MerchantPanel for feature 006' or a component path)"
compatibility: "Requires .claude/agents/mantine-ux.md and Mantine 9 stack"
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

You **MUST** consider the user input before proceeding. If it is empty, ask the user which screen,
panel, or component to plan, then continue.

# /ui-plan — plan operator UI with the mantine-ux specialist

This is the **planning hook** for UI work. It runs *before* (or alongside) implementation to produce
a concrete, house-style UI design grounded in this project's Mantine 9 + operator-dark-UX standards.

## Steps

1. **Gather context** (do this yourself before delegating, so the agent gets a tight brief):
   - Identify the target. If the argument references a feature, read its `specs/<feature>/plan.md`,
     `data-model.md`, and `contracts/*-contract.md` (the UI contract section).
   - List the sibling components in `src/components/` that establish house style; note 1–2 the agent
     should imitate.
   - Note the relevant domain validators in `src/domain/**` that must gate form actions.
   - Read `src/theme.ts` (the single styling source) so the plan reuses its palettes and semantic
     tokens (`STATUS_COLORS`, `UNMAPPED_COLOR`, `MONEY_COLOR`) — never new hard-coded colors.

2. **Delegate to the `mantine-ux` agent** with a brief containing: the target screen/panel, the data
   it shows, the actions it emits, the domain validators to wire in, the sibling components to match,
   and the request to PLAN (not review). Ask it to return:
   - Screen/panel breakdown → named Mantine component tree.
   - Props-in / callbacks-out contract (presentational, **no IO** in the component).
   - Validation map: which domain validator gates which action; disable-until-valid.
   - empty / loading / error / ready states.
   - Dark-UX notes (density, keyboard order, badges incl. the "não mapeado"-style warning) + a11y.
   - Theme map: which `src/theme.ts` tokens/semantic colors each element uses (no hard-coded colors).
   - Suggested presentational sub-components to stay under the 300-useful-line limit.

3. **Persist the plan**: write the agent's UI plan to `specs/<feature>/ui-plan.md` when the work maps
   to a Spec Kit feature; otherwise present it inline and offer to save it next to the component.

4. **Report**: summarize the component tree and the props/callback contract, and point to the saved
   file. Recommend `/ui-review` once the UI is implemented.

## Guardrails

- This skill plans UI only; it does not change product scope or write component code.
- Keep proposals consistent with existing `src/components/*` patterns — read them, don't invent a new
  visual language.
