import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { subjectModel, subjectTypeModel } from "../course-design";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { academicYearModel } from "../academics";

export const restrictedGroupingMainModel = pgTable("restricted_grouping_main", {
    id: serial().primaryKey(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id),
    subjectTypeId: integer("subject_type_id_fk")
        .references(() => subjectTypeModel.id),
    subjectId: integer("subject_id_fk")
        .references(() => subjectModel.id),
    isActive: boolean().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createRestrictedGroupingMain = createInsertSchema(restrictedGroupingMainModel);

export type RestrictedGroupingMain = z.infer<typeof createRestrictedGroupingMain>;

export type RestrictedGroupingMainT = typeof createRestrictedGroupingMain._type;