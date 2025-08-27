import {dbPostgres} from "@/db";
import { payments, Payment, applicationForms } from "@/db/schema";
import { eq } from "drizzle-orm";

// ✅ Create
export async function createPayment(payment: Payment) {
    const orderId = await generateOrderId();

    const [newPayment] = await dbPostgres
        .insert(payments)
        .values({
            ...payment,
            orderId,
        })
        .returning();

    await dbPostgres
        .update(applicationForms)
        .set({ formStatus: "PAYMENT_SUCCESS" })
        .where(eq(applicationForms.id, newPayment.applicationFormId));

    return {
        payment: newPayment,
        message: "New Payment Created!",
    };
}


// ✅ Read by ID
export async function findPaymentById(id: number) {
    const [payment] = await dbPostgres
        .select()
        .from(payments)
        .where(eq(payments.id, id));

    return payment || null;
}

// ✅ Read by ID
export async function findPaymentInfoByApplicationFormId(applicationFormId: number) {
    const [foundPayments] = await dbPostgres
        .select()
        .from(payments)
        .where(eq(payments.applicationFormId, applicationFormId));

    return foundPayments;
}

// ✅ Read by Application Form ID
export async function findPaymentsByApplicationFormId(applicationFormId: number) {
    return await dbPostgres
        .select()
        .from(payments)
        .where(eq(payments.applicationFormId, applicationFormId));
}

// ✅ Update
export async function updatePayment(payment: Payment) {
    if (!payment.id) throw new Error("Payment ID is required for update.");

    const [updatedPayment] = await dbPostgres
        .update(payments)
        .set(payment)
        .where(eq(payments.id, payment.id))
        .returning();

    return updatedPayment;
}

// ✅ Delete
export async function deletePayment(id: number) {
    const deleted = await dbPostgres
        .delete(payments)
        .where(eq(payments.id, id));

    return deleted.length > 0;
}

// ✅ Generate Unique Order ID
export async function generateOrderId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 10);
    return `ORD-${timestamp}-${randomPart}`;
}
