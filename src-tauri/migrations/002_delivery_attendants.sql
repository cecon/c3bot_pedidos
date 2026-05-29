ALTER TABLE attendants ADD COLUMN display_name TEXT NOT NULL DEFAULT '';
ALTER TABLE attendants ADD COLUMN role TEXT NOT NULL DEFAULT 'attendant' CHECK (role IN ('supervisor', 'attendant'));
ALTER TABLE attendants ADD COLUMN availability_status TEXT NOT NULL DEFAULT 'offline' CHECK (availability_status IN ('online', 'offline'));
ALTER TABLE attendants ADD COLUMN photo_base64 TEXT;
ALTER TABLE attendants ADD COLUMN created_at TEXT NOT NULL DEFAULT '';
ALTER TABLE attendants ADD COLUMN updated_at TEXT NOT NULL DEFAULT '';

UPDATE attendants
   SET display_name = name
 WHERE display_name = '';

UPDATE attendants
   SET whatsapp_number = ''
 WHERE whatsapp_number IS NULL;

UPDATE attendants
   SET created_at = CURRENT_TIMESTAMP
 WHERE created_at = '';

UPDATE attendants
   SET updated_at = CURRENT_TIMESTAMP
 WHERE updated_at = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendants_active_whatsapp
  ON attendants(whatsapp_number)
  WHERE active = 1 AND whatsapp_number IS NOT NULL AND trim(whatsapp_number) <> '';
