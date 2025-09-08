import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { doublePrecision, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { subjectResultStatusType } from "@/schemas/enums";
import { admissionAcademicInfoModel, boardSubjectModel, gradeModel } from "@/schemas/models/admissions";

export const studentAcademicSubjectModel = pgTable("student_academic_subjects", {
    id: serial("id").primaryKey(),
    legacySubjectDetailsId: integer("legacy_subject_details_id"),
    admissionAcademicInfoId: integer("admission_academic_info_id_fk")
        .references(() => admissionAcademicInfoModel.id)
        .notNull(),
    // academicSubjectId: integer("academic_subject_id_fk")
    //     .references(() => academicSubjectModel.id)
    //     .notNull(),
    boardSubjectId: integer("board_subject_id_fk")
        .references(() => boardSubjectModel.id)
        .notNull(),
    theoryMarks: doublePrecision("theory_marks").default(0),
    practicalMarks: doublePrecision("practical_marks").default(0),
    totalMarks: doublePrecision("total_marks").default(0),
    gradeId: integer("grade_id_fk").references(() => gradeModel.id),
    resultStatus: subjectResultStatusType("result_status"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createStudentAcademicSubjectsSchema = createInsertSchema(studentAcademicSubjectModel) as z.ZodTypeAny;

export type StudentAcademicSubjects = z.infer<typeof createStudentAcademicSubjectsSchema>;

export type StudentAcademicSubjectsT = typeof createStudentAcademicSubjectsSchema._type;