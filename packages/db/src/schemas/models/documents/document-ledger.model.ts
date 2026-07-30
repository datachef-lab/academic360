import { boolean, integer, pgTable, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { documentTypeModel } from "./document-type.model";
import { studentModel, userModel } from "../user";
import { documentLedgerStatusEnum } from "@/schemas/enums";
import { documentBatchReceiptModel } from "./document-batch-receipt.model";

export const documentLedgerModel = pgTable("document_ledger", {
    id: serial().primaryKey(),
    documentTypeId: integer("document_type_id_fk")
        .references(() => documentTypeModel.id)
        .notNull(),
    documentBatchReceiptId: integer("document_batch_receipt_id_fk")
        .references(() => documentBatchReceiptModel.id),
    isSelfSourced: boolean().notNull(), // Inddicates whether the document has / will be provided to the student from the college or not. If false, it means the student has to upload or download the document themselves.
    studentId: integer("student_id_fk")
        .references(() => studentModel.id)
        .notNull(),
    status: documentLedgerStatusEnum().notNull(),
    collectedAt: timestamp({ withTimezone: true }),
    providedBy: integer("provided_by_fk")
        .references(() => userModel.id)
        .notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createdocumentLedgerModel = createInsertSchema(documentLedgerModel);

export type DocumentLedger = z.infer<typeof createdocumentLedgerModel>;

export type DocumentLedgerT = typeof createdocumentLedgerModel._type;