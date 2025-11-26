import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { subjectModel } from "./subject.model";
import { subjectGroupingMainModel } from "./subject-grouping-main.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const subjectGroupingSubjectModel = pgTable("subject_grouping_subjects", {
    id: serial().primaryKey(),
    subjectGroupingMainId: integer("subject_grouping_main_id_fk")
        .references(() => subjectGroupingMainModel.id)
        .notNull(),
    subjectId: integer("subject_id_fk")
        .references(() => subjectModel.id)
        .notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createSubjectGroupingSubject = createInsertSchema(subjectGroupingSubjectModel);

export type SubjectGroupingSubject = z.infer<typeof createSubjectGroupingSubject>;

export type SubjectGroupingSubjectT = typeof createSubjectGroupingSubject._type;