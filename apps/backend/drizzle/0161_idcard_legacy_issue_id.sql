ALTER TABLE "id_card_issues" ADD COLUMN IF NOT EXISTS "legacy_issue_id" bigint;
DO $$ BEGIN
  ALTER TABLE "id_card_issues" ADD CONSTRAINT "id_card_issues_legacy_issue_id_unique" UNIQUE ("legacy_issue_id");
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL;
END $$;
