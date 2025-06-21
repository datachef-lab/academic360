import { academicYearModel } from "@/features/academics/models/academic-year.model";
import { courseModel } from "@/features/academics/models/course.model";
import { date, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { feesSlabModel } from "./fees-slab.model";

export const feesStructureModel = pgTable("fees_structures", {
    id: serial().primaryKey(),
    closingDate: date().notNull(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    courseId: integer("course_id_fk").notNull()
        .references(() => courseModel.id)
        .notNull(),
    semester: integer().notNull(),
    advanceForCourseId: integer("advance_for_course_id_fk").notNull()
        .references(() => courseModel.id),
    advanceForSemester: integer(),
    feeSlabId: integer("fees_slab_id_fk")
        .references(() => feesSlabModel.id)
        .notNull(),
    startDate: date().notNull(),
    endDate: date().notNull(),
    onlineDateFrom: date().notNull(),
    onlineDateTo: date().notNull(),
    numberOfInstalments: integer(),
    instalmentFromDate: date().notNull(),
    instalmentToDate: date().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeesStructureSchema = createInsertSchema(feesStructureModel);

export type feesStructure = z.infer<typeof createFeesStructureSchema>;