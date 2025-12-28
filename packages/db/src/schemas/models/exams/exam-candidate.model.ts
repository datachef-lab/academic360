import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { examModel } from "./exam.model";
import { promotionModel } from "../batches";
import { examRoomModel } from "./exam-room.model";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { paperModel } from "../course-design";
import { examSubjectTypeModel } from "./exam-subject-type.model";
import { examSubjectModel } from "./exam-subject.model";

export const examCandidateModel = pgTable("exam_candidates", {
    id: serial().primaryKey(),
    examId: integer("exam_id_fk")
        .references(() => examModel.id)
        .notNull(),
    promotionId: integer("promotion_id_fk")
        .references(() => promotionModel.id)
        .notNull(),
    examRoomId: integer("exam_room_id_fk")
        .references(() => examRoomModel.id)
        .notNull(),
    examSubjectTypeId: integer("exam_subject_type_id_fk")
        .references(() => examSubjectTypeModel.id)
        .notNull(),
    examSubjectId: integer("exam_subject_id_fk")
        .references(() => examSubjectModel.id)
        .notNull(),
    paperId: integer("paper_id_fk")
        .references(() => paperModel.id)
        .notNull(),
    seatNumber: varchar({ length: 255 }).notNull(),
    foilNumber: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createExamCandidateSchema = createInsertSchema(examCandidateModel);

export type ExamCandidate = z.infer<typeof createExamCandidateSchema>;

export type ExamCandidateT = typeof examCandidateModel.$inferSelect;