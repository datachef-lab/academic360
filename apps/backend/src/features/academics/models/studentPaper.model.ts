import { studentModel } from "@/features/user/models/student.model";
import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { batchPaperModel } from "./batchPaper.model";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const studentPaperModel = pgTable("student_papers", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk").notNull().references(() => studentModel.id),
    batchPaperId: integer("batch_paper_id_fk").notNull().references(() => batchPaperModel.id),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const studentPaperRelations = relations(studentPaperModel, ({ one }) => ({
    student: one(studentModel, {
        fields: [studentPaperModel.studentId],
        references: [studentModel.id],
    }),
    batchPaper: one(batchPaperModel, {
        fields: [studentPaperModel.batchPaperId],
        references: [batchPaperModel.id],
    }),
}));

export const createStudentPaperSchema = createInsertSchema(studentPaperModel);

export type StudentPaper = z.infer<typeof createStudentPaperSchema>;