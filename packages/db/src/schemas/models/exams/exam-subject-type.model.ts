import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { examModel } from "./exam.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { subjectTypeModel } from "../course-design";

export const examSubjectTypeModel = pgTable("exam_subject_types", {
    id: serial().primaryKey(),
    examId: integer("exam_id_fk")
        .references(() => examModel.id)
        .notNull(),
    subjectTypeId: integer("subject_type_id_fk")
        .references(() => subjectTypeModel.id)
        .notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createExamSubjectTypeSchema = createInsertSchema(examSubjectTypeModel);

export type ExamSubjectType = z.infer<typeof createExamSubjectTypeSchema>;

export type ExamSubjectTypeT = typeof examSubjectTypeModel.$inferSelect;