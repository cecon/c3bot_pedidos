-- Merchant registry (feature 006), iFood Merchant API-aligned. Authored idempotent per ADR-0003:
-- guarded ADD COLUMN (via PRAGMA table_info in the runner), CREATE TABLE/INDEX IF NOT EXISTS, and
-- re-runnable seeds/migrations (guarded by WHERE NOT EXISTS). The merchant IS the `stores` row.

-- Merchant profile fields on the existing stores table (guarded ADD COLUMN).
ALTER TABLE stores ADD COLUMN corporate_name TEXT;
ALTER TABLE stores ADD COLUMN description TEXT;
ALTER TABLE stores ADD COLUMN average_ticket_cents INTEGER;
ALTER TABLE stores ADD COLUMN exclusive INTEGER NOT NULL DEFAULT 0;
ALTER TABLE stores ADD COLUMN merchant_type TEXT NOT NULL DEFAULT 'RESTAURANT';
ALTER TABLE stores ADD COLUMN country TEXT NOT NULL DEFAULT 'BR';

CREATE TABLE IF NOT EXISTS merchant_operations (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name IN ('DELIVERY', 'INDOOR')),
  sales_channel TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchant_shifts (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY')),
  start TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS merchant_interruptions (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchant_operations_unique ON merchant_operations(store_id, name, sales_channel);
CREATE INDEX IF NOT EXISTS idx_merchant_shifts_store ON merchant_shifts(store_id);
CREATE INDEX IF NOT EXISTS idx_merchant_interruptions_store ON merchant_interruptions(store_id);

-- Seed a default delivery operation for the existing merchant (re-runnable).
INSERT INTO merchant_operations (id, store_id, name, sales_channel, enabled)
  SELECT lower(hex(randomblob(16))), s.id, 'DELIVERY', 'ifood-app', 1
  FROM stores s
  WHERE NOT EXISTS (SELECT 1 FROM merchant_operations mo WHERE mo.store_id = s.id);

-- Migrate store-scope opening hours (availability_schedules) into merchant shifts. Runs once
-- (guarded: only when there are no shifts yet). day_of_week 0=Sun..6=Sat -> weekday name;
-- duration = end - start in minutes (wraps past midnight if needed).
INSERT INTO merchant_shifts (id, store_id, day_of_week, start, duration_minutes, enabled)
  SELECT lower(hex(randomblob(16))), a.scope_id,
    CASE a.day_of_week
      WHEN 0 THEN 'SUNDAY' WHEN 1 THEN 'MONDAY' WHEN 2 THEN 'TUESDAY' WHEN 3 THEN 'WEDNESDAY'
      WHEN 4 THEN 'THURSDAY' WHEN 5 THEN 'FRIDAY' ELSE 'SATURDAY' END,
    a.start_time,
    ((CAST(substr(a.end_time, 1, 2) AS INTEGER) * 60 + CAST(substr(a.end_time, 4, 2) AS INTEGER))
      - (CAST(substr(a.start_time, 1, 2) AS INTEGER) * 60 + CAST(substr(a.start_time, 4, 2) AS INTEGER))
      + 1440) % 1440,
    1
  FROM availability_schedules a
  WHERE a.scope_type = 'store'
    AND ((CAST(substr(a.end_time, 1, 2) AS INTEGER) * 60 + CAST(substr(a.end_time, 4, 2) AS INTEGER))
      - (CAST(substr(a.start_time, 1, 2) AS INTEGER) * 60 + CAST(substr(a.start_time, 4, 2) AS INTEGER))
      + 1440) % 1440 > 0
    AND NOT EXISTS (SELECT 1 FROM merchant_shifts);
