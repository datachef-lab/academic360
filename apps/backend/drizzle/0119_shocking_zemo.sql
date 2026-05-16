CREATE TYPE "public"."fee_group_promotion_mapping_approval_type" AS ENUM('SYSTEM', 'MANUAL');--> statement-breakpoint
ALTER TABLE "fee_group_promotion_mappings" DROP CONSTRAINT "fee_group_promotion_mappings_created_by_user_id_fk_users_id_fk";
--> statement-breakpoint
ALTER TABLE "fee_group_promotion_mappings" DROP CONSTRAINT "fee_group_promotion_mappings_updated_by_user_id_fk_users_id_fk";
--> statement-breakpoint
ALTER TABLE "fee_categories" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_group_promotion_mappings" ADD COLUMN "approval_type" "fee_group_promotion_mapping_approval_type" DEFAULT 'SYSTEM' NOT NULL;--> statement-breakpoint
ALTER TABLE "fee_group_promotion_mappings" ADD COLUMN "approval_user_id_fk" integer;--> statement-breakpoint
ALTER TABLE "fee_group_promotion_mappings" ADD CONSTRAINT "fee_group_promotion_mappings_approval_user_id_fk_users_id_fk" FOREIGN KEY ("approval_user_id_fk") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_group_promotion_mappings" DROP COLUMN "created_by_user_id_fk";--> statement-breakpoint
ALTER TABLE "fee_group_promotion_mappings" DROP COLUMN "updated_by_user_id_fk";