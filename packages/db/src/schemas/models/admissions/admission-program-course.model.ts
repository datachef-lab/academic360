import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { admissionModel } from "@/schemas/models/admissions";
import { programCourseModel } from "@/schemas/models/course-design";
import { classModel, shiftModel } from "../academics";

export const admissionProgramCourseModel = pgTable("admission_program_courses", {
    id: serial().primaryKey().notNull(),
    admissionId: integer("admission_id_fk")
        .references(() => admissionModel.id)
        .notNull(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    amount: integer("amount").notNull().default(750),
    shiftId: integer("shift_id_fk").references(() => shiftModel.id),
    classId: integer("class_id_fk").references(() => classModel.id),
    isActive: boolean().default(true),
    isClosed: boolean().default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
    remarks: text("remarks"),
});

export const createAdmissionProgramCourseSchema = createInsertSchema(admissionProgramCourseModel);

export type AdmissionProgramCourse = z.infer<typeof createAdmissionProgramCourseSchema>;

export type AdmissionProgramCourseT = typeof createAdmissionProgramCourseSchema._type;