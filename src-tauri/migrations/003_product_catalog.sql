-- Product catalog (feature 005), iFood-aligned. Authored idempotent per ADR-0003:
-- CREATE TABLE/INDEX IF NOT EXISTS, products ADD COLUMN guarded by the runner via
-- PRAGMA table_info, and re-runnable data seeds (INSERT ... WHERE NOT EXISTS).

-- Additive columns on the existing products table (guarded ADD COLUMN).
ALTER TABLE products ADD COLUMN image_base64 TEXT;
ALTER TABLE products ADD COLUMN external_code TEXT;
ALTER TABLE products ADD COLUMN status TEXT NOT NULL DEFAULT 'available';
ALTER TABLE products ADD COLUMN pause_until TEXT;
ALTER TABLE products ADD COLUMN unit_of_measure TEXT NOT NULL DEFAULT 'unit';
ALTER TABLE products ADD COLUMN reference_weight_grams INTEGER;

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  street TEXT,
  number TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  complement TEXT,
  latitude REAL,
  longitude REAL,
  external_code TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'paused')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalogs (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT 'delivery' CHECK (context IN ('delivery', 'indoor', 'takeout')),
  external_code TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'paused')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  catalog_id TEXT NOT NULL REFERENCES catalogs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'paused')),
  template TEXT NOT NULL DEFAULT 'default' CHECK (template IN ('default', 'pizza', 'combo')),
  external_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id),
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  original_price_cents INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'paused')),
  external_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS option_groups (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_quantity INTEGER NOT NULL DEFAULT 0,
  max_quantity INTEGER NOT NULL DEFAULT 1,
  required INTEGER NOT NULL DEFAULT 0,
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'paused')),
  external_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS options (
  id TEXT PRIMARY KEY,
  option_group_id TEXT NOT NULL REFERENCES option_groups(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  display_order INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'paused')),
  external_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS combo_components (
  id TEXT PRIMARY KEY,
  catalog_item_id TEXT NOT NULL REFERENCES catalog_items(id) ON DELETE CASCADE,
  component_product_id TEXT NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  display_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS availability_schedules (
  id TEXT PRIMARY KEY,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('store', 'catalog', 'category', 'item')),
  scope_id TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS pizza_configs (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  pricing_strategy TEXT NOT NULL DEFAULT 'highest' CHECK (pricing_strategy IN ('highest', 'average')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pizza_sizes (
  id TEXT PRIMARY KEY,
  pizza_config_id TEXT NOT NULL REFERENCES pizza_configs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slices INTEGER NOT NULL DEFAULT 0,
  max_flavors INTEGER NOT NULL DEFAULT 1 CHECK (max_flavors >= 1),
  display_order INTEGER NOT NULL DEFAULT 0,
  external_code TEXT
);

CREATE TABLE IF NOT EXISTS pizza_crusts (
  id TEXT PRIMARY KEY,
  pizza_config_id TEXT NOT NULL REFERENCES pizza_configs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'paused')),
  display_order INTEGER NOT NULL DEFAULT 0,
  external_code TEXT
);

CREATE TABLE IF NOT EXISTS pizza_edges (
  id TEXT PRIMARY KEY,
  pizza_config_id TEXT NOT NULL REFERENCES pizza_configs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'paused')),
  display_order INTEGER NOT NULL DEFAULT 0,
  external_code TEXT
);

CREATE TABLE IF NOT EXISTS pizza_flavors (
  id TEXT PRIMARY KEY,
  pizza_config_id TEXT NOT NULL REFERENCES pizza_configs(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'unavailable', 'paused')),
  display_order INTEGER NOT NULL DEFAULT 0,
  external_code TEXT
);

CREATE TABLE IF NOT EXISTS pizza_flavor_prices (
  id TEXT PRIMARY KEY,
  pizza_flavor_id TEXT NOT NULL REFERENCES pizza_flavors(id) ON DELETE CASCADE,
  pizza_size_id TEXT NOT NULL REFERENCES pizza_sizes(id) ON DELETE CASCADE,
  price_cents INTEGER NOT NULL DEFAULT 0 CHECK (price_cents >= 0)
);

-- Indexes (names match the Drizzle schema).
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalogs_external_code ON catalogs(external_code) WHERE external_code IS NOT NULL AND trim(external_code) <> '';
CREATE INDEX IF NOT EXISTS idx_categories_catalog ON categories(catalog_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_external_code ON categories(external_code) WHERE external_code IS NOT NULL AND trim(external_code) <> '';
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_items_category_product ON catalog_items(category_id, product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_items_external_code ON catalog_items(external_code) WHERE external_code IS NOT NULL AND trim(external_code) <> '';
CREATE INDEX IF NOT EXISTS idx_option_groups_product ON option_groups(product_id);
CREATE INDEX IF NOT EXISTS idx_options_group ON options(option_group_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_options_external_code ON options(external_code) WHERE external_code IS NOT NULL AND trim(external_code) <> '';
CREATE INDEX IF NOT EXISTS idx_combo_components_item ON combo_components(catalog_item_id);
CREATE INDEX IF NOT EXISTS idx_availability_scope ON availability_schedules(scope_type, scope_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pizza_configs_category ON pizza_configs(category_id);
CREATE INDEX IF NOT EXISTS idx_pizza_sizes_config ON pizza_sizes(pizza_config_id);
CREATE INDEX IF NOT EXISTS idx_pizza_crusts_config ON pizza_crusts(pizza_config_id);
CREATE INDEX IF NOT EXISTS idx_pizza_edges_config ON pizza_edges(pizza_config_id);
CREATE INDEX IF NOT EXISTS idx_pizza_flavors_config ON pizza_flavors(pizza_config_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pizza_flavor_prices ON pizza_flavor_prices(pizza_flavor_id, pizza_size_id);

-- Data migration from the legacy flat products table (re-runnable).
INSERT INTO stores (id, name, status)
  SELECT 'store-default', 'Minha Loja', 'available'
  WHERE NOT EXISTS (SELECT 1 FROM stores);

INSERT INTO catalogs (id, store_id, name, context, status)
  SELECT 'catalog-default', (SELECT id FROM stores LIMIT 1), 'Delivery', 'delivery', 'available'
  WHERE NOT EXISTS (SELECT 1 FROM catalogs);

INSERT INTO categories (id, catalog_id, name, display_order, status, template)
  SELECT lower(hex(randomblob(16))), (SELECT id FROM catalogs LIMIT 1), p.category, 0, 'available', 'default'
  FROM (SELECT DISTINCT category FROM products) p
  WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.name = p.category);

INSERT INTO catalog_items (id, category_id, product_id, price_cents, display_order, status)
  SELECT lower(hex(randomblob(16))),
         (SELECT c.id FROM categories c WHERE c.name = p.category LIMIT 1),
         p.id, p.price_cents, 0,
         CASE WHEN p.active = 1 THEN 'available' ELSE 'unavailable' END
  FROM products p
  WHERE NOT EXISTS (SELECT 1 FROM catalog_items ci WHERE ci.product_id = p.id);
