import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "supervisor", "attendant"] }).notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const attendants = sqliteTable(
  "attendants",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    whatsappNumber: text("whatsapp_number").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    displayName: text("display_name").notNull().default(""),
    role: text("role", { enum: ["supervisor", "attendant"] }).notNull().default("attendant"),
    availabilityStatus: text("availability_status", { enum: ["online", "offline"] }).notNull().default("offline"),
    photoBase64: text("photo_base64"),
    createdAt: text("created_at").notNull().default(""),
    updatedAt: text("updated_at").notNull().default(""),
  },
  (table) => [
    uniqueIndex("idx_attendants_active_whatsapp")
      .on(table.whatsappNumber)
      .where(sql`${table.active} = 1 AND ${table.whatsappNumber} IS NOT NULL AND trim(${table.whatsappNumber}) <> ''`),
  ],
);

export const whatsappSessions = sqliteTable("whatsapp_sessions", {
  id: text("id").primaryKey(),
  displayName: text("display_name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  status: text("status", { enum: ["connected", "connecting", "paused", "offline"] }).notNull(),
  assignedAttendantId: text("assigned_attendant_id").references(() => attendants.id),
  lastSyncAt: text("last_sync_at"),
});

export const customers = sqliteTable(
  "customers",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    whatsappNumber: text("whatsapp_number").notNull().unique(),
    document: text("document"),
    tags: text("tags").notNull().default("[]"),
    notes: text("notes"),
  },
  (table) => [index("idx_customers_whatsapp").on(table.whatsappNumber)],
);

export const customerAddresses = sqliteTable("customer_addresses", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  street: text("street").notNull(),
  number: text("number"),
  neighborhood: text("neighborhood"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code"),
  complement: text("complement"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  enrichmentStatus: text("enrichment_status").notNull().default("pending"),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    customerId: text("customer_id").notNull().references(() => customers.id),
    whatsappSessionId: text("whatsapp_session_id").notNull().references(() => whatsappSessions.id),
    status: text("status", {
      enum: ["draft", "scheduled", "confirmed", "preparing", "out_for_delivery", "done", "canceled"],
    }).notNull(),
    scheduledFor: text("scheduled_for"),
    totalCents: integer("total_cents").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_orders_status").on(table.status), index("idx_orders_scheduled_for").on(table.scheduledFor)],
);

export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
  notes: text("notes"),
});

export const automationGroups = sqliteTable("automation_groups", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const automationBindings = sqliteTable("automation_bindings", {
  id: text("id").primaryKey(),
  groupId: text("group_id").notNull().references(() => automationGroups.id, { onDelete: "cascade" }),
  bindingType: text("binding_type", { enum: ["mcp", "skill", "agent"] }).notNull(),
  bindingRef: text("binding_ref").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});

export const campaigns = sqliteTable("campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  channel: text("channel").notNull().default("whatsapp"),
  segment: text("segment").notNull(),
  status: text("status", { enum: ["draft", "scheduled", "running", "paused", "finished"] }).notNull(),
  scheduledFor: text("scheduled_for"),
  messageTemplate: text("message_template").notNull(),
});
