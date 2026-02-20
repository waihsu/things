CREATE TABLE "series_categories" (
	"series_id" varchar(36) NOT NULL,
	"category_id" varchar(36) NOT NULL,
	CONSTRAINT "series_categories_series_id_category_id_pk" PRIMARY KEY("series_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "story_categories" (
	"story_id" varchar(36) NOT NULL,
	"category_id" varchar(36) NOT NULL,
	CONSTRAINT "story_categories_story_id_category_id_pk" PRIMARY KEY("story_id","category_id")
);
--> statement-breakpoint
DROP TABLE "story_tags" CASCADE;--> statement-breakpoint
DROP TABLE "tags" CASCADE;--> statement-breakpoint
ALTER TABLE "series" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "short_stories" DROP COLUMN "category_id";