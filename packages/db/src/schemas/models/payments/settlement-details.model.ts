import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { paymentModel } from "./payment.model";
import z from "zod";
import { createInsertSchema } from "drizzle-zod";

export const settlementModel = pgTable("settlement_details", {
    id: serial("id").primaryKey(),
    paymentId: integer("payment_id_fk").references(() => paymentModel.id).notNull(),
    transactionId: varchar("transaction_id").unique(), // Each entry has its own ID
    merchantUniqueRef: varchar(),
    transactionDate: varchar(),
    updatedDate: varchar(),
    transactionType: varchar("transaction_type"), // ACQUIRING, REFUND, CHARGEBACK
    status: varchar(),
    originalMid: varchar(),
    customerId: varchar(),
    amount: varchar(),
    commission: varchar(),
    gst: varchar(),
    merchantBillId: varchar(), // It is merchant POS order ID
    payoutId: varchar("payout_id"),
    channel: varchar(), // Channel used for payment
    utrNo: varchar("utr_number"),
    payoutDate: varchar("payout_date"),
    settledDate: varchar("settled_date"),
    paymentMode: varchar(),
    issuingBank: varchar(),
    settledAmount: varchar(),
    bankTransactionId: varchar(),
    referenceTransactionId: varchar(),
    merchantRefId: varchar(),
    prn: varchar(), // 	Payment Reference Number
    acquiringFee: varchar(),
    platformFee: varchar(),
    acquiringTax: varchar(),
    platformTax: varchar(),
    ifscCode: varchar(),
    bankName: varchar(),
    beneficiaryName: varchar(),
    maskedCardNo: varchar(),
    cardNetwork: varchar(), // Card Network of customer
    rrnCode: varchar(), // Refund Retrieval Number
    disputeId: varchar(), // Unique ID incase of dispute transactions
    posId: varchar(), // Unique ID of each edc machine
    extSerialNo: varchar(), // Unique serial number of each edc
    gateway: varchar(), // Gateway used for transaction
    commissionRate: varchar(), // Commission Rate Charged by PG
    productCode: varchar(), // Unique code of Product
    requestType: varchar(), // Source used for payment.
    feeFactor: varchar(), // Fee Factor
    van: varchar(), // Virtual Account Number
    
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});

export const createSettlementDetailsSchema = createInsertSchema(paymentModel);

export type SettlementDetails = z.infer<typeof createSettlementDetailsSchema>;

export type SettlementDetailsT = typeof createSettlementDetailsSchema._type;