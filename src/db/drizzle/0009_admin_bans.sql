ALTER TABLE short_stories
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at timestamp,
  ADD COLUMN IF NOT EXISTS banned_reason text,
  ADD COLUMN IF NOT EXISTS banned_by varchar(36);

ALTER TABLE poems
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at timestamp,
  ADD COLUMN IF NOT EXISTS banned_reason text,
  ADD COLUMN IF NOT EXISTS banned_by varchar(36);

ALTER TABLE series
  ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_at timestamp,
  ADD COLUMN IF NOT EXISTS banned_reason text,
  ADD COLUMN IF NOT EXISTS banned_by varchar(36);
