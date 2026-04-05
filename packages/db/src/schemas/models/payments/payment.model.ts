import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { boolean, doublePrecision, integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

import { paymentForTypeEnum, paymentModeEnum, paymentOnlineOptions, paymentStatus } from "@/schemas/enums";

import { userModel } from "../user";

export const paymentModel = pgTable("payments", {
    id: serial("id").primaryKey(),

    // General Details
    userId: integer("user_id_fk")
        .references(() => userModel.id),
    context: paymentForTypeEnum().notNull(),
    amount: doublePrecision().notNull().default(0),
    status: paymentStatus().notNull().default("PENDING").notNull(),
    paymentMode: paymentModeEnum().notNull(),
    paymentGatewayVendor: varchar({ length: 255 }),
    paymentOption: paymentOnlineOptions(),
    orderId: varchar({ length: 1000 }),

    // Merchant Details
    mid: varchar(),
    mcc: varchar(),
    merchantVpa: varchar(),
    merchantName: varchar(),
    merchantLogo: varchar(),

    // PCF Details: Post-order Convenience Fee (or simply Convenience Charge)
    pcfResultCode: varchar(),
    pcfResultStatus: varchar(),
    pcfResultMsg: varchar("pcf_result_message"),
    pcfConsultDetailsPayMethod: varchar(),
    pcfConsultDetailsBaseTransactionAmountValue: varchar(),
    pcfConsultDetailsBaseTransactionAmountCurrency: varchar(),
    pcfConsultDetailsFeeAmountValue: varchar(),
    pcfConsultDetailsFeeAmountCurrency: varchar(),
    pcfConsultDetailsTaxAmountValue: varchar(),
    pcfConsultDetailsTaxAmountCurrency: varchar(),
    pcfConsultDetailsTotalConvenienceChargesValue: varchar(),
    pcfConsultDetailsTotalConvenienceChargesCurrency: varchar(),
    pcfConsultDetailsTotalTransactionAmountValue: varchar(),
    pcfConsultDetailsTotalTransactionAmountCurrency: varchar(),
    pcfConsultDetailsText: varchar(),
    pcfConsultDetailsDisplayText: varchar(),

    // BIN (Bank Identification Number) Details
    bin: varchar(),
    binIssuingBank: varchar(),
    binIssuingBankCode: varchar(),
    binPaymentMode: varchar(),
    binChannelName: varchar(),
    binChannelCode: varchar(),
    binCnMin: varchar("min_card_number_digits"),
    binCnMax: varchar("max_card_number_digits"),
    binCvvR: varchar("is_bin_cvv_required"),
    binCvvL: varchar("bin_cvv_length"),
    binExpR: varchar("is_bin_expiry_required"),
    isbinIndian: varchar(),
    isbinActive: varchar(),
    binCountryCode: varchar(),
    binCountryName: varchar(),
    binCountryNumericCode: varchar(),
    binCurrencyCode: varchar(),
    binCurrencyName: varchar(),
    binCurrencyNumericCode: varchar(),
    binCurrencySymbol: varchar(),
    isBinEligibleForCoft: boolean(),
    isBinCoftPaymentSupported: boolean(),
    isBinEligibleForAltId: boolean(),
    isBinAltIdPaymentSupported: boolean(),
    hasLowSuccessRateStatus: boolean(),
    hasLowSuccessRateMsg: varchar("has_low_success_rate_message"),
    IsEmiAvailable: boolean(),
    iconUrl: varchar(),
    errorMessage: varchar(),
    isSubscriptionAvailable: boolean(),
    isHybridPayModeDisabled: boolean(),
    prepaidCard: varchar(),
    prepaidCardMaxAmount: varchar(),
    nativeOtpEligible: varchar(),
    
    // Transaction Details
    txnId: varchar("transaction_id", { length: 500 }),
    bankTxnId: varchar("bank_transaction_id", { length: 500 }),
    txnAmount: varchar("transaction_amount", { length: 500 }),
    txnType: varchar("transaction_type", { length: 500 }),
    txnGatewayName: varchar("transaction_gateway_name", { length: 500 }),
    txnGatewayInfo: varchar("transaction_gateway_info", { length: 500 }),
    bankName: varchar("bank_name", { length: 1000 }),
    txnPaymentMode: varchar("transaction_payment_mode", { length: 1000 }),
    txnRefundAmt: varchar("transaction_refund_amount"),
    txnDate: varchar("transaction_date"),
    subsId: varchar("subscription_id"),
    payableAmount: varchar("payable_amount"),
    paymentPromoCheckoutData: varchar("payment_promo_checkout_data"),
    van: varchar(),
    beneficiaryName: varchar(),
    ifscCode: varchar(),
    vanBankName: varchar(),
    vanPurpose: varchar(),
    customerName: varchar(),
    customerEmail: varchar(),
    customerPhone: varchar(),
    sourceAccountNumberMasked: varchar(),
    sourceAccountHolderName: varchar(),
    transferMode: varchar(),
    utr: varchar(),
    bankTransactionDate: varchar(),
    rrnCode: varchar(),
    arnCode: varchar(),
    arnAvailable: boolean(),
    authCode:varchar(),
    merchantUniqRef: varchar("merchant_unique_reference"),
    cardScheme: varchar(),
    cardLastFourDigit: varchar(),
    internationalCardPayment: boolean(),
    blockedAmount: varchar(),
    authRefId: varchar(),
    checksumHash: varchar(),

    isManualEntry: boolean().default(false).notNull(),
    recordedBy: integer("recorded_by_user_id_fk").references(() => userModel.id), // The Staff ID
    internalRemarks: text("internal_remarks"), // Why was this manual action taken?

    remarks: text(),
    gatewayResponse: jsonb("gateway_response"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().$onUpdate(() => new Date()),
});

export const createPaymentSchema = createInsertSchema(paymentModel);

export type Payment = z.infer<typeof createPaymentSchema>;

export type PaymentT = typeof createPaymentSchema._type;