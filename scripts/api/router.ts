import type { IncomingMessage, ServerResponse } from "node:http";
import { writeJson } from "./http";
import { openapiDocument } from "./openapi";
import { getStore, putStore, putStoreHours } from "./store";
import { createCatalog, deleteCatalog, getCatalog, listCatalogs, setCatalogHours, updateCatalog } from "./catalogs";
import {
  createCategory,
  deleteCategory,
  listCategories,
  reorderCategories,
  setCategoryHours,
  updateCategory,
} from "./categories";
import { createProduct, deleteProduct, getProduct, listProducts, setProductStatus, updateProduct } from "./products";
import { createItem, deleteItem, listItems, setItemHours, updateItem } from "./items";
import {
  createOption,
  createOptionGroup,
  deleteOption,
  deleteOptionGroup,
  listOptionGroups,
  listOptions,
  updateOption,
  updateOptionGroup,
} from "./optionGroups";
import {
  getPizzaConfig,
  putPizzaConfig,
  setCrusts,
  setEdges,
  setFlavorPrices,
  setFlavors,
  setSizes,
} from "./pizza";
import { listComboComponents, setComboComponents } from "./combos";
import { getMappingReadiness } from "./mapping";
import { serveDocs, serveDocsAsset } from "./docs";
import { getMerchant, listMerchants, putMerchant } from "./merchant";
import { getMerchantOperationStatus, getMerchantStatus } from "./merchantStatus";
import { getOpeningHours, putOpeningHours } from "./openingHours";
import { createInterruption, deleteInterruption, listInterruptions } from "./interruptions";

type Handler = (req: IncomingMessage, res: ServerResponse, params: string[]) => void | Promise<void>;
interface Route {
  method: string;
  pattern: RegExp;
  handler: Handler;
}

const routes: Route[] = [
  { method: "GET", pattern: /^\/api\/openapi\.json$/, handler: (_q, res) => writeJson(res, 200, openapiDocument) },
  { method: "GET", pattern: /^\/api\/docs$/, handler: serveDocs },
  { method: "GET", pattern: /^\/api\/docs\/([^/]+)$/, handler: serveDocsAsset },
  { method: "GET", pattern: /^\/api\/store$/, handler: getStore },
  { method: "PUT", pattern: /^\/api\/store$/, handler: putStore },
  { method: "PUT", pattern: /^\/api\/store\/hours$/, handler: putStoreHours },
  { method: "GET", pattern: /^\/api\/catalogs$/, handler: listCatalogs },
  { method: "POST", pattern: /^\/api\/catalogs$/, handler: createCatalog },
  { method: "GET", pattern: /^\/api\/catalogs\/([^/]+)$/, handler: getCatalog },
  { method: "PUT", pattern: /^\/api\/catalogs\/([^/]+)$/, handler: updateCatalog },
  { method: "DELETE", pattern: /^\/api\/catalogs\/([^/]+)$/, handler: deleteCatalog },
  { method: "PUT", pattern: /^\/api\/catalogs\/([^/]+)\/hours$/, handler: setCatalogHours },
  { method: "GET", pattern: /^\/api\/catalogs\/([^/]+)\/categories$/, handler: listCategories },
  { method: "POST", pattern: /^\/api\/catalogs\/([^/]+)\/categories$/, handler: createCategory },
  { method: "PUT", pattern: /^\/api\/categories\/([^/]+)\/order$/, handler: reorderCategories },
  { method: "PUT", pattern: /^\/api\/categories\/([^/]+)\/hours$/, handler: setCategoryHours },
  { method: "PUT", pattern: /^\/api\/categories\/([^/]+)$/, handler: updateCategory },
  { method: "DELETE", pattern: /^\/api\/categories\/([^/]+)$/, handler: deleteCategory },
  { method: "GET", pattern: /^\/api\/categories\/([^/]+)\/items$/, handler: listItems },
  { method: "POST", pattern: /^\/api\/categories\/([^/]+)\/items$/, handler: createItem },
  { method: "GET", pattern: /^\/api\/products$/, handler: listProducts },
  { method: "POST", pattern: /^\/api\/products$/, handler: createProduct },
  { method: "GET", pattern: /^\/api\/products\/([^/]+)$/, handler: getProduct },
  { method: "PUT", pattern: /^\/api\/products\/([^/]+)$/, handler: updateProduct },
  { method: "DELETE", pattern: /^\/api\/products\/([^/]+)$/, handler: deleteProduct },
  { method: "PATCH", pattern: /^\/api\/products\/([^/]+)\/status$/, handler: setProductStatus },
  { method: "PUT", pattern: /^\/api\/items\/([^/]+)\/hours$/, handler: setItemHours },
  { method: "PUT", pattern: /^\/api\/items\/([^/]+)$/, handler: updateItem },
  { method: "DELETE", pattern: /^\/api\/items\/([^/]+)$/, handler: deleteItem },
  { method: "GET", pattern: /^\/api\/products\/([^/]+)\/option-groups$/, handler: listOptionGroups },
  { method: "POST", pattern: /^\/api\/products\/([^/]+)\/option-groups$/, handler: createOptionGroup },
  { method: "PUT", pattern: /^\/api\/option-groups\/([^/]+)$/, handler: updateOptionGroup },
  { method: "DELETE", pattern: /^\/api\/option-groups\/([^/]+)$/, handler: deleteOptionGroup },
  { method: "GET", pattern: /^\/api\/option-groups\/([^/]+)\/options$/, handler: listOptions },
  { method: "POST", pattern: /^\/api\/option-groups\/([^/]+)\/options$/, handler: createOption },
  { method: "PUT", pattern: /^\/api\/options\/([^/]+)$/, handler: updateOption },
  { method: "DELETE", pattern: /^\/api\/options\/([^/]+)$/, handler: deleteOption },
  { method: "GET", pattern: /^\/api\/categories\/([^/]+)\/pizza-config$/, handler: getPizzaConfig },
  { method: "PUT", pattern: /^\/api\/categories\/([^/]+)\/pizza-config$/, handler: putPizzaConfig },
  { method: "PUT", pattern: /^\/api\/pizza-config\/([^/]+)\/sizes$/, handler: setSizes },
  { method: "PUT", pattern: /^\/api\/pizza-config\/([^/]+)\/crusts$/, handler: setCrusts },
  { method: "PUT", pattern: /^\/api\/pizza-config\/([^/]+)\/edges$/, handler: setEdges },
  { method: "PUT", pattern: /^\/api\/pizza-config\/([^/]+)\/flavors$/, handler: setFlavors },
  { method: "PUT", pattern: /^\/api\/pizza-config\/([^/]+)\/flavor-prices$/, handler: setFlavorPrices },
  { method: "GET", pattern: /^\/api\/items\/([^/]+)\/combo-components$/, handler: listComboComponents },
  { method: "PUT", pattern: /^\/api\/items\/([^/]+)\/combo-components$/, handler: setComboComponents },
  { method: "GET", pattern: /^\/api\/catalogs\/([^/]+)\/mapping-readiness$/, handler: getMappingReadiness },
  // Merchant registry (feature 006). Specific patterns ($-anchored) are mutually exclusive.
  { method: "GET", pattern: /^\/api\/merchants$/, handler: listMerchants },
  { method: "GET", pattern: /^\/api\/merchants\/([^/]+)$/, handler: getMerchant },
  { method: "PUT", pattern: /^\/api\/merchants\/([^/]+)$/, handler: putMerchant },
  { method: "GET", pattern: /^\/api\/merchants\/([^/]+)\/status$/, handler: getMerchantStatus },
  { method: "GET", pattern: /^\/api\/merchants\/([^/]+)\/status\/([^/]+)$/, handler: getMerchantOperationStatus },
  { method: "GET", pattern: /^\/api\/merchants\/([^/]+)\/opening-hours$/, handler: getOpeningHours },
  { method: "PUT", pattern: /^\/api\/merchants\/([^/]+)\/opening-hours$/, handler: putOpeningHours },
  { method: "GET", pattern: /^\/api\/merchants\/([^/]+)\/interruptions$/, handler: listInterruptions },
  { method: "POST", pattern: /^\/api\/merchants\/([^/]+)\/interruptions$/, handler: createInterruption },
  { method: "DELETE", pattern: /^\/api\/merchants\/([^/]+)\/interruptions\/([^/]+)$/, handler: deleteInterruption },
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
