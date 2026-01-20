import {  integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { examTypeModel } from "./exam-type.model";
import { academicYearModel, classModel } from "../academics";
import { examOrderTypeEnum, genderTypeEnum } from "@/schemas/enums";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { userModel } from "../user";

export const examModel = pgTable("exams", {
    id: serial().primaryKey(),
    legacyExamAssginmentId: integer(),
    academicYearId: integer()
        .references(() => academicYearModel.id)
        .notNull(),
    examTypeId: integer("exam_type_id_fk")
        .references(() => examTypeModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    orderType: examOrderTypeEnum(),
    gender: genderTypeEnum(),
    scheduledByUserId: integer("scheduled_by_user_id_fk")
        .references(() => userModel.id),
    lastUpdatedByUserId: integer("last_updated_by_user_id_fk")
        .references(() => userModel.id),
    admitCardStartDownloadDate: timestamp("admit_card_start_download_date", { withTimezone: true }),
    admitCardLastDownloadDate: timestamp("admit_card_last_download_date", { withTimezone: true }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
})

export const createExamSchema = createInsertSchema(examModel);

export type Exam = z.infer<typeof createExamSchema>;

export type ExamT = typeof examModel.$inferSelect;
