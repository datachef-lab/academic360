import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { examModel } from "./exam.model";
import { programCourseModel } from "../course-design";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";

export const examProgramCourseModel = pgTable("exam_program_courses", {
    id: serial().primaryKey(),
    examId: integer("exam_id_fk")
        .references(() => examModel.id)
        .notNull(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createExamProgramCourseSchema = createInsertSchema(examProgramCourseModel);

export type ExamProgramCourse = z.infer<typeof createExamProgramCourseSchema>;

export type ExamProgramCourseT = typeof examProgramCourseModel.$inferSelect;