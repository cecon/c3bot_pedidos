// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { applyMigrations } from "./migrations";

// FR-007: a single product definition can be reused across categories (and as options/pizza
// flavors) without duplicating the product row. Verified at the schema level on a fresh DB.
describe("product reuse", () => {
  it("lets one product back items in two categories without duplication", () => {
    const db = new DatabaseSync(":memory:");
    applyMigrations(db, "test");

    const catalogId = (db.prepare("SELECT id FROM catalogs LIMIT 1").get() as { id: string }).id;
    db.exec("INSERT INTO products (id, name, price_cents, category, active) VALUES ('p1', 'Coca lata', 0, '', 1)");
    for (const [id, name] of [
      ["cat-a", "Bebidas"],
      ["cat-b", "Combos"],
    ]) {
      db.prepare(
        "INSERT INTO categories (id, catalog_id, name, display_order, status, template) VALUES (?, ?, ?, 0, 'available', 'default')",
      ).run(id, catalogId, name);
    }
    db.exec("INSERT INTO catalog_items (id, category_id, product_id, price_cents, display_order, status) VALUES ('i1', 'cat-a', 'p1', 700, 0, 'available')");
    db.exec("INSERT INTO catalog_items (id, category_id, product_id, price_cents, display_order, status) VALUES ('i2', 'cat-b', 'p1', 650, 0, 'available')");

    const products = db.prepare("SELECT count(*) AS c FROM products").get() as { c: number };
    const items = db.prepare("SELECT count(*) AS c FROM catalog_items WHERE product_id = 'p1'").get() as { c: number };
    const distinctProducts = db.prepare("SELECT count(DISTINCT product_id) AS c FROM catalog_items").get() as { c: number };

    expect(products.c).toBe(1); // single product definition
    expect(items.c).toBe(2); // reused in two categories
    expect(distinctProducts.c).toBe(1);
  });
});
