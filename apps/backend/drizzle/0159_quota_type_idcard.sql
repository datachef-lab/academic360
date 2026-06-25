ALTER TABLE "admission_quota_types" ADD COLUMN IF NOT EXISTS "short_name" varchar(255);
ALTER TABLE "admission_quota_types" ADD COLUMN IF NOT EXISTS "print_on_id_card" boolean DEFAULT false;
