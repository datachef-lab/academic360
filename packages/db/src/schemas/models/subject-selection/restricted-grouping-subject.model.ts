import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { restrictedGroupingMainModel } from "./restricted-grouping-main.model";
import { subjectModel } from "../course-design";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const restrictedGroupingSubjectModel = pgTable("restricted_grouping_subjects", {
    id: serial().primaryKey(),
    restrictedGroupingMainId: integer("restricted_grouping_main_id_fk")
        .references(() => restrictedGroupingMainModel.id),
    cannotCombineWithSubjectId: integer("cannot_combine_with_subject_id_fk")
        .references(() => subjectModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createRestrictedGroupingSubject = createInsertSchema(restrictedGroupingSubjectModel);

export type RestrictedGroupingSubject = z.infer<typeof createRestrictedGroupingSubject>;

export type RestrictedGroupingSubjectT = typeof createRestrictedGroupingSubject._type;