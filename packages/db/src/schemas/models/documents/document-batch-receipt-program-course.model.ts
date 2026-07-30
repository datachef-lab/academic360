
import { integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { programCourseModel } from "../course-design";
import { documentBatchReceiptModel } from "./document-batch-receipt.model";

export const documentBatchReceiptProgramCourseModel = pgTable("document_batch_receipt_program_courses", {
    id: serial().primaryKey(),
    documentBatchReceiptId: integer("document_batch_receipt_id_fk")
        .references(() => documentBatchReceiptModel.id)
        .notNull(),
    programCourseId: integer("program_course_id_fk")
        .references(() => programCourseModel.id)
        .notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createDocumentBatchReceiptProgramCourseModel = createInsertSchema(documentBatchReceiptProgramCourseModel);

export type DocumentBatchReceiptProgramCourse = z.infer<typeof createDocumentBatchReceiptProgramCourseModel>;

export type DocumentBatchReceiptProgramCourseT = typeof createDocumentBatchReceiptProgramCourseModel._type;