ALTER TABLE "exam_types" DROP CONSTRAINT "exam_types_sequence_unique";--> statement-breakpoint
ALTER TABLE "rooms" DROP CONSTRAINT "rooms_sequence_unique";--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "number_of_benches" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "description";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "carry";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "is_board_exam";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "passing_marks";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "full_marks";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "weightage";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "written_passing_marks";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "written_full_marks";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "oral_passing_marks";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "oral_full_marks";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "review";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "is_formatative_test1";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "is_formatative_test2";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "is_formatative_test3";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "is_formatative_test4";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "is_summative_assessment1";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "is_summative_assessment2";--> statement-breakpoint
ALTER TABLE "exam_types" DROP COLUMN "sequence";--> statement-breakpoint
ALTER TABLE "rooms" DROP COLUMN "strength";--> statement-breakpoint
ALTER TABLE "rooms" DROP COLUMN "exam_capacity";--> statement-breakpoint
ALTER TABLE "rooms" DROP COLUMN "benches";--> statement-breakpoint
ALTER TABLE "rooms" DROP COLUMN "sequence";