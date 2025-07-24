import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { degreeModel } from "@/features/resources/models/degree.model.js";

export const courseModel = pgTable('courses', {
    id: serial().primaryKey(),
    degreeId: integer("degree_id_fk").references(() => degreeModel.id),
    name: varchar({ length: 500 }).notNull(),
    shortName: varchar({ length: 500 }),
    codePrefix: varchar({ length: 10 }),
    universityCode: varchar({ length: 10 }),
    amount: integer("amount"),
    numberOfSemesters: integer(),
    duration: varchar({length: 255}),
    sequene: integer().unique().default(0),

    sequence: integer().unique(),

    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCourseModel = createInsertSchema(courseModel);

export type Course = z.infer<typeof createCourseModel>;
