CREATE TABLE "poems" (
	"id" varchar(36) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"summary" text,
	"content" text NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"read_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "poems" ADD CONSTRAINT "poems_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "poems_user_id_idx" ON "poems" USING btree ("user_id");
