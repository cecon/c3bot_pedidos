CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'attendant')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp_number TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  phone_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('connected', 'connecting', 'paused', 'offline')),
  assigned_attendant_id TEXT,
  last_sync_at TEXT,
  FOREIGN KEY (assigned_attendant_id) REFERENCES attendants(id)
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL UNIQUE,
  document TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  notes TEXT
);

CREATE TABLE IF NOT EXISTS customer_addresses (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  label TEXT NOT NULL,
  street TEXT NOT NULL,
  number TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT,
  complement TEXT,
  latitude REAL,
  longitude REAL,
  enrichment_status TEXT NOT NULL DEFAULT 'pending',
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  category TEXT NOT NULL,
  image_url TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL,
  whatsapp_session_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'confirmed', 'preparing', 'out_for_delivery', 'done', 'canceled')),
  scheduled_for TEXT,
  total_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (whatsapp_session_id) REFERENCES whatsapp_sessions(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
  notes TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS automation_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS automation_bindings (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  binding_type TEXT NOT NULL CHECK (binding_type IN ('mcp', 'skill', 'agent')),
  binding_ref TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (group_id) REFERENCES automation_groups(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  segment TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'finished')),
  scheduled_for TEXT,
  message_template TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_for ON orders(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp_number);
