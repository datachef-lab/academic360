import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { degreeModel } from "@/schemas/models/resources/degree.model";

export const courseModel = pgTable('courses', {
    id: serial().primaryKey(),
    legacyCourseId: integer("legacy_course_id"),
    degreeId: integer("degree_id_fk").references(() => degreeModel.id),
    name: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCourseModel = createInsertSchema(courseModel);

export type Course = z.infer<typeof createCourseModel>;
