BEGIN;

CREATE TABLE IF NOT EXISTS "story_categories" (
	"story_id" varchar(36) NOT NULL,
	"category_id" varchar(36) NOT NULL,
	CONSTRAINT "story_categories_pkey" PRIMARY KEY ("story_id","category_id")
);

CREATE TABLE IF NOT EXISTS "series_categories" (
	"series_id" varchar(36) NOT NULL,
	"category_id" varchar(36) NOT NULL,
	CONSTRAINT "series_categories_pkey" PRIMARY KEY ("series_id","category_id")
);

INSERT INTO "story_categories" ("story_id", "category_id")
SELECT "id", "category_id"
FROM "short_stories"
WHERE "category_id" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "series_categories" ("series_id", "category_id")
SELECT "id", "category_id"
FROM "series"
WHERE "category_id" IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE "short_stories" DROP COLUMN IF EXISTS "category_id";
ALTER TABLE "series" DROP COLUMN IF EXISTS "category_id";

DROP TABLE IF EXISTS "story_tags";
DROP TABLE IF EXISTS "tags";

COMMIT;
