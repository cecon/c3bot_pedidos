// PostToolUse hook (Write|Edit|MultiEdit). Reads the hook payload on stdin and, for the
// edited code file, runs three checks and emits reminders:
//   1. max 300 useful lines (hard block)         -> SRP / file-size discipline
//   2. filler-test guard for *.test.* / #[test]  -> blocks tests with no real assertions
//   3. ESLint on JS/TS (hard block on errors)
// Reminders (non-blocking) nudge toward hexagonal architecture / SOLID / DRY / KISS and
// meaningful tests. Subjective principles can't be mechanically proven, so they are
// surfaced as additionalContext rather than enforced.
//
// Output: PostToolUse JSON. `decision: "block"` feeds `reason` back to Claude to fix;
// otherwise `hookSpecificOutput.additionalContext` injects the reminders.

import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { countUsefulLines, MAX_USEFUL_LINES } from "../lib/useful-lines.mjs";

const CODE_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".rs"]);
const LINT_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const TEST_RE = /\.test\.(ts|tsx|js|jsx|mjs|cjs)$/;
// A presentational UI component edit (Mantine .tsx under src/components, not a test) should be
// planned/reviewed for operator-grade dark UX. Surface the mantine-ux agent + /ui-plan, /ui-review.
const UI_COMPONENT_RE = /src[\\/]components[\\/].*\.tsx$/;
const IO_IN_COMPONENT_RE = /\b(fetch\s*\(|invoke\s*\(|fromCSV|new\s+Database|drizzle\s*\(|axios)\b/;
// All color/styling MUST be driven by src/theme.ts (Mantine theme + semantic tokens). Hard-coded
// color literals in a component bypass the theme — block them. theme.ts is the only allowed home.
const COLOR_LITERAL_RE = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\s*\(/;

function pass(reminders) {
  if (reminders.length > 0) {
    process.stdout.write(
      JSON.stringify({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: reminders.join(" ") } }),
    );
  }
  process.exit(0);
}

function block(reasons) {
  process.stdout.write(JSON.stringify({ decision: "block", reason: reasons.join("\n\n") }));
  process.exit(0);
}

function detectFillerTests(text, ext) {
  const issues = [];
  const tautology = /expect\(\s*(true|false|1|0|null)\s*\)\s*\.\s*(toBe|toEqual|toBeTruthy|toBeFalsy)\s*\(/.test(text);
  const emptyBody = /\b(it|test)\s*\([^)]*,\s*(async\s*)?\(\s*\)\s*=>\s*\{\s*\}\s*\)/.test(text);

  if (ext === ".rs") {
    if (/#\[test\]/.test(text) && !/assert(_eq|_ne)?!|panic!|\.unwrap\(\)|\?;/.test(text)) {
      issues.push("Rust test file has #[test] functions but no assert!/assert_eq!/panic! — add real assertions.");
    }
    if (/assert!\(\s*true\s*\)/.test(text)) issues.push("Found `assert!(true)` — replace with a meaningful assertion.");
    return issues;
  }

  const hasTestBlocks = /\b(it|test)\s*\(/.test(text);
  const hasAssertions = /\bexpect\s*\(|\bassert\b/.test(text);
  if (hasTestBlocks && !hasAssertions) {
    issues.push("Test file defines it()/test() blocks but contains no expect()/assert — these are filler tests.");
  }
  if (tautology) issues.push("Found a tautological assertion (e.g. expect(true).toBe(true)) — assert real behavior.");
  if (emptyBody) issues.push("Found an empty test body — implement the test or remove it.");
  return issues;
}

function main() {
  let payload;
  try {
    payload = JSON.parse(readFileSync(0, "utf8") || "{}");
  } catch {
    process.exit(0);
  }

  const filePath = payload?.tool_input?.file_path;
  if (typeof filePath !== "string" || !existsSync(filePath)) process.exit(0);

  const ext = path.extname(filePath);
  if (!CODE_EXT.has(ext)) process.exit(0);

  const text = readFileSync(filePath, "utf8");
  const blockers = [];
  const reminders = [];

  const useful = countUsefulLines(text);
  if (useful > MAX_USEFUL_LINES) {
    blockers.push(
      `${filePath} has ${useful} useful lines (limit ${MAX_USEFUL_LINES}, excluding comments/blank). ` +
        "Split responsibilities (SRP) before continuing.",
    );
  }

  const isTest = TEST_RE.test(filePath) || (ext === ".rs" && /#\[test\]|#\[cfg\(test\)\]/.test(text));
  if (isTest) {
    blockers.push(...detectFillerTests(text, ext));
    reminders.push("Tests: verify each case asserts real behavior (meaningful inputs, edge cases, failure paths) — not filler.");
  }

  if (LINT_EXT.has(ext)) {
    try {
      execFileSync("pnpm", ["exec", "eslint", filePath], { stdio: "pipe" });
    } catch (error) {
      const out = `${error.stdout?.toString() ?? ""}${error.stderr?.toString() ?? ""}`.trim();
      blockers.push(`ESLint reported problems in ${filePath}:\n${out.slice(0, 4000)}`);
    }
  }

  reminders.push(
    "Review the change against hexagonal architecture (domain isolated from IO/adapters), SOLID, DRY and KISS.",
  );

  if (UI_COMPONENT_RE.test(filePath) && !isTest) {
    if (COLOR_LITERAL_RE.test(text)) {
      blockers.push(
        `${filePath} contains a hard-coded color literal (hex/rgb/hsl). All colors MUST be driven by the ` +
          "design tokens: use Tailwind classes mapped to the CSS variables (bg-primary, text-muted-foreground, " +
          "etc.) or reference the token source in src/theme/themeTokens.ts. Move any new color there.",
      );
    }
    if (IO_IN_COMPONENT_RE.test(text)) {
      reminders.push(
        "UI: this component appears to perform IO (fetch/invoke/db). Presentational components MUST stay pure " +
          "— move IO to services/domain and pass data via props, actions via callbacks.",
      );
    }
    reminders.push(
      "UI changed: plan with /ui-plan (before) and review with /ui-review (after) — both delegate to the " +
        "mantine-ux agent and the preview harness to check operator-grade dark UX (dense, keyboard-friendly, " +
        "domain-gated validation, accessible names, status not by color alone).",
    );
  }

  if (blockers.length > 0) block(blockers);
  pass(reminders);
}

main();
