import { admissionCourseModel } from "@/features/admissions/models/admission-course.model.js";
import { applicationFormModel } from "@/features/admissions/models/application-form.model.js";
import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const admissionCourseApplication = pgTable(
  "admission_course_applications",
  {
    id: serial("id").primaryKey(),
    applicationFormId: integer("application_form_id_fk")
      .references(() => applicationFormModel.id)
      .notNull(),
    admissionCourseId: integer("admission_course_id_fk")
      .references(() => admissionCourseModel.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
);

export const createAdmissionCourseApplicationSchema = createInsertSchema(
  admissionCourseApplication,
);

export type AdmissionCourseApplication = z.infer<
  typeof createAdmissionCourseApplicationSchema
>;
