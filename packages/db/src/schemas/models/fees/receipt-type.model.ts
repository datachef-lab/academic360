import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

import { addonModel } from "@/schemas/models/fees";
import { userModel } from "../user";

export const receiptTypeModel = pgTable("receipt_types", {
    id: serial().primaryKey(),
    legacyReceiptTypeId: integer(),
    name: varchar({ length: 255 }).notNull(),
    chk: varchar({ length: 255 }),
    chkMisc: varchar({ length: 255 }),
    printChln: varchar({ length: 255 }),
    splType: varchar({ length: 255 }),
    addOnId: integer("add_on_id_fk").references(() => addonModel.id),
    printReceipt: varchar({ length: 255 }),
    chkOnline: varchar({ length: 255 }),
    chkOnSequence: varchar({ length: 255 }),
    isActive: boolean().default(true),
    createdAt: timestamp({withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp({withTimezone: true}).notNull().defaultNow().$onUpdate(() => new Date()),
    createdByUserId: integer("created_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
    updatedByUserId: integer("updated_by_user_id_fk")
        .references(() => userModel.id)
        .notNull(),
});

export const createReceiptTypeSchema = createInsertSchema(receiptTypeModel);

export type ReceiptType = z.infer<typeof createReceiptTypeSchema>;

export type ReceiptTypeT = typeof createReceiptTypeSchema._type;