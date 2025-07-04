ALTER TABLE "classes" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "courses" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "documents" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "sections" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "shifts" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "subject_types" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "annual_incomes" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "blood_group" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "board_result_status" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "board_universities" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "categories" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "cities" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "countries" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "degree" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "institutions" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "language_medium" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "nationality" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "occupations" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "qualifications" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "religion" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "states" RENAME COLUMN "sequene" TO "sequence";--> statement-breakpoint
ALTER TABLE "classes" DROP CONSTRAINT "classes_sequene_unique";--> statement-breakpoint
ALTER TABLE "courses" DROP CONSTRAINT "courses_sequene_unique";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT "documents_sequene_unique";--> statement-breakpoint
ALTER TABLE "sections" DROP CONSTRAINT "sections_sequene_unique";--> statement-breakpoint
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_sequene_unique";--> statement-breakpoint
ALTER TABLE "subject_types" DROP CONSTRAINT "subject_types_sequene_unique";--> statement-breakpoint
ALTER TABLE "annual_incomes" DROP CONSTRAINT "annual_incomes_sequene_unique";--> statement-breakpoint
ALTER TABLE "blood_group" DROP CONSTRAINT "blood_group_sequene_unique";--> statement-breakpoint
ALTER TABLE "board_result_status" DROP CONSTRAINT "board_result_status_sequene_unique";--> statement-breakpoint
ALTER TABLE "board_universities" DROP CONSTRAINT "board_universities_sequene_unique";--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_sequene_unique";--> statement-breakpoint
ALTER TABLE "cities" DROP CONSTRAINT "cities_sequene_unique";--> statement-breakpoint
ALTER TABLE "countries" DROP CONSTRAINT "countries_sequene_unique";--> statement-breakpoint
ALTER TABLE "degree" DROP CONSTRAINT "degree_sequene_unique";--> statement-breakpoint
ALTER TABLE "institutions" DROP CONSTRAINT "institutions_sequene_unique";--> statement-breakpoint
ALTER TABLE "language_medium" DROP CONSTRAINT "language_medium_sequene_unique";--> statement-breakpoint
ALTER TABLE "nationality" DROP CONSTRAINT "nationality_sequene_unique";--> statement-breakpoint
ALTER TABLE "occupations" DROP CONSTRAINT "occupations_sequene_unique";--> statement-breakpoint
ALTER TABLE "qualifications" DROP CONSTRAINT "qualifications_sequene_unique";--> statement-breakpoint
ALTER TABLE "religion" DROP CONSTRAINT "religion_sequene_unique";--> statement-breakpoint
ALTER TABLE "states" DROP CONSTRAINT "states_sequene_unique";--> statement-breakpoint
ALTER TABLE "classes" ADD CONSTRAINT "classes_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "subject_types" ADD CONSTRAINT "subject_types_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "annual_incomes" ADD CONSTRAINT "annual_incomes_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "blood_group" ADD CONSTRAINT "blood_group_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "board_result_status" ADD CONSTRAINT "board_result_status_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "board_universities" ADD CONSTRAINT "board_universities_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "countries" ADD CONSTRAINT "countries_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "degree" ADD CONSTRAINT "degree_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "institutions" ADD CONSTRAINT "institutions_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "language_medium" ADD CONSTRAINT "language_medium_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "nationality" ADD CONSTRAINT "nationality_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "occupations" ADD CONSTRAINT "occupations_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "qualifications" ADD CONSTRAINT "qualifications_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "religion" ADD CONSTRAINT "religion_sequence_unique" UNIQUE("sequence");--> statement-breakpoint
ALTER TABLE "states" ADD CONSTRAINT "states_sequence_unique" UNIQUE("sequence");