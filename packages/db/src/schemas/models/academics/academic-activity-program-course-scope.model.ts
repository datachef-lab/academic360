import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { academicActivityModel } from "./academic-activity.model";
import { programCourseModel } from "../course-design";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const academicActivityProgramCourseScopeModel = pgTable("academic_activity_program_course_scopes", {
    id: serial().primaryKey(),
    academicActivityId: integer("academic_activity_id_fk")
        .references(() => academicActivityModel.id)
        .notNull(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createAcademicActivityProgramCourseScopeSchema = createInsertSchema(academicActivityProgramCourseScopeModel);

export type AcademicActivityProgramCourseScope = z.infer<typeof createAcademicActivityProgramCourseScopeSchema>

export type AcademicActivityProgramCourseScopeT = typeof createAcademicActivityProgramCourseScopeSchema._type