
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { userModel } from "../user";
import { academicYearModel } from "../academics/academic-year.model";
import { classModel } from "../academics/class.model";
import { promotionStatusModel } from "../batches";
import { documentTypeModel } from "./document-type.model";

export const documentBatchReceiptModel = pgTable("document_batch_receipts", {
    id: serial().primaryKey(),
    documentTypeId: integer("document_type_id_fk")
        .references(() => documentTypeModel.id)
        .notNull(),
    name: varchar({ length: 1000 }).notNull(),
    academicYearId: integer("academic_year_id_fk")
        .references(() => academicYearModel.id)
        .notNull(),
    classId: integer("class_id_fk")
        .references(() => classModel.id)
        .notNull(),
    appearTypeId: integer("appear_type_id_fk")
        .references(() => promotionStatusModel.id),
    expectedArrivalDate: timestamp({ withTimezone: true }),
    availableFromDate: timestamp({ withTimezone: true }),
    createdBy: integer("created_by_user_id_fk")
            .references(() => userModel.id)
            .notNull(),
    updatedBy: integer("updated_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    documentsReceivedBy: integer("documents_received_by_user_id_fk")
        .references(() => userModel.id), // If documents from the university are received by a user, this field will be populated
    documentsReceivedAt: timestamp({ withTimezone: true }), // If documents from the university are received by a user, this field will be populated
    // Hides this batch's ledger entries from the student-facing document
    // ledger while the batch itself stays in the admin list. Never delete —
    // collected rows are historical facts.
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createDocumentBatchReceiptModel = createInsertSchema(documentBatchReceiptModel);

export type DocumentBatchReceipt = z.infer<typeof createDocumentBatchReceiptModel>;

export type DocumentBatchReceiptT = typeof createDocumentBatchReceiptModel._type;