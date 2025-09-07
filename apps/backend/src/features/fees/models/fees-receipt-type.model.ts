import {
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { addonModel } from "./addon.model.js";

export const feesReceiptTypeModel = pgTable("fees_receipt_types", {
  id: serial().primaryKey(),
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
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const createFeesReceiptTypeSchema =
  createInsertSchema(feesReceiptTypeModel);

export type FeesReceiptType = z.infer<typeof createFeesReceiptTypeSchema>;
