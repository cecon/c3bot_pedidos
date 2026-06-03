import { sql } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { products } from "./schema";

// Catalog hierarchy modeled on the iFood Food catalog (see specs/005-product-catalog).
// `external_code` is the destination reference, unique per table (FR-026); a partial unique
// index ignores null/blank so unmapped rows are still allowed.
const availability = { enum: ["available", "unavailable", "paused"] } as const;
const externalCodeUnique = (name: string, column: AnySQLiteColumn) =>
  uniqueIndex(name)
    .on(column)
    .where(sql`${column} IS NOT NULL AND trim(${column}) <> ''`);

export const stores = sqliteTable("stores", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj"),
  street: text("street"),
  number: text("number"),
  neighborhood: text("neighborhood"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  complement: text("complement"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  externalCode: text("external_code"),
  status: text("status", availability).notNull().default("available"),
  // Merchant profile fields (feature 006) — the store row IS the merchant.
  corporateName: text("corporate_name"),
  description: text("description"),
  averageTicketCents: integer("average_ticket_cents"),
  exclusive: integer("exclusive", { mode: "boolean" }).notNull().default(false),
  merchantType: text("merchant_type").notNull().default("RESTAURANT"),
  country: text("country").notNull().default("BR"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const catalogs = sqliteTable(
  "catalogs",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    context: text("context", { enum: ["delivery", "indoor", "takeout"] }).notNull().default("delivery"),
    externalCode: text("external_code"),
    status: text("status", availability).notNull().default("available"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [externalCodeUnique("idx_catalogs_external_code", table.externalCode)],
);

export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    catalogId: text("catalog_id").notNull().references(() => catalogs.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    displayOrder: integer("display_order").notNull().default(0),
    status: text("status", availability).notNull().default("available"),
    template: text("template", { enum: ["default", "pizza", "combo"] }).notNull().default("default"),
    externalCode: text("external_code"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_categories_catalog").on(table.catalogId),
    externalCodeUnique("idx_categories_external_code", table.externalCode),
  ],
);

export const catalogItems = sqliteTable(
  "catalog_items",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull().references(() => products.id),
    priceCents: integer("price_cents").notNull(),
    originalPriceCents: integer("original_price_cents"),
    displayOrder: integer("display_order").notNull().default(0),
    status: text("status", availability).notNull().default("available"),
    externalCode: text("external_code"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_catalog_items_category_product").on(table.categoryId, table.productId),
    externalCodeUnique("idx_catalog_items_external_code", table.externalCode),
  ],
);

export const optionGroups = sqliteTable(
  "option_groups",
  {
    id: text("id").primaryKey(),
    productId: text("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    minQuantity: integer("min_quantity").notNull().default(0),
    maxQuantity: integer("max_quantity").notNull().default(1),
    required: integer("required", { mode: "boolean" }).notNull().default(false),
    displayOrder: integer("display_order").notNull().default(0),
    status: text("status", availability).notNull().default("available"),
    externalCode: text("external_code"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_option_groups_product").on(table.productId)],
);

export const options = sqliteTable(
  "options",
  {
    id: text("id").primaryKey(),
    optionGroupId: text("option_group_id").notNull().references(() => optionGroups.id, { onDelete: "cascade" }),
    productId: text("product_id").references(() => products.id),
    name: text("name").notNull(),
    priceCents: integer("price_cents").notNull().default(0),
    displayOrder: integer("display_order").notNull().default(0),
    status: text("status", availability).notNull().default("available"),
    externalCode: text("external_code"),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_options_group").on(table.optionGroupId),
    externalCodeUnique("idx_options_external_code", table.externalCode),
  ],
);

export const comboComponents = sqliteTable(
  "combo_components",
  {
    id: text("id").primaryKey(),
    catalogItemId: text("catalog_item_id").notNull().references(() => catalogItems.id, { onDelete: "cascade" }),
    componentProductId: text("component_product_id").notNull().references(() => products.id),
    quantity: integer("quantity").notNull().default(1),
    displayOrder: integer("display_order").notNull().default(0),
  },
  (table) => [index("idx_combo_components_item").on(table.catalogItemId)],
);

export const availabilitySchedules = sqliteTable(
  "availability_schedules",
  {
    id: text("id").primaryKey(),
    scopeType: text("scope_type", { enum: ["store", "catalog", "category", "item"] }).notNull(),
    scopeId: text("scope_id").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
  },
  (table) => [index("idx_availability_scope").on(table.scopeType, table.scopeId)],
);
