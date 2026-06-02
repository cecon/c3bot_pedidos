// @vitest-environment node
import { describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { applyMigrations } from "./migrations";

// FR-025: items already captured in an order must survive later catalog changes — the order
// line snapshots unit_price_cents and is not altered when the product/item is changed or removed.
function seed(db: DatabaseSync) {
  applyMigrations(db, "test");
  const catalogId = (db.prepare("SELECT id FROM catalogs LIMIT 1").get() as { id: string }).id;
  db.exec("INSERT INTO products (id, name, price_cents, category, active) VALUES ('p1', 'Coca', 1000, '', 1)");
  db.prepare(
    "INSERT INTO categories (id, catalog_id, name, display_order, status, template) VALUES ('cat', ?, 'Bebidas', 0, 'available', 'default')",
  ).run(catalogId);
  db.exec("INSERT INTO catalog_items (id, category_id, product_id, price_cents, display_order, status) VALUES ('it', 'cat', 'p1', 1000, 0, 'available')");
  db.exec("INSERT INTO customers (id, name, whatsapp_number) VALUES ('cu', 'Cliente', '5511999999999')");
  db.exec("INSERT INTO whatsapp_sessions (id, display_name, phone_number, status) VALUES ('se', 'S', '551130000000', 'connected')");
  db.exec("INSERT INTO orders (id, customer_id, whatsapp_session_id, status, total_cents) VALUES ('o1', 'cu', 'se', 'confirmed', 1000)");
  db.exec("INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents) VALUES ('oi1', 'o1', 'p1', 1, 1000)");
}

describe("order integrity", () => {
  it("keeps a captured order item intact when the catalog item price changes", () => {
    const db = new DatabaseSync(":memory:");
    seed(db);
    db.exec("UPDATE catalog_items SET price_cents = 1500 WHERE id = 'it'"); // promo/price bump later
    const item = db.prepare("SELECT unit_price_cents AS p FROM order_items WHERE id = 'oi1'").get() as { p: number };
    expect(item.p).toBe(1000); // snapshot unchanged
  });

  it("keeps the captured order item when the catalog item is removed", () => {
    const db = new DatabaseSync(":memory:");
    seed(db);
    db.exec("DELETE FROM catalog_items WHERE id = 'it'");
    const count = db.prepare("SELECT count(*) AS c FROM order_items WHERE id = 'oi1'").get() as { c: number };
    const item = db.prepare("SELECT unit_price_cents AS p FROM order_items WHERE id = 'oi1'").get() as { p: number };
    expect(count.c).toBe(1);
    expect(item.p).toBe(1000);
  });
});
