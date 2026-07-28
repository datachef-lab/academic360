ALTER TABLE "declaration_fields" DROP CONSTRAINT "declaration_fields_declaration_master_field_id_fk_declaration_masters_id_fk";
--> statement-breakpoint
ALTER TABLE "declaration_fields" DROP CONSTRAINT "declaration_fields_declaration_master_field_option_id_fk_declaration_masters_id_fk";
--> statement-breakpoint
ALTER TABLE "declaration_fields" ADD CONSTRAINT "declaration_fields_declaration_master_field_id_fk_declaration_master_fields_id_fk" FOREIGN KEY ("declaration_master_field_id_fk") REFERENCES "public"."declaration_master_fields"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "declaration_fields" ADD CONSTRAINT "declaration_fields_declaration_master_field_option_id_fk_declartion_master_field_options_id_fk" FOREIGN KEY ("declaration_master_field_option_id_fk") REFERENCES "public"."declartion_master_field_options"("id") ON DELETE cascade ON UPDATE no action;