import {
    boolean,
    integer,
    pgTable,
    serial,
    timestamp,
    varchar,
    uniqueIndex,
} from "drizzle-orm/pg-core";
import { academicYearModel } from "../academics";
import { subjectTypeModel } from "./subject-type.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const subjectGroupingMainModel = pgTable(
    "subject_grouping_main",
    {
        id: serial().primaryKey(),
        academicYearId: integer("academic_year_id_fk")
            .references(() => academicYearModel.id)
            .notNull(),
        subjectTypeId: integer("subject_type_id_fk")
            .references(() => subjectTypeModel.id)
            .notNull(),
        name: varchar({ length: 500 }).notNull(),
        code: varchar({ length: 500 }),
        description: varchar({ length: 500 }),

        isActive: boolean().default(true),

        createdAt: timestamp().notNull().defaultNow(),
        updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
    },
    (t) => ({
        // Ensure (academic_year_id_fk, subject_type_id_fk, name) is unique
        uqAcademicYearSubjectTypeName: uniqueIndex(
            "subject_grouping_main_ac_year_sub_type_name_uq",
        ).on(t.academicYearId, t.subjectTypeId, t.name),
    }),
);

export const createSubjectGroupingMain =
    createInsertSchema(subjectGroupingMainModel);

export type SubjectGroupingMain = z.infer<typeof createSubjectGroupingMain>;

export type SubjectGroupingMainT = typeof createSubjectGroupingMain._type;