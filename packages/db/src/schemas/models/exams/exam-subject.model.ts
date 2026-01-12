import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { examModel } from "./exam.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { paperModel, subjectModel } from "../course-design";

export const examSubjectModel = pgTable("exam_subjects", {
    id: serial().primaryKey(),
    examId: integer("exam_id_fk")
        .references(() => examModel.id)
        .notNull(),
    subjectId: integer("subject_id_fk")
        .references(() => subjectModel.id)
        .notNull(),
    paperId: integer("paper_id_fk")
        .references(() => paperModel.id),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createExamSubjectSchema = createInsertSchema(examSubjectModel);

export type ExamSubject = z.infer<typeof createExamSubjectSchema>;

export type ExamSubjectT = typeof createExamSubjectSchema._type;