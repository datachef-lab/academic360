import { integer, pgTable, serial, timestamp} from "drizzle-orm/pg-core";
import { examTypeModel } from "./exam-type.model";
import { academicYearModel, classModel } from "../academics";
import { examOrderTypeEnum, genderTypeEnum } from "@/schemas/enums";
import { createInsertSchema } from "drizzle-zod";
import z from "zod";

export const examModel = pgTable("exams", {
    id: serial().primaryKey(),
    legacyExamAssginmentId: integer(),
    academicYearId: integer()
        .references(() => academicYearModel.id)
        .notNull(),
    examTypeId: integer("exam_type_id_fk")
        .references(() => examTypeModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    
    orderType: examOrderTypeEnum(),
    gender: genderTypeEnum(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
})

export const createExamSchema = createInsertSchema(examModel);

export type Exam = z.infer<typeof createExamSchema>;

export type ExamT = typeof examModel.$inferSelect;
