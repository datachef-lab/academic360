-- drizzle-kit emitted `ADD COLUMN "code" varchar(64) NOT NULL` in one shot, which
-- fails on a table that already holds rows. Split into add-nullable → backfill →
-- SET NOT NULL. The backfill matches the eleven seeded types by their current name;
-- any row not in that list (an admin-created type from before this migration) gets a
-- slug of its own name, which is what the create path will assign from now on.
ALTER TABLE "document_types" ADD COLUMN "code" varchar(64);--> statement-breakpoint

UPDATE "document_types" SET "code" = CASE "name"
    WHEN 'Exam Admit Card'     THEN 'EXAM_ADMIT_CARD'
    WHEN 'Fee Receipt'         THEN 'FEE_RECEIPT'
    WHEN 'CU Registration PDF' THEN 'CU_REGISTRATION_PDF'
    WHEN 'ID Card'             THEN 'ID_CARD'
    WHEN 'CU Exam Form'        THEN 'CU_EXAM_FORM'
    WHEN 'Class XII Marksheet' THEN 'CLASS_XII_MARKSHEET'
    WHEN 'Aadhaar Card'        THEN 'AADHAAR_CARD'
    WHEN 'APAAR ID Card'       THEN 'APAAR_ID_CARD'
    WHEN 'Father Photo ID'     THEN 'FATHER_PHOTO_ID'
    WHEN 'Mother Photo ID'     THEN 'MOTHER_PHOTO_ID'
    WHEN 'EWS Certificate'     THEN 'EWS_CERTIFICATE'
    ELSE left(regexp_replace(upper(trim("name")), '[^A-Z0-9]+', '_', 'g'), 64)
END WHERE "code" IS NULL;--> statement-breakpoint

-- Guard against the ELSE branch colliding (two names slugging to the same code):
-- suffix the later rows by id so the UNIQUE below cannot fail.
UPDATE "document_types" d SET "code" = left(d."code", 60) || '_' || d."id"
FROM (
    SELECT "id", row_number() OVER (PARTITION BY "code" ORDER BY "id") AS rn
    FROM "document_types"
) dup
WHERE dup."id" = d."id" AND dup.rn > 1;--> statement-breakpoint

ALTER TABLE "document_types" ALTER COLUMN "code" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "id_card_issues" ADD COLUMN "document_ledger_id_fk" integer;--> statement-breakpoint
ALTER TABLE "id_card_issues" ADD CONSTRAINT "id_card_issues_document_ledger_id_fk_document_ledger_id_fk" FOREIGN KEY ("document_ledger_id_fk") REFERENCES "public"."document_ledger"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_types" ADD CONSTRAINT "document_types_code_unique" UNIQUE("code");--> statement-breakpoint
ALTER TABLE "id_card_issues" ADD CONSTRAINT "id_card_issues_document_ledger_id_fk_unique" UNIQUE("document_ledger_id_fk");
