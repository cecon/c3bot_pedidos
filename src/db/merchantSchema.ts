import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { stores } from "./catalogSchema";

// Merchant registry (feature 006), modeled on the iFood Merchant API v1.0. The merchant IS the
// catalog `stores` row (single-store, consolidated); these tables hang off it. See
// specs/006-merchant-registry/data-model.md.

export const merchantOperations = sqliteTable(
  "merchant_operations",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    name: text("name", { enum: ["DELIVERY", "INDOOR"] }).notNull(),
    salesChannel: text("sales_channel").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_merchant_operations_unique").on(table.storeId, table.name, table.salesChannel),
  ],
);

export const merchantShifts = sqliteTable(
  "merchant_shifts",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    dayOfWeek: text("day_of_week", {
      enum: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"],
    }).notNull(),
    start: text("start").notNull(),
    durationMinutes: integer("duration_minutes").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_merchant_shifts_store").on(table.storeId)],
);

export const merchantInterruptions = sqliteTable(
  "merchant_interruptions",
  {
    id: text("id").primaryKey(),
    storeId: text("store_id").notNull().references(() => stores.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    start: text("start").notNull(),
    end: text("end").notNull(),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_merchant_interruptions_store").on(table.storeId)],
);
