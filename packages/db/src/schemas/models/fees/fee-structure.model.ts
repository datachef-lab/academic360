import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { date, doublePrecision, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { receiptTypeModel } from "@/schemas/models/fees";
import { courseModel, programCourseModel } from "@/schemas/models/course-design";
import { academicYearModel, classModel, shiftModel } from "@/schemas/models/academics";

export const feeStructureModel = pgTable("fee_structures", {
    id: serial().primaryKey(),
    receiptTypeId: integer("receipt_type_id_fk")
        .references(() => receiptTypeModel.id)
        .notNull(),
    baseAmount: doublePrecision().notNull(),
    closingDate: date(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    programCourseId: integer("program_course_id_fk").notNull()
        .references(() => programCourseModel.id)
        .notNull(),
    classId: integer("class_id_fk").notNull().references(() => classModel.id),
    shiftId: integer("shift_id_fk").references(() => shiftModel.id).notNull(),
    advanceForProgramCourseId: integer("advance_for_program_course_id_fk")
        .references(() => programCourseModel.id),
    advanceForClassId: integer("advance_for_class_id_fk")
        .references(() => classModel.id),
    startDate: timestamp(),
    endDate: timestamp(),
    onlineStartDate: timestamp(),
    onlineEndDate: timestamp(),
    numberOfInstallments: integer(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeeStructureSchema = createInsertSchema(feeStructureModel);

export type FeeStructure = z.infer<typeof createFeeStructureSchema>;

export type FeeStructureT = typeof createFeeStructureSchema._type;