DO $$ BEGIN ALTER TABLE "user_statuses_master" DROP CONSTRAINT "user_statuses_master_user_type_id_fk_user_types_id_fk"; EXCEPTION WHEN undefined_object OR undefined_table THEN null; END $$;
--> statement-breakpoint
DO $$ BEGIN ALTER TABLE "user_statuses_master" DROP COLUMN "user_type_id_fk"; EXCEPTION WHEN undefined_table OR undefined_column THEN null; END $$;