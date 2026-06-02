import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { writeJson } from "./http";

// Serve Swagger UI (bundled swagger-ui-dist, offline) at GET /api/docs, pointed at the
// OpenAPI document at /api/openapi.json. Assets are served from the package dir. FR-034.
const require = createRequire(import.meta.url);
const distPath: string = require("swagger-ui-dist").getAbsoluteFSPath();

const PAGE = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>C3Bot API</title>
    <link rel="stylesheet" href="/api/docs/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api/docs/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({ url: "/api/openapi.json", dom_id: "#swagger-ui" });
    </script>
  </body>
</html>`;

const ASSET_CONTENT_TYPE: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".png": "image/png",
};

export function serveDocs(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(PAGE);
}

export function serveDocsAsset(_req: IncomingMessage, res: ServerResponse, params: string[]): void {
  const name = path.basename(params[0]); // prevent path traversal
  const allowed = new Set([
    "swagger-ui.css",
    "swagger-ui-bundle.js",
    "swagger-ui-standalone-preset.js",
    "favicon-32x32.png",
  ]);
  if (!allowed.has(name)) {
    writeJson(res, 404, { message: "Not found" });
    return;
  }
  const contentType = ASSET_CONTENT_TYPE[path.extname(name)] ?? "application/octet-stream";
  res.writeHead(200, { "Content-Type": contentType });
  res.end(readFileSync(path.join(distPath, name)));
}
