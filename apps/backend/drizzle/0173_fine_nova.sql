CREATE TABLE "declaration_master_statements" (
	"id" serial PRIMARY KEY NOT NULL,
	"declaration_master_id_fk" integer NOT NULL,
	"statement" text NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"sequence" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "declaration_master_statement_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"declaration_master_statement_id_fk" integer NOT NULL,
	"label" varchar(500) NOT NULL,
	"type" "certificate_field_master_type" DEFAULT 'TEXT' NOT NULL,
	"sequence" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "declaration_master_statement_field_options" (
	"id" serial PRIMARY KEY NOT NULL,
	"declaration_master_statement_field_id_fk" integer NOT NULL,
	"name" varchar(500) NOT NULL,
	"sequence" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "declaration_statements" (
	"id" serial PRIMARY KEY NOT NULL,
	"declaration_master_statement_id_fk" integer NOT NULL,
	"declaration_id_fk" integer NOT NULL,
	"is_agreed" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_declaration_statement" UNIQUE("declaration_id_fk","declaration_master_statement_id_fk")
);
--> statement-breakpoint
CREATE TABLE "declaration_statement_fields" (
	"id" serial PRIMARY KEY NOT NULL,
	"declaration_master_statement_field_id_fk" integer NOT NULL,
	"declaration_statement_id_fk" integer NOT NULL,
	"declaration_master_statement_field_option_id_fk" integer,
	"value" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "declaration_fields" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "declartion_master_field_options" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "declaration_master_fields" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "declaration_fields" CASCADE;--> statement-breakpoint
DROP TABLE "declartion_master_field_options" CASCADE;--> statement-breakpoint
DROP TABLE "declaration_master_fields" CASCADE;--> statement-breakpoint
ALTER TABLE "declaration_master_statements" ADD CONSTRAINT "declaration_master_statements_declaration_master_id_fk_declaration_masters_id_fk" FOREIGN KEY ("declaration_master_id_fk") REFERENCES "public"."declaration_masters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_master_statement_fields" ADD CONSTRAINT "declaration_master_statement_fields_declaration_master_statement_id_fk_declaration_master_statements_id_fk" FOREIGN KEY ("declaration_master_statement_id_fk") REFERENCES "public"."declaration_master_statements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_master_statement_field_options" ADD CONSTRAINT "declaration_master_statement_field_options_declaration_master_statement_field_id_fk_declaration_master_statement_fields_id_fk" FOREIGN KEY ("declaration_master_statement_field_id_fk") REFERENCES "public"."declaration_master_statement_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_statements" ADD CONSTRAINT "declaration_statements_declaration_master_statement_id_fk_declaration_master_statements_id_fk" FOREIGN KEY ("declaration_master_statement_id_fk") REFERENCES "public"."declaration_master_statements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_statements" ADD CONSTRAINT "declaration_statements_declaration_id_fk_declarations_id_fk" FOREIGN KEY ("declaration_id_fk") REFERENCES "public"."declarations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_statement_fields" ADD CONSTRAINT "decl_stmt_field_master_field_fk" FOREIGN KEY ("declaration_master_statement_field_id_fk") REFERENCES "public"."declaration_master_statement_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_statement_fields" ADD CONSTRAINT "decl_stmt_field_statement_fk" FOREIGN KEY ("declaration_statement_id_fk") REFERENCES "public"."declaration_statements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_statement_fields" ADD CONSTRAINT "decl_stmt_field_option_fk" FOREIGN KEY ("declaration_master_statement_field_option_id_fk") REFERENCES "public"."declaration_master_statement_field_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "declaration_master_statements_master_id_idx" ON "declaration_master_statements" USING btree ("declaration_master_id_fk");--> statement-breakpoint
CREATE INDEX "declaration_master_statement_fields_statement_id_idx" ON "declaration_master_statement_fields" USING btree ("declaration_master_statement_id_fk");--> statement-breakpoint
CREATE INDEX "declaration_statements_declaration_id_idx" ON "declaration_statements" USING btree ("declaration_id_fk");--> statement-breakpoint
CREATE INDEX "declaration_statement_fields_statement_id_idx" ON "declaration_statement_fields" USING btree ("declaration_statement_id_fk");--> statement-breakpoint
CREATE INDEX "declarations_promotion_id_idx" ON "declarations" USING btree ("promotion_id_fk");--> statement-breakpoint
ALTER TABLE "declaration_masters" DROP COLUMN "statement";--> statement-breakpoint
ALTER TABLE "declaration_masters" DROP COLUMN "is_required";--> statement-breakpoint
ALTER TABLE "declarations" DROP COLUMN "is_agreed";--> statement-breakpoint
ALTER TABLE "declarations" ADD CONSTRAINT "uq_declaration_master_promotion" UNIQUE("declaration_master_id_fk","promotion_id_fk");