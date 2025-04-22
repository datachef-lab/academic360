ALTER TABLE "subjects" ADD COLUMN "internal_year" integer;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "internal_credit" integer;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "practical_year" integer;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "practical_credit" integer;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "theory_year" integer;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "theory_credit" integer;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "vival_marks" integer;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "vival_year" integer;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "vival_credit" integer;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "project_marks" integer;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "project_year" integer;--> statement-breakpoint
ALTER TABLE "subjects" ADD COLUMN "project_credit" integer;--> statement-breakpoint
ALTER TABLE "subject_metadatas" ADD COLUMN "theory_credit" integer;--> statement-breakpoint
ALTER TABLE "subject_metadatas" ADD COLUMN "practical_credit" integer;--> statement-breakpoint
ALTER TABLE "subject_metadatas" ADD COLUMN "internal_credit" integer;--> statement-breakpoint
ALTER TABLE "subject_metadatas" ADD COLUMN "project_credit" integer;--> statement-breakpoint
ALTER TABLE "subject_metadatas" ADD COLUMN "vival_credit" integer;--> statement-breakpoint
ALTER TABLE "subjects" DROP COLUMN "tutorial_marks";--> statement-breakpoint
ALTER TABLE "subject_metadatas" DROP COLUMN "full_marks_tutorial";