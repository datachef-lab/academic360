import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "./student.model.ts";

import { boardUniversityModel } from "@/features/resources/models/boardUniversity.model.ts";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { boardResultStatusModel } from "@/features/resources/models/boardResultStatus.model.ts";
import { institutionModel } from "@/features/resources/models/institution.model.ts";

export const academicHistoryModel = pgTable("academic_history", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").notNull().references(() => studentModel.id),
    lastInstitutionId: integer("last_institution_id_fk").references(() => institutionModel.id),
    lastBoardUniversityId: integer("last_board_university_id_fk").references(() => boardUniversityModel.id),
    studiedUpToClass: integer(),
    passedYear: integer(),
    specialization: varchar({ length: 255 }),
    lastResultId: integer("last_result_id_fk").references(() => boardResultStatusModel.id),
    remarks: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const academicHistoryRelations = relations(academicHistoryModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [academicHistoryModel.studentId],
        references: [studentModel.id]
    }),
    lastInstitution: one(institutionModel, {
        fields: [academicHistoryModel.lastInstitutionId],
        references: [institutionModel.id]
    }),
    lastBoardUniversity: one(boardUniversityModel, {
        fields: [academicHistoryModel.lastBoardUniversityId],
        references: [boardUniversityModel.id]
    }),
    lastBoardResultStatus: one(boardResultStatusModel, {
        fields: [academicHistoryModel.lastResultId],
        references: [boardResultStatusModel.id]
    }),
}));

export const createAcademicHistorySchema = createInsertSchema(academicHistoryModel);

export type AcademicHistory = z.infer<typeof createAcademicHistorySchema>;