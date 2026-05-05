import { academicActivityAudienceEnum } from "@/schemas/enums";
import {  integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "../user";
import { academicYearModel } from "./academic-year.model";
import { affiliationModel, regulationTypeModel } from "../course-design";
import { promotionStatusModel } from "../batches";
import { academicActivityMasterModel } from "./academic-activity-master.model";

export const academicActivityModel = pgTable("academic_activities", {
    id: serial().primaryKey(),
    academicYearId: integer("academic_year_id_fk")
    .references(() => academicYearModel.id)
    .notNull(),
    academicActivityMasterId: integer("academic_activity_master_id_fk")
        .references(() => academicActivityMasterModel.id)
        .notNull(),
    audience: academicActivityAudienceEnum()
        .default("ALL")
        .notNull(),
    affiliationId: integer("affiliation_id_fk")
        .references(() => affiliationModel.id)
        .notNull(),
    regulationTypeId: integer("regulation_type_id_fk")
        .references(() => regulationTypeModel.id)
        .notNull(),
    appearTypeId: integer("appear_type_promotion_status_id_fk")
        .references(() => promotionStatusModel.id)
        .notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
    lastUpdatedBy: integer("last_updated_by_user_id_fk")
        .references(() => userModel.id),
});

export const createAcademicActivitySchema = createInsertSchema(academicActivityModel);

export type AcademicActivity = z.infer<typeof createAcademicActivitySchema>

export type AcademicActivityT = typeof createAcademicActivitySchema._type