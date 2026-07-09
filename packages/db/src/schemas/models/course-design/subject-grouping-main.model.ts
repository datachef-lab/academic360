import {
    boolean,
    integer,
    pgTable,
    serial,
    timestamp,
    varchar,
    uniqueIndex,
    type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { academicYearModel } from "../academics";
import { subjectTypeModel } from "./subject-type.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const subjectGroupingMainModel = pgTable(
    "subject_grouping_main",
    {
        id: serial().primaryKey(),
        legacySubjectGroupId: integer(),
        academicYearId: integer("academic_year_id_fk")
            .references(() => academicYearModel.id)
            .notNull(),
        subjectTypeId: integer("subject_type_id_fk")
            .references(() => subjectTypeModel.id),
        name: varchar({ length: 500 }).notNull(),
        code: varchar({ length: 500 }),
        description: varchar({ length: 500 }),

        isActive: boolean().default(true),

        // Self-referential link to the same grouping in the previous academic
        // year (mirrors papers.previous_paper_id_fk). Set when a year's
        // structure is copied, by natural-key match to the adjacent year.
        previousSubjectGroupingId: integer("previous_subject_grouping_id_fk")
            .references((): AnyPgColumn => subjectGroupingMainModel.id),

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