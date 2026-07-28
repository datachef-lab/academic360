CREATE TYPE "public"."declaration_master_context" AS ENUM('ADMISSION', 'EXAM', 'FEES', 'LIBRARY', 'OTHER');--> statement-breakpoint
CREATE TABLE "declaration_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"declaration_id_fk" integer NOT NULL,
	"declaration_master_field_id_fk" integer NOT NULL,
	"declaration_master_field_option_id_fk" integer,
	"value" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "declartion_master_field_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"declaration_master_field_id_fk" integer NOT NULL,
	"name" varchar(500) NOT NULL,
	"sequence" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "declaration_master_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"declaration_master_id_fk" integer NOT NULL,
	"label" varchar(500) NOT NULL,
	"type" "certificate_field_master_type" DEFAULT 'TEXT' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "declaration_masters" (
	"id" serial PRIMARY KEY NOT NULL,
	"context" "declaration_master_context" NOT NULL,
	"statement" text NOT NULL,
	"template" varchar(255) NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "declaration_masters_template_unique" UNIQUE("template")
);
--> statement-breakpoint
CREATE TABLE "declarations" (
	"id" serial PRIMARY KEY NOT NULL,
	"declaration_master_id_fk" integer NOT NULL,
	"is_agreed" boolean NOT NULL,
	"promotion_id_fk" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "declaration_fields" ADD CONSTRAINT "declaration_fields_declaration_id_fk_declarations_id_fk" FOREIGN KEY ("declaration_id_fk") REFERENCES "public"."declarations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_fields" ADD CONSTRAINT "declaration_fields_declaration_master_field_id_fk_declaration_masters_id_fk" FOREIGN KEY ("declaration_master_field_id_fk") REFERENCES "public"."declaration_masters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_fields" ADD CONSTRAINT "declaration_fields_declaration_master_field_option_id_fk_declaration_masters_id_fk" FOREIGN KEY ("declaration_master_field_option_id_fk") REFERENCES "public"."declaration_masters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declartion_master_field_options" ADD CONSTRAINT "declartion_master_field_options_declaration_master_field_id_fk_declaration_master_fields_id_fk" FOREIGN KEY ("declaration_master_field_id_fk") REFERENCES "public"."declaration_master_fields"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_master_fields" ADD CONSTRAINT "declaration_master_fields_declaration_master_id_fk_declaration_masters_id_fk" FOREIGN KEY ("declaration_master_id_fk") REFERENCES "public"."declaration_masters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declarations" ADD CONSTRAINT "declarations_declaration_master_id_fk_declaration_masters_id_fk" FOREIGN KEY ("declaration_master_id_fk") REFERENCES "public"."declaration_masters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declarations" ADD CONSTRAINT "declarations_promotion_id_fk_promotions_id_fk" FOREIGN KEY ("promotion_id_fk") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;