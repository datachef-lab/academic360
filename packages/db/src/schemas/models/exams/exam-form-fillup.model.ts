import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { promotionStatusModel } from "../batches";

import { createInsertSchema } from "drizzle-zod";
import z from "zod";
import { examFormFillupStatusEnum } from "@/schemas/enums";
import { studentModel } from "../user";
import { classModel, sessionModel } from "../academics";
import { programCourseModel } from "../course-design";

export const examFormFillupModel = pgTable("exam_form_fillup", {
    id: serial().primaryKey(),
    studentId: integer("student_id_fk")
        .references(() => studentModel.id)
        .notNull(),
    sessionId: integer("session_id_fk")
        .references(() => sessionModel.id)
        .notNull(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    appearTypeId: integer("appear_type_id_fk")
        .references(() => promotionStatusModel.id)
        .notNull(),
    status: examFormFillupStatusEnum().notNull().default("PENDING"),
    createdAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp({ withTimezone: true })
        .notNull()
        .defaultNow()
        .$onUpdate(() => new Date()),
});

export const createExamFormFillupSchema = createInsertSchema(examFormFillupModel);

export type ExamFormFillup = z.infer<typeof createExamFormFillupSchema>;

export type ExamFormFillupT = typeof examFormFillupModel.$inferSelect;
