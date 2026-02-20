ALTER TABLE series ADD COLUMN IF NOT EXISTS read_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS series_read_count_idx ON series (read_count);
