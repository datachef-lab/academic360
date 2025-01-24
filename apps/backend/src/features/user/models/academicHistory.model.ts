import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { studentModel } from "./student.model.ts";
import { lastInstitutionModel } from "@/features/resources/models/lastInstitution.model.ts";
import { lastBoardUniversityModel } from "@/features/resources/models/lastBoardUniversity.model.ts";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const academicHistoryModel = pgTable("academic_history", {
    id: serial().primaryKey(),
    studentId: integer().notNull().references(() => studentModel.id),
    lastInstitutionId: integer().references(() => lastInstitutionModel.id),
    lastBoardUniversityId: integer().references(() => lastBoardUniversityModel.id),
    studiedUpToClass: integer(),
    passedYear: integer(),
    specialization: varchar({ length: 255 }),
    lastResult: varchar({ length: 255 }),
    remarks: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const academicHistoryRelations = relations(academicHistoryModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [academicHistoryModel.studentId],
        references: [studentModel.id]
    }),
    lastInstitution: one(lastInstitutionModel, {
        fields: [academicHistoryModel.lastInstitutionId],
        references: [lastInstitutionModel.id]
    }),
    lastBoardUniversity: one(lastBoardUniversityModel, {
        fields: [academicHistoryModel.lastBoardUniversityId],
        references: [lastBoardUniversityModel.id]
    }),
}));

export const createAcademicHistorySchema = createInsertSchema(academicHistoryModel);

export type AcademicHistory = z.infer<typeof createAcademicHistorySchema>;