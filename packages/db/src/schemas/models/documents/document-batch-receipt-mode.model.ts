
import { boolean, integer, pgTable, serial, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { documentBatchReceiptModeEnum } from "@/schemas/enums";
import { documentBatchReceiptModel } from "./document-batch-receipt.model";


export const documentBatchReceiptModeModel = pgTable("document_batch_receipt_modes", {
    id: serial().primaryKey(),
    documentBatchReceiptModeId: integer("document_batch_receipt_id_fk")
        .references(() => documentBatchReceiptModel.id)
        .notNull(),
    mode: documentBatchReceiptModeEnum().default("ADMINISTRATIVE").notNull(),
    isEnabled: boolean().default(false),
    notifyStudent: boolean().default(false),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => {
    return {
        uniqueDocumentBatchReceiptMode: unique("document_batch_receipt_mode").on(
            table.documentBatchReceiptModeId,
            table.mode
        ),
    };
});

export const createdocumentBatchReceiptModeModel = createInsertSchema(documentBatchReceiptModeModel);

export type DocumentBatchReceiptMode = z.infer<typeof createdocumentBatchReceiptModeModel>;

export type DocumentBatchReceiptModeT = typeof createdocumentBatchReceiptModeModel._type;