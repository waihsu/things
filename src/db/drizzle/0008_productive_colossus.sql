CREATE TABLE "chat_messages" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"user_id" varchar(255),
	"user_name" varchar(100) NOT NULL,
	"user_avatar" text,
	"user_username" varchar(200),
	"is_guest" boolean DEFAULT false NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poem_categories" (
	"poem_id" varchar(36) NOT NULL,
	"category_id" varchar(36) NOT NULL,
	CONSTRAINT "poem_categories_poem_id_category_id_pk" PRIMARY KEY("poem_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "poem_tags" (
	"poem_id" varchar(36) NOT NULL,
	"tag" varchar(60) NOT NULL,
	CONSTRAINT "poem_tags_poem_id_tag_pk" PRIMARY KEY("poem_id","tag")
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"bio_snippet" text,
	"email_updates" boolean DEFAULT true NOT NULL,
	"comment_alerts" boolean DEFAULT true NOT NULL,
	"weekly_digest" boolean DEFAULT false NOT NULL,
	"reading_focus" boolean DEFAULT true NOT NULL,
	"auto_save" boolean DEFAULT true NOT NULL,
	"profile_visibility" varchar(20) DEFAULT 'public' NOT NULL,
	"allow_profile_discovery" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poem_categories" ADD CONSTRAINT "poem_categories_poem_id_poems_id_fk" FOREIGN KEY ("poem_id") REFERENCES "public"."poems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poem_categories" ADD CONSTRAINT "poem_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poem_tags" ADD CONSTRAINT "poem_tags_poem_id_poems_id_fk" FOREIGN KEY ("poem_id") REFERENCES "public"."poems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_messages_created_at_idx" ON "chat_messages" USING btree ("created_at","id");