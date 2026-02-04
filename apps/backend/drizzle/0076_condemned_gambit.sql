ALTER TABLE "addons" ADD COLUMN "created_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "addons" ADD COLUMN "updated_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_category_promotion_mappings" ADD COLUMN "created_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_category_promotion_mappings" ADD COLUMN "updated_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_categories" ADD COLUMN "created_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_categories" ADD COLUMN "updated_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_heads" ADD COLUMN "created_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_heads" ADD COLUMN "updated_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_concession_slabs" ADD COLUMN "created_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_concession_slabs" ADD COLUMN "updated_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD COLUMN "created_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD COLUMN "updated_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "receipt_types" ADD COLUMN "created_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "receipt_types" ADD COLUMN "updated_by_user_id_fk" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "addons" ADD CONSTRAINT "addons_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "addons" ADD CONSTRAINT "addons_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_category_promotion_mappings" ADD CONSTRAINT "fee_category_promotion_mappings_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_category_promotion_mappings" ADD CONSTRAINT "fee_category_promotion_mappings_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_categories" ADD CONSTRAINT "fee_categories_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_categories" ADD CONSTRAINT "fee_categories_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_heads" ADD CONSTRAINT "fee_heads_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_heads" ADD CONSTRAINT "fee_heads_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_concession_slabs" ADD CONSTRAINT "fee_concession_slabs_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_concession_slabs" ADD CONSTRAINT "fee_concession_slabs_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_types" ADD CONSTRAINT "receipt_types_created_by_user_id_fk_users_id_fk" FOREIGN KEY ("created_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_types" ADD CONSTRAINT "receipt_types_updated_by_user_id_fk_users_id_fk" FOREIGN KEY ("updated_by_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;