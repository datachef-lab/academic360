import { applicationFormModel } from "@repo/db/schemas/models/admissions";
import { paymentMode, paymentStatus } from "@repo/db/schemas/enums";
import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const paymentModel = pgTable("payments", {
  id: serial("id").primaryKey(),
  applicationFormId: integer("application_form_id_fk")
    .references(() => applicationFormModel.id)
    .notNull(),

  orderId: varchar("order_id", { length: 100 }).notNull(),
  transactionId: varchar("transaction_id", { length: 100 }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),

  status: paymentStatus("status").notNull().default("PENDING"),
  paymentMode: paymentMode("payment_mode"),
  bankTxnId: varchar("bank_txn_id", { length: 100 }),
  gatewayName: varchar("gateway_name", { length: 50 }),
  txnDate: timestamp("txn_date"),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date()),
  remarks: text("remarks"),
});

export const createPaymentSchema = createInsertSchema(paymentModel);

export type Payment = z.infer<typeof createPaymentSchema>;
