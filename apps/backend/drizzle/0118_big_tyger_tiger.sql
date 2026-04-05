CREATE TYPE "public"."class_track_type" AS ENUM('ODD', 'EVEN');--> statement-breakpoint
CREATE TYPE "public"."promotion_builder_logic_type" AS ENUM('AUTO_PROMOTE', 'CONDITIONAL');--> statement-breakpoint
CREATE TYPE "public"."promotion_builder_operator" AS ENUM('EQUALS', 'NONE_IN');--> statement-breakpoint
CREATE TABLE "promotion_builder_clause_class_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"promotion_builder_clause_id_fk" integer NOT NULL,
	"promotion_clause_class_id_fk" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "uq_promotion_builder_clause_class" UNIQUE("promotion_builder_clause_id_fk","promotion_clause_class_id_fk")
);
--> statement-breakpoint
CREATE TABLE "promotion_builder_clause_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"promotion_builder_id_fk" integer NOT NULL,
	"promotion_clause_id_fk" integer NOT NULL,
	"operator" "promotion_builder_operator" DEFAULT 'EQUALS' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "uq_promotion_builder_clause" UNIQUE("promotion_builder_id_fk","promotion_clause_id_fk")
);
--> statement-breakpoint
CREATE TABLE "promotion_builder" (
	"id" serial PRIMARY KEY NOT NULL,
	"affiliation_id_fk" integer NOT NULL,
	"logic" "promotion_builder_logic_type" DEFAULT 'AUTO_PROMOTE' NOT NULL,
	"target_class_id_fk" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promotion_clause_class_mapping" (
	"id" serial PRIMARY KEY NOT NULL,
	"promotion_clause_id_fk" integer NOT NULL,
	"class_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "uq_promotion_clause_class" UNIQUE("promotion_clause_id_fk","class_id_fk")
);
--> statement-breakpoint
CREATE TABLE "promotion_clause" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" varchar,
	"color" varchar,
	"bg_color" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "classes" ADD COLUMN "track" "class_track_type";--> statement-breakpoint
ALTER TABLE "promotion_builder_clause_class_mapping" ADD CONSTRAINT "promotion_builder_clause_class_mapping_promotion_builder_clause_id_fk_promotion_builder_clause_mapping_id_fk" FOREIGN KEY ("promotion_builder_clause_id_fk") REFERENCES "public"."promotion_builder_clause_mapping"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_builder_clause_class_mapping" ADD CONSTRAINT "promotion_builder_clause_class_mapping_promotion_clause_class_id_fk_promotion_clause_class_mapping_id_fk" FOREIGN KEY ("promotion_clause_class_id_fk") REFERENCES "public"."promotion_clause_class_mapping"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_builder_clause_mapping" ADD CONSTRAINT "promotion_builder_clause_mapping_promotion_builder_id_fk_promotion_builder_id_fk" FOREIGN KEY ("promotion_builder_id_fk") REFERENCES "public"."promotion_builder"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_builder_clause_mapping" ADD CONSTRAINT "promotion_builder_clause_mapping_promotion_clause_id_fk_promotion_clause_id_fk" FOREIGN KEY ("promotion_clause_id_fk") REFERENCES "public"."promotion_clause"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_builder" ADD CONSTRAINT "promotion_builder_affiliation_id_fk_affiliations_id_fk" FOREIGN KEY ("affiliation_id_fk") REFERENCES "public"."affiliations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_builder" ADD CONSTRAINT "promotion_builder_target_class_id_fk_classes_id_fk" FOREIGN KEY ("target_class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_clause_class_mapping" ADD CONSTRAINT "promotion_clause_class_mapping_promotion_clause_id_fk_promotion_clause_id_fk" FOREIGN KEY ("promotion_clause_id_fk") REFERENCES "public"."promotion_clause"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "promotion_clause_class_mapping" ADD CONSTRAINT "promotion_clause_class_mapping_class_id_fk_classes_id_fk" FOREIGN KEY ("class_id_fk") REFERENCES "public"."classes"("id") ON DELETE no action ON UPDATE no action;