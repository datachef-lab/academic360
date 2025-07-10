import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { degreeModel } from "@/features/resources/models/degree.model.js";
import { programmeTypeEnum, streamType } from "@/features/user/models/helper.js";

export const courseModel = pgTable('courses', {
    id: serial().primaryKey(),
    degreeId: integer("degree_id_fk").references(() => degreeModel.id),
    stream: streamType().notNull(),
    name: varchar({ length: 500 }).notNull(),
    programmeType: programmeTypeEnum(),
    shortName: varchar({ length: 500 }),
    codePrefix: varchar({ length: 10 }),
    universityCode: varchar({ length: 10 }),
    numberOfSemesters: integer(),
    durationInYears: varchar({length: 255}),
    sequence: integer().unique(),
    disabled: boolean().default(false),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createCourseModel = createInsertSchema(courseModel);

export type Course = z.infer<typeof createCourseModel>;