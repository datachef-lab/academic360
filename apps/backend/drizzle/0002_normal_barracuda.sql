ALTER TABLE "institutions" RENAME COLUMN "degree_id" TO "degree_id_fk";--> statement-breakpoint
ALTER TABLE "institutions" RENAME COLUMN "address_id" TO "address_id_fk";--> statement-breakpoint
ALTER TABLE "institutions" DROP CONSTRAINT "institutions_degree_id_degree_id_fk";
--> statement-breakpoint
ALTER TABLE "institutions" DROP CONSTRAINT "institutions_address_id_address_id_fk";
--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_degree_id_fk_degree_id_fk" FOREIGN KEY ("degree_id_fk") REFERENCES "public"."degree"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_address_id_fk_address_id_fk" FOREIGN KEY ("address_id_fk") REFERENCES "public"."address"("id") ON DELETE no action ON UPDATE no action;