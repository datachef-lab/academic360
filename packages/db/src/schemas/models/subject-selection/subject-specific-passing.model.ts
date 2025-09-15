import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { subjectModel } from "../course-design";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const subjectSpecificPassingModel = pgTable("subject_specific_passing", {
    id: serial().primaryKey(),
    subjectId: integer("subject_id_fk")
        .references(() => subjectModel.id),
    passingPercentage: integer("passing_percentage"),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createSubjectSpecificPassing = createInsertSchema(subjectSpecificPassingModel);

export type SubjectSpecificPassing = z.infer<typeof createSubjectSpecificPassing>;

export type SubjectSpecificPassingT = typeof createSubjectSpecificPassing._type;