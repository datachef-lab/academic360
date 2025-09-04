import { academicYearModel } from   "@repo/db/schemas/models/academics";
import { courseModel } from "@repo/db/schemas/models/course-design";
import { shiftModel } from "@repo/db/schemas/models/academics";
import { date, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { feesReceiptTypeModel } from "./fees-receipt-type.model.js";
import { classModel } from "@repo/db/schemas/models/academics";

export const feesStructureModel = pgTable("fees_structures", {
    id: serial().primaryKey(),
    feesReceiptTypeId: integer("fees_receipt_type_id_fk")
        .references(() => feesReceiptTypeModel.id),
    closingDate: date().notNull(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    courseId: integer("course_id_fk").notNull()
        .references(() => courseModel.id)
        .notNull(),
    classId: integer("class_id_fk").notNull().references(() => classModel.id),
    shiftId: integer("shift_id_fk").references(() => shiftModel.id).notNull(),
    advanceForCourseId: integer("advance_for_course_id_fk")
        .references(() => courseModel.id),
    advanceForSemester: integer(),
    startDate: date().notNull(),
    endDate: date().notNull(),
    onlineStartDate: date().notNull(),
    onlineEndDate: date().notNull(),
    numberOfInstalments: integer(),

    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeesStructureSchema = createInsertSchema(feesStructureModel);

export type FeesStructure = z.infer<typeof createFeesStructureSchema>;