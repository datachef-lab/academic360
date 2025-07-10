import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { paperModel } from "./paper.model";
import { batchStudentMappingModel } from "@/features/academics/models/batch-student-mapping.model";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const batchStudentPaperModel = pgTable("batch_student_papers", {
    id: serial().primaryKey(),
    batchStudentMappingId: integer("batch_student_mapping_id_fk")
        .references(() => batchStudentMappingModel.id)
        .notNull(),
    paperId: integer("paper_id_fk")
        .references(() => paperModel.id)
        .notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createBatchStudentPaperSchema = createInsertSchema(batchStudentPaperModel);

export type BatchStudentPaper = z.infer<typeof createBatchStudentPaperSchema>;