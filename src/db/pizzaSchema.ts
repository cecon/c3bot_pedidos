import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { categories } from "./catalogSchema";
import { products } from "./schema";

// Pizza template tables (see specs/005-product-catalog/data-model.md). Flavor prices are
// stored per size, matching iFood. Pricing strategy is a per-category configuration setting.
const availability = { enum: ["available", "unavailable", "paused"] } as const;

export const pizzaConfigs = sqliteTable(
  "pizza_configs",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
    pricingStrategy: text("pricing_strategy", { enum: ["highest", "average"] }).notNull().default("highest"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [uniqueIndex("idx_pizza_configs_category").on(table.categoryId)],
);

export const pizzaSizes = sqliteTable(
  "pizza_sizes",
  {
    id: text("id").primaryKey(),
    pizzaConfigId: text("pizza_config_id").notNull().references(() => pizzaConfigs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slices: integer("slices").notNull().default(0),
    maxFlavors: integer("max_flavors").notNull().default(1),
    displayOrder: integer("display_order").notNull().default(0),
    externalCode: text("external_code"),
  },
  (table) => [index("idx_pizza_sizes_config").on(table.pizzaConfigId)],
);

export const pizzaCrusts = sqliteTable(
  "pizza_crusts",
  {
    id: text("id").primaryKey(),
    pizzaConfigId: text("pizza_config_id").notNull().references(() => pizzaConfigs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull().default(0),
    status: text("status", availability).notNull().default("available"),
    displayOrder: integer("display_order").notNull().default(0),
    externalCode: text("external_code"),
  },
  (table) => [index("idx_pizza_crusts_config").on(table.pizzaConfigId)],
);

export const pizzaEdges = sqliteTable(
  "pizza_edges",
  {
    id: text("id").primaryKey(),
    pizzaConfigId: text("pizza_config_id").notNull().references(() => pizzaConfigs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull().default(0),
    status: text("status", availability).notNull().default("available"),
    displayOrder: integer("display_order").notNull().default(0),
    externalCode: text("external_code"),
  },
  (table) => [index("idx_pizza_edges_config").on(table.pizzaConfigId)],
);

export const pizzaFlavors = sqliteTable(
  "pizza_flavors",
  {
    id: text("id").primaryKey(),
    pizzaConfigId: text("pizza_config_id").notNull().references(() => pizzaConfigs.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id),
    name: text("name").notNull(),
    status: text("status", availability).notNull().default("available"),
    displayOrder: integer("display_order").notNull().default(0),
    externalCode: text("external_code"),
  },
  (table) => [index("idx_pizza_flavors_config").on(table.pizzaConfigId)],
);

export const pizzaFlavorPrices = sqliteTable(
  "pizza_flavor_prices",
  {
    id: text("id").primaryKey(),
    pizzaFlavorId: text("pizza_flavor_id").notNull().references(() => pizzaFlavors.id, { onDelete: "cascade" }),
    pizzaSizeId: text("pizza_size_id").notNull().references(() => pizzaSizes.id, { onDelete: "cascade" }),
    priceCents: integer("price_cents").notNull().default(0),
  },
  (table) => [uniqueIndex("idx_pizza_flavor_prices").on(table.pizzaFlavorId, table.pizzaSizeId)],
);
