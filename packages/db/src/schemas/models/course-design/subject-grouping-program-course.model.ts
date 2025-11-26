import { programCourseModel } from "./program-course.model";
import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { subjectGroupingMainModel } from "./subject-grouping-main.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const subjectGroupingProgramCourseModel = pgTable("subject_grouping_program_courses", {
    id: serial().primaryKey(),
    subjectGroupingMainId: integer("subject_grouping_main_id_fk")
        .references(() => subjectGroupingMainModel.id)
        .notNull(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createSubjectGroupingProgramCourse = createInsertSchema(subjectGroupingProgramCourseModel);

export type SubjectGroupingProgramCourse = z.infer<typeof createSubjectGroupingProgramCourse>;

export type SubjectGroupingProgramCourseT = typeof createSubjectGroupingProgramCourse._type;