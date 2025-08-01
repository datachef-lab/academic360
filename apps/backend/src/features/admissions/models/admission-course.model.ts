import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { admissionModel } from "./admission.model.js";
import { courseModel } from "@/features/course-design/models/course.model.js";
import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

export const admissionCourseModel = pgTable("admission_courses", {
    id: serial().primaryKey().notNull(),
    admissionId: integer("admission_id_fk")
        .references(() => admissionModel.id)
        .notNull(),
    courseId: integer("course_id_fk")
        .references(() => courseModel.id)
        .notNull(),
    amount: integer("amount").notNull().default(750),
    disabled: boolean().default(false),
    isClosed: boolean().default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
    remarks: text("remarks"),
});

export const createAdmissionCourseSchema = createInsertSchema(admissionCourseModel);

export type AdmissionCourse = z.infer<typeof createAdmissionCourseSchema>;