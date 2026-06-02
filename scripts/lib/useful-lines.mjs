// Shared "useful line" counting used by the max-lines governance check
// (scripts/check-max-lines.mjs) and the post-edit hook (scripts/hooks/post-edit-check.mjs).
// A useful line is a non-blank line that is not a pure comment.

export const MAX_USEFUL_LINES = 300;

export function countUsefulLines(text) {
  let count = 0;
  let inBlockComment = false;

  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line) continue;

    if (inBlockComment) {
      const blockEnd = line.indexOf("*/");
      if (blockEnd === -1) continue;
      line = line.slice(blockEnd + 2).trim();
      inBlockComment = false;
      if (!line) continue;
    }

    while (line.startsWith("/*")) {
      const blockEnd = line.indexOf("*/", 2);
      if (blockEnd === -1) {
        inBlockComment = true;
        line = "";
        break;
      }
      line = line.slice(blockEnd + 2).trim();
    }

    if (!line || line.startsWith("//") || line.startsWith("#") || line.startsWith("--")) continue;
    count += 1;
  }

  return count;
}
