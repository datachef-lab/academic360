import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { admissionModel } from "@/schemas/models/admissions";
import { programCourseModel } from "@/schemas/models/course-design";
import { classModel, shiftModel } from "../academics";

export const admissionCourseModel = pgTable("admission_courses", {
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
    disabled: boolean().default(false),
    isClosed: boolean().default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
    remarks: text("remarks"),
});

export const createAdmissionCourseSchema = createInsertSchema(admissionCourseModel);

export type AdmissionCourse = z.infer<typeof createAdmissionCourseSchema>;

export type AdmissionCourseT = typeof createAdmissionCourseSchema._type;