import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { addonModel } from "@/schemas/models/fees";

export const feeReceiptTypeModel = pgTable("fee_receipt_types", {
    id: serial().primaryKey(),
    legacyFeeReceiptTypeId: integer(),
    name: varchar({ length: 255 }).notNull(),
    chk: varchar({ length: 255 }),
    chkMisc: varchar({ length: 255 }),
    printChln: varchar({ length: 255 }),
    splType: varchar({ length: 255 }),
    addOnId: integer("add_on_id").references(() => addonModel.id),
    printReceipt: varchar({ length: 255 }),
    chkOnline: varchar({ length: 255 }),
    chkOnSequence: varchar({ length: 255 }),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp().notNull().defaultNow().$onUpdate(() => new Date()),
});

export const createFeeReceiptTypeSchema = createInsertSchema(feeReceiptTypeModel);

export type FeeReceiptType = z.infer<typeof createFeeReceiptTypeSchema>;

export type FeeReceiptTypeT = typeof createFeeReceiptTypeSchema._type;