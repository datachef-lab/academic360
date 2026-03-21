import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { integer, jsonb, numeric, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { paymentForTypeEnum, paymentMode, paymentStatus, paymentStatusEnum } from "@/schemas/enums";
import { applicationFormModel } from "@/schemas/models/admissions";
import { feeStudentMappingModel } from "../fees";

export const paymentModel = pgTable("payments", {
    id: serial("id").primaryKey(),
    applicationFormId: integer("application_form_id_fk")
        .references(() => applicationFormModel.id),
    feeStudentMappingId: integer("fee_student_mapping_id_fk")
        .references(() => feeStudentMappingModel.id),
    paymentFor: paymentForTypeEnum("payment_for_type").notNull(),

    orderId: varchar("order_id", { length: 1000 }).notNull().unique(),
    transactionId: varchar("transaction_id", { length: 100 }).unique(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),

    status: paymentStatus("status").notNull().default("PENDING"),
    paymentStatus: paymentStatusEnum().notNull().default("PENDING").notNull(),
    paymentMode: paymentMode("payment_mode"),
    bankTxnId: varchar("bank_txn_id", { length: 100 }),
    gatewayName: varchar("gateway_name", { length: 50 }),
    txnDate: timestamp("txn_date"),
    gatewayResponse: jsonb("gateway_response"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
    remarks: text("remarks"),
});

export const createPaymentSchema = createInsertSchema(paymentModel);

export type Payment = z.infer<typeof createPaymentSchema>;

export type PaymentT = typeof createPaymentSchema._type;