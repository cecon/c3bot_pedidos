// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { applyMigrations } from "./migrations";

// SC-002: browsing a catalog of >=200 products must stay snappy. Smoke check that listing and
// substring-filtering 200 items over the local DB completes well under a generous threshold.
describe("large-catalog performance", () => {
  it("lists and filters 200 products quickly", () => {
    const db = new DatabaseSync(":memory:");
    applyMigrations(db, "test");
    const catalogId = (db.prepare("SELECT id FROM catalogs LIMIT 1").get() as { id: string }).id;
    db.exec(
      "INSERT INTO categories (id, catalog_id, name, display_order, status, template) VALUES ('cat', '" +
        catalogId +
        "', 'Todos', 0, 'available', 'default')",
    );
    const insertProduct = db.prepare("INSERT INTO products (id, name, price_cents, category, active) VALUES (?, ?, ?, '', 1)");
    const insertItem = db.prepare(
      "INSERT INTO catalog_items (id, category_id, product_id, price_cents, display_order, status) VALUES (?, 'cat', ?, ?, ?, 'available')",
    );
    for (let i = 0; i < 200; i += 1) {
      insertProduct.run(`p${i}`, `Produto ${i}`, i * 10);
      insertItem.run(`i${i}`, `p${i}`, i * 10, i);
    }

    const start = performance.now();
    const all = db
      .prepare(
        "SELECT ci.id, p.name, ci.price_cents FROM catalog_items ci JOIN products p ON p.id = ci.product_id WHERE ci.category_id = 'cat' ORDER BY ci.display_order",
      )
      .all();
    const filtered = db
      .prepare("SELECT p.name FROM catalog_items ci JOIN products p ON p.id = ci.product_id WHERE p.name LIKE '%Produto 1%'")
      .all();
    const elapsed = performance.now() - start;

    expect(all).toHaveLength(200);
    expect(filtered.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(1000);
  });
});
