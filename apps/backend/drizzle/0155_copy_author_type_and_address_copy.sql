CREATE TABLE IF NOT EXISTS "author_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_author_type_id" integer,
	"name" varchar(1000) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "authors" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_author_id" integer,
	"author_type_id_fk" integer,
	"name" varchar(1000) NOT NULL,
	"short_name" varchar(1000),
	"nationality_id_fk" integer,
	"remarks" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "author_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_author_details_id" integer,
	"book_id_fk" integer NOT NULL,
	"author_type_id_fk" integer NOT NULL,
	"author_id_fk" integer NOT NULL,
	"remarks" varchar(1000),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "copy_details" ADD COLUMN IF NOT EXISTS "author_type_id_fk" integer;--> statement-breakpoint
ALTER TABLE "address" ADD COLUMN IF NOT EXISTS "copy_details_id_fk" integer;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "author_details" ADD CONSTRAINT "author_details_book_id_fk_books_id_fk" FOREIGN KEY ("book_id_fk") REFERENCES "public"."books"("id"); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "author_details" ADD CONSTRAINT "author_details_author_type_id_fk_author_types_id_fk" FOREIGN KEY ("author_type_id_fk") REFERENCES "public"."author_types"("id"); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "author_details" ADD CONSTRAINT "author_details_author_id_fk_authors_id_fk" FOREIGN KEY ("author_id_fk") REFERENCES "public"."authors"("id"); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "authors" ADD CONSTRAINT "authors_author_type_id_fk_author_types_id_fk" FOREIGN KEY ("author_type_id_fk") REFERENCES "public"."author_types"("id"); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "authors" ADD CONSTRAINT "authors_nationality_id_fk_nationality_id_fk" FOREIGN KEY ("nationality_id_fk") REFERENCES "public"."nationality"("id"); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "copy_details" ADD CONSTRAINT "copy_details_author_type_id_fk_author_types_id_fk" FOREIGN KEY ("author_type_id_fk") REFERENCES "public"."author_types"("id"); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "address" ADD CONSTRAINT "address_copy_details_id_fk_copy_details_id_fk" FOREIGN KEY ("copy_details_id_fk") REFERENCES "public"."copy_details"("id"); EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL; END $$;