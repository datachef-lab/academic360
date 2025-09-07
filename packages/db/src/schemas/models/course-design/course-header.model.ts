import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const courseHeaderModel = pgTable('course_headers', {
    id: serial().primaryKey(),
    legacyCourseHeaderId: integer("legacy_course_header_id"),
    name: varchar({ length: 500 }).notNull(),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCourseHeaderSchema = createInsertSchema(courseHeaderModel);

export type CourseHeader = z.infer<typeof createCourseHeaderSchema>;

export type CourseHeaderT = typeof createCourseHeaderSchema._type;
