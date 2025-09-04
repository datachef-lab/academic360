import { db } from "@/db/index.js";
import { paymentModel, Payment } from "../models/payment.model.js";
import { applicationFormModel } from "@/features/admissions/models/application-form.model.js";
import { eq } from "drizzle-orm";

// CREATE
export async function createPayment(payment: Payment) {
    // const orderId = await generateOrderId();

    // const [newPayment] = await db
    //     .insert(paymentModel)
    //     .values({
    //         ...payment,
         
    //         applicationFormId: Number(payment.applicationFormId),
    //         amount: Number(payment.amount),
    //         transactionId: String(payment.transactionId),
    //         orderId: String(orderId),
    //         bankTxnId: String(payment.bankTxnId),
    //         gatewayName: String(payment.gatewayName),
    //         txnDate: payment.txnDate,
    //         remarks: String(payment.remarks),
    //         createdAt: new Date(),
    //         updatedAt: new Date(),
    //         id: Number(payment.id),
    //     })
    //     .returning();

    // await db
    //     .update(applicationFormModel)
    //     .set({ formStatus: "PAYMENT_SUCCESS" })
    //     .where(eq(applicationFormModel.id, newPayment.applicationFormId));

    return {
        payment: null,
        message: "New Payment Created!",
    };
}

// READ by ID
export async function findPaymentById(id: number) {
    const [payment] = await db
        .select()
        .from(paymentModel)
        .where(eq(paymentModel.id, id));

    return payment || null;
}

// READ by Application Form ID (single)
export async function findPaymentInfoByApplicationFormId(applicationFormId: number) {
    const [foundPayment] = await db
        .select()
        .from(paymentModel)
        .where(eq(paymentModel.applicationFormId, applicationFormId));

    return foundPayment;
}

// READ by Application Form ID (all)
export async function findPaymentsByApplicationFormId(applicationFormId: number) {
    return await db
        .select()
        .from(paymentModel)
        .where(eq(paymentModel.applicationFormId, applicationFormId));
}

// UPDATE
export async function updatePayment(payment: Payment) {
    if (!payment.id) throw new Error("Payment ID is required for update.");

    // const [updatedPayment] = await db
    //     .update(paymentModel)
    //     .set(payment)
    //     .where(eq(paymentModel.id, payment.id))
    //     .returning();

    return null;
}

// DELETE
export async function deletePayment(id: number) {
    const deleted = await db
        .delete(paymentModel)
        .where(eq(paymentModel.id, id))
        .returning();

    return deleted.length > 0;
}

// Generate Unique Order ID
export async function generateOrderId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `ORD-${timestamp}-${randomPart}`;
}
