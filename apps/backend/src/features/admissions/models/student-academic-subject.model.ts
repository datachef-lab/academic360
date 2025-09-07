import {
  integer,
  numeric,
  pgTable,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";
import { admissionAcademicInfoModel } from "@repo/db/schemas/models/admissions";
import { boardSubjectModel } from "@repo/db/schemas/models/admissions";
import { subjectResultStatusType } from "@repo/db/schemas/enums";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const studentAcademicSubjects = pgTable("student_academic_subjects", {
  id: serial("id").primaryKey(),
  admissionAcademicInfoId: integer("admission_academic_info_id_fk")
    .references(() => admissionAcademicInfoModel.id)
    .notNull(),
  academicSubjectId: integer("academic_subject_id_fk")
    .references(() => boardSubjectModel.id)
    .notNull(),
  fullMarks: numeric("full_marks", { precision: 10, scale: 2 }).notNull(),
  totalMarks: numeric("total_marks", { precision: 10, scale: 2 }).notNull(),
  resultStatus: subjectResultStatusType("result_status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const createStudentAcademicSubjectsSchema = createInsertSchema(
  studentAcademicSubjects,
);

export type StudentAcademicSubjects = z.infer<
  typeof createStudentAcademicSubjectsSchema
>;
