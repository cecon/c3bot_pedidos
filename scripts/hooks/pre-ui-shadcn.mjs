#!/usr/bin/env node
// PreToolUse hook: before a UI component is written/edited, remind the agent to consult the shadcn
// MCP server so the implementation is based on the canonical registry source (correct Radix wiring,
// accessibility, cva variants) rather than hand-rolled. Non-blocking (permissionDecision: "allow").
//
// Fires only for component source files under src/components (not tests), and emphasizes the
// copyable primitives in src/components/ui. The shadcn MCP is configured in .mcp.json (server name
// "shadcn"); its tools surface as mcp__shadcn__* — use ToolSearch to load them if not present.
import { readFileSync } from "node:fs";

function emit(additionalContext) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
        additionalContext,
      },
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

emit(
  `UI component change (${filePath}). Before authoring or modifying this component, CONSULT THE shadcn MCP ` +
    `(server "shadcn", tools mcp__shadcn__* — load via ToolSearch if not present): search the registry for the ` +
    `matching component and view its canonical source, then adapt it to this repo (Tailwind tokens / CSS variables, ` +
    `Lucide icons, conventions in src/components/ui). Prefer the official shadcn/Radix implementation — accessible ` +
    `names, keyboard support, cva variants, forwardRef — over hand-rolling. ` +
    (isPrimitive
      ? `This is a src/components/ui primitive: pull it from the registry rather than writing it by hand.`
      : `Compose existing src/components/ui primitives; only add new primitives from the registry.`),
);
