#!/usr/bin/env node
// PreToolUse hook for UI work. Two jobs, both non-blocking (permissionDecision: "allow"):
//
// 1) Before authoring/editing a UI component, remind the agent to base it on the canonical shadcn
//    registry source (correct Radix wiring, a11y, cva variants) via the shadcn MCP — not hand-rolled.
// 2) WRAPPER GUARD: before CREATING a NEW wrapper (a new file under src/components/ui), surface the
//    list of wrappers that already exist so the agent reuses/extends one instead of duplicating.
//    The src/components/ui/* layer is the single source of truth — customizing a wrapper there
//    propagates the same appearance to every usage.
//
// Fires only for component source files under src/components (not tests). The shadcn MCP is in
// .mcp.json (server "shadcn"); its tools surface as mcp__shadcn__* (load via ToolSearch if absent).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

function emit(additionalContext) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "allow", additionalContext },
    }),
  );
  process.exit(0);
}

let payload;
try {
  payload = JSON.parse(readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const toolName = payload?.tool_name;
const filePath = payload?.tool_input?.file_path;
if (!["Write", "Edit", "MultiEdit"].includes(toolName) || typeof filePath !== "string") process.exit(0);

const isComponent = /src[\\/]components[\\/].*\.tsx$/.test(filePath) && !/\.test\.tsx$/.test(filePath);
if (!isComponent) process.exit(0);

const isPrimitive = /src[\\/]components[\\/]ui[\\/]/.test(filePath);
const cwd = payload?.cwd || process.cwd();
const uiDir = path.join(cwd, "src", "components", "ui");

function listWrappers() {
  try {
    return readdirSync(uiDir)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => f.replace(/\.tsx$/, ""))
      .sort();
  } catch {
    return [];
  }
}

const consult =
  `CONSULT THE shadcn MCP (server "shadcn", tools mcp__shadcn__* — load via ToolSearch if not present): ` +
  `search/view the canonical component and adapt it to this repo (Tailwind tokens / CSS variables, Lucide icons). ` +
  `Prefer the official shadcn/Radix implementation — accessible names, keyboard support, cva variants, forwardRef.`;

// Creating a NEW wrapper primitive → run the existence check first.
if (isPrimitive && !existsSync(filePath)) {
  const name = path.basename(filePath).replace(/\.tsx$/, "");
  const existing = listWrappers();
  emit(
    `Creating a NEW UI wrapper "${name}" (${filePath}). WRAPPER GUARD — first confirm it does not already ` +
      `exist: current wrappers in src/components/ui are [${existing.join(", ") || "none"}]. If one already covers ` +
      `this need, REUSE or extend it instead of duplicating (the ui/* layer is the single source of truth so ` +
      `customizations propagate everywhere). If it is genuinely new, ${consult}`,
  );
}

// Editing an existing wrapper → it is the shared source; remind to keep it canonical.
if (isPrimitive) {
  emit(
    `Editing the shared UI wrapper ${filePath} — changes here propagate to ALL usages, so keep one consistent ` +
      `appearance. ${consult}`,
  );
}

// A feature/page component → compose existing wrappers, don't re-style ad hoc.
emit(
  `UI component change (${filePath}). Build it from the existing src/components/ui/* wrappers ` +
    `[${listWrappers().join(", ") || "none"}] (do not inline ad-hoc styled elements or import Radix directly here). ` +
    `Only add a new wrapper if none fits — and then ${consult}`,
);
