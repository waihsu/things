CREATE TABLE "categories" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"story_id" varchar(36),
	"episode_id" varchar(36),
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "episodes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"serie_id" varchar(36) NOT NULL,
	"paragraph" text NOT NULL,
	"order" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"story_id" varchar(36),
	"episode_id" varchar(36),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone_number" varchar(20),
	"street" varchar(255),
	"city" varchar(100),
	"state" varchar(100),
	"zip_code" varchar(20),
	"country" varchar(100),
	"bio" text,
	"avatar_url" varchar(255),
	"urls" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "series" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"summary" text,
	"category_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "short_stories" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text NOT NULL,
	"summary" text,
	"category_id" varchar(36) NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"read_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_tags" (
	"story_id" varchar(36) NOT NULL,
	"tag_id" varchar(36) NOT NULL,
	CONSTRAINT "story_tags_story_id_tag_id_pk" PRIMARY KEY("story_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
DROP TABLE "todo" CASCADE;