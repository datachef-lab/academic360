import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const courseLevelModel = pgTable('course_levels', {
    id: serial().primaryKey(),
    name: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    sequence: integer().unique(),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCourseLevelModel = createInsertSchema(courseLevelModel);

export type CourseLevel = z.infer<typeof createCourseLevelModel>;

export type CourseLevelT = typeof createCourseLevelModel._type;
