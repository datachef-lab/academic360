import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { examModel } from "./exam.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { subjectModel } from "../course-design";

export const examSubjectModel = pgTable("exam_subjects", {
    id: serial().primaryKey(),
    examId: integer("exam_id_fk")
        .references(() => examModel.id)
        .notNull(),
    subjectId: integer("subject_id_fk")
        .references(() => subjectModel.id)
        .notNull(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp().defaultNow().$onUpdate(() => new Date()),
});

export const createExamSubjectSchema = createInsertSchema(examSubjectModel);

export type ExamSubject = z.infer<typeof createExamSubjectSchema>;

export type ExamSubjectT = typeof createExamSubjectSchema._type;