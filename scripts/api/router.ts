import type { IncomingMessage, ServerResponse } from "node:http";
import { writeJson } from "./http";
import { openapiDocument } from "./openapi";
import { getStore, putStore, putStoreHours } from "./store";
import { createCatalog, deleteCatalog, getCatalog, listCatalogs, setCatalogHours, updateCatalog } from "./catalogs";

type Handler = (req: IncomingMessage, res: ServerResponse, params: string[]) => void | Promise<void>;
interface Route {
  method: string;
  pattern: RegExp;
  handler: Handler;
}

const routes: Route[] = [
  { method: "GET", pattern: /^\/api\/openapi\.json$/, handler: (_q, res) => writeJson(res, 200, openapiDocument) },
  { method: "GET", pattern: /^\/api\/store$/, handler: getStore },
  { method: "PUT", pattern: /^\/api\/store$/, handler: putStore },
  { method: "PUT", pattern: /^\/api\/store\/hours$/, handler: putStoreHours },
  { method: "GET", pattern: /^\/api\/catalogs$/, handler: listCatalogs },
  { method: "POST", pattern: /^\/api\/catalogs$/, handler: createCatalog },
  { method: "GET", pattern: /^\/api\/catalogs\/([^/]+)$/, handler: getCatalog },
  { method: "PUT", pattern: /^\/api\/catalogs\/([^/]+)$/, handler: updateCatalog },
  { method: "DELETE", pattern: /^\/api\/catalogs\/([^/]+)$/, handler: deleteCatalog },
  { method: "PUT", pattern: /^\/api\/catalogs\/([^/]+)\/hours$/, handler: setCatalogHours },
];

// Dispatch a catalog API request. Returns true if a route handled it, false otherwise
// (so the caller can fall through to the attendant routes / 404).
export async function handleCatalogApi(
  request: IncomingMessage,
  response: ServerResponse,
  pathname: string,
): Promise<boolean> {
  for (const route of routes) {
    if (request.method !== route.method) continue;
    const match = route.pattern.exec(pathname);
    if (!match) continue;
    await route.handler(request, response, match.slice(1));
    return true;
  }
  return false;
}
