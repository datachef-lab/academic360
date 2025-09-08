import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { courseHeaderModel } from "./course-header.model";

export const courseModel = pgTable('courses', {
    id: serial().primaryKey(),
    legacyCourseId: integer("legacy_course_id"),
    courseHeaderId: integer("course_header_id_fk")
        .references(() => courseHeaderModel.id),
    name: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCourseModel = createInsertSchema(courseModel) as z.ZodTypeAny;

export type Course = z.infer<typeof createCourseModel>;

export type CourseT = typeof createCourseModel._type;