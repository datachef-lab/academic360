import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { examModel } from "./exam.model";
import { shiftModel } from "../academics";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const examShiftModel = pgTable("exam_shifts", {
    id: serial().primaryKey(),
    examId: integer("exam_id_fk")
        .references(() => examModel.id)
        .notNull(),
    shiftId: integer("shift_id_fk")
        .references(() => shiftModel.id)
        .notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createExamShiftSchema = createInsertSchema(examShiftModel);

export type ExamShift = z.infer<typeof createExamShiftSchema>;

export type ExamShiftT = typeof examShiftModel.$inferSelect;
