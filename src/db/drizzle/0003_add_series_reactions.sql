ALTER TABLE comments ADD COLUMN IF NOT EXISTS series_id varchar(36);
ALTER TABLE likes ADD COLUMN IF NOT EXISTS series_id varchar(36);

CREATE INDEX IF NOT EXISTS comments_story_id_idx ON comments (story_id);
CREATE INDEX IF NOT EXISTS comments_series_id_idx ON comments (series_id);
CREATE INDEX IF NOT EXISTS likes_story_id_idx ON likes (story_id);
CREATE INDEX IF NOT EXISTS likes_series_id_idx ON likes (series_id);
CREATE INDEX IF NOT EXISTS likes_story_user_idx ON likes (story_id, user_id);
CREATE INDEX IF NOT EXISTS likes_series_user_idx ON likes (series_id, user_id);
