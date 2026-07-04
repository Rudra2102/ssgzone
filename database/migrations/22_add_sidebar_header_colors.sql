ALTER TABLE platform_branding
  ADD COLUMN IF NOT EXISTS sidebar_color VARCHAR(20),
  ADD COLUMN IF NOT EXISTS header_color VARCHAR(20);
