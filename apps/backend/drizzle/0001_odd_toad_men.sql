CREATE TABLE "instalments" (
	"id" serial PRIMARY KEY NOT NULL,
	"fees_structure_id_fk" integer NOT NULL,
	"instalment_number" integer NOT NULL,
	"base_amount" double precision DEFAULT 0 NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"online_start_date" date NOT NULL,
	"online_end_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fees_components" RENAME COLUMN "amount" TO "base_amount";--> statement-breakpoint
ALTER TABLE "student_fees_mappings" ALTER COLUMN "base_amount" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "student_fees_mappings" ADD COLUMN "instalment_id_fk" integer;--> statement-breakpoint
ALTER TABLE "instalments" ADD CONSTRAINT "instalments_fees_structure_id_fk_fees_structures_id_fk" FOREIGN KEY ("fees_structure_id_fk") REFERENCES "public"."fees_structures"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_fees_mappings" ADD CONSTRAINT "student_fees_mappings_instalment_id_fk_instalments_id_fk" FOREIGN KEY ("instalment_id_fk") REFERENCES "public"."instalments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fees_structures" DROP COLUMN "instalment_start_date";--> statement-breakpoint
ALTER TABLE "fees_structures" DROP COLUMN "instalment_end_date";--> statement-breakpoint
ALTER TABLE "student_fees_mappings" DROP COLUMN "instalment_number";