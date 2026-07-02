ALTER TABLE "users" ADD COLUMN "sso_sub" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_sso_sub_unique" UNIQUE("sso_sub");