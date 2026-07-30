import { boolean, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { documentTypeModel } from "./document-type.model";
import { userModel } from "../user";
import { documentLedgerStatusEnum } from "@/schemas/enums";
import { documentBatchReceiptModel } from "./document-batch-receipt.model";
import { promotionModel } from "../batches";

export const documentLedgerModel = pgTable("document_ledger", {
    id: serial().primaryKey(),
    documentTypeId: integer("document_type_id_fk")
    .references(() => documentTypeModel.id)
    .notNull(),
    documentBatchReceiptId: integer("document_batch_receipt_id_fk")
    .references(() => documentBatchReceiptModel.id),
    promotionId: integer("promotion_id_fk")
        .references(() => promotionModel.id)
        .notNull(),
    isSelfSourced: boolean().notNull(), // Indicates whether the document has / will be provided to the student from the college or not. If false, it means the student has to upload or download the document themselves.
    status: documentLedgerStatusEnum().notNull(),
    link: text(),
    collectedAt: timestamp({ withTimezone: true }),
    providedBy: integer("provided_by_fk")
        .references(() => userModel.id),
    isOverridden: boolean().default(false),
    overrideReason: varchar({ length: 1000 }),
    overrideBy: integer("override_by_fk")
        .references(() => userModel.id),
    overriddenAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createdocumentLedgerModel = createInsertSchema(documentLedgerModel);

export type DocumentLedger = z.infer<typeof createdocumentLedgerModel>;

export type DocumentLedgerT = typeof createdocumentLedgerModel._type;