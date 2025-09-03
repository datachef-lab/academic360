import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, numeric, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { subjectResultStatusType } from "@/schemas/enums";
import { academicSubjectModel, admissionAcademicInfoModel, gradeModel } from "@/schemas/models/admissions";

export const studentAcademicSubjects = pgTable("student_academic_subjects", {
    id: serial("id").primaryKey(),
    legacySubjectDetailsId: integer("legacy_subject_details_id"),
    admissionAcademicInfoId: integer("admission_academic_info_id_fk")
        .references(() => admissionAcademicInfoModel.id)
        .notNull(),
    academicSubjectId: integer("academic_subject_id_fk")
        .references(() => academicSubjectModel.id)
        .notNull(),
    theoryMarks: doublePrecision("theory_marks").default(0),
    practicalMarks: doublePrecision("practical_marks").default(0),
    totalMarks: doublePrecision("total_marks").default(0),
    gradeId: integer("grade_id_fk").references(() => gradeModel.id),
    resultStatus: subjectResultStatusType("result_status").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createStudentAcademicSubjectsSchema = createInsertSchema(studentAcademicSubjects);

export type StudentAcademicSubjects = z.infer<typeof createStudentAcademicSubjectsSchema>;

export type StudentAcademicSubjectsT = typeof createStudentAcademicSubjectsSchema._type;