import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";

import { studentModel } from "../user";
import { batchModel } from "./index";

export const batchStudentMappingModel = pgTable("batch_student_mappings", {
    id: serial().primaryKey(),
    batchId: integer("batch_id_fk")
        .references(() => batchModel.id)
        .notNull(),
    studentId: integer("student_id_fk")
        .references(() => studentModel.id)
        .notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createBatchStudentMappingSchema = createInsertSchema(batchStudentMappingModel);

export type BatchStudentMapping = z.infer<typeof createBatchStudentMappingSchema>;

export type BatchStudentMappingT = typeof createBatchStudentMappingSchema._type;