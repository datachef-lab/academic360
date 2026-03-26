import { db } from "@/db/index.js";
import { paymentModel } from "@repo/db/schemas/models/payments";
import { feeStudentMappingModel } from "@repo/db/schemas";
import { applicationFormModel } from "@/features/admissions/models/application-form.model.js";
import { eq } from "drizzle-orm";

// CREATE (admission application fee)
export async function createPayment(payment: {
  applicationFormId: number;
  paymentFor: "ADMISSION_APPLICATION_FEE" | "FEE" | "OTHER";
  orderId: string;
  amount: string;
  gatewayName?: string;
}) {
  const [newPayment] = await db
    .insert(paymentModel)
    .values({
      applicationFormId: payment.applicationFormId,
      paymentFor: payment.paymentFor,
      orderId: payment.orderId,
      amount: payment.amount,
      gatewayName: payment.gatewayName ?? "PAYTM",
    })
    .returning();

  return newPayment;
}

// CREATE (student fee)
export async function createFeePayment(payment: {
  feeStudentMappingId: number;
  orderId: string;
  amount: string;
  gatewayName?: string;
  remarks?: string;
}) {
  const [newPayment] = await db
    .insert(paymentModel)
    .values({
      applicationFormId: null,
      feeStudentMappingId: payment.feeStudentMappingId,
      paymentFor: "FEE",
      orderId: payment.orderId,
      amount: payment.amount,
      gatewayName: payment.gatewayName ?? "PAYTM",
      remarks: payment.remarks ?? null,
    })
    .returning();

  return newPayment;
}

// READ by ID
export async function findPaymentById(id: number) {
  const [payment] = await db
    .select()
    .from(paymentModel)
    .where(eq(paymentModel.id, id));

  return payment || null;
}

// READ by Order ID
export async function findPaymentByOrderId(orderId: string) {
  const [payment] = await db
    .select()
    .from(paymentModel)
    .where(eq(paymentModel.orderId, orderId));

  return payment || null;
}

// READ by Application Form ID (single)
export async function findPaymentInfoByApplicationFormId(
  applicationFormId: number,
) {
  const [foundPayment] = await db
    .select()
    .from(paymentModel)
    .where(eq(paymentModel.applicationFormId, applicationFormId));

  return foundPayment;
}

// READ by Application Form ID (all)
export async function findPaymentsByApplicationFormId(
  applicationFormId: number,
) {
  return await db
    .select()
    .from(paymentModel)
    .where(eq(paymentModel.applicationFormId, applicationFormId));
}

// UPDATE payment on success/failure
export async function updatePaymentByOrderId(
  orderId: string,
  updates: {
    status: "SUCCESS" | "FAILED";
    transactionId?: string;
    bankTxnId?: string;
    txnDate?: Date;
    gatewayResponse?: object;
  },
) {
  // First, fetch the existing payment to check for duplicate callbacks
  const [existingPayment] = await db
    .select()
    .from(paymentModel)
    .where(eq(paymentModel.orderId, orderId));

  if (!existingPayment) {
    throw new Error(`Payment not found for orderId: ${orderId}`);
  }

  // If this is a duplicate callback (same transactionId), skip the update
  if (
    existingPayment.transactionId &&
    existingPayment.transactionId === updates.transactionId
  ) {
    console.log(
      `Duplicate payment callback detected for orderId: ${orderId}, skipping update`,
    );
    return existingPayment;
  }

  const dbStatus = updates.status === "SUCCESS" ? "COMPLETED" : "FAILED";
  const [updated] = await db
    .update(paymentModel)
    .set({
      status: updates.status,
      paymentStatus: dbStatus,
      transactionId:
        updates.transactionId ?? existingPayment.transactionId ?? null,
      bankTxnId: updates.bankTxnId ?? existingPayment.bankTxnId ?? null,
      txnDate: updates.txnDate ?? existingPayment.txnDate ?? null,
      gatewayResponse:
        updates.gatewayResponse ?? existingPayment.gatewayResponse ?? null,
    })
    .where(eq(paymentModel.orderId, orderId))
    .returning();

  if (updated?.applicationFormId && updates.status === "SUCCESS") {
    await db
      .update(applicationFormModel)
      .set({ formStatus: "PAYMENT_SUCCESS" })
      .where(eq(applicationFormModel.id, updated.applicationFormId));
  }

  // For FEE payments: update fee_student_mapping on success
  const mappingId = updated?.feeStudentMappingId;
  if (
    updated?.paymentFor === "FEE" &&
    mappingId &&
    updates.status === "SUCCESS"
  ) {
    try {
      const [mapping] = await db
        .select()
        .from(feeStudentMappingModel)
        .where(eq(feeStudentMappingModel.id, mappingId));
      if (mapping) {
        const amountPaid = Number(updated.amount);
        const existingPaid = mapping.amountPaid ?? 0;
        const newTotalPaid = existingPaid + amountPaid;
        const totalPayable = mapping.totalPayable ?? 0;
        const paymentStatus =
          newTotalPaid >= totalPayable ? "COMPLETED" : "PENDING";

        await db
          .update(feeStudentMappingModel)
          .set({
            amountPaid: newTotalPaid,
            paymentStatus,
            paymentMode: "ONLINE",
            transactionRef: updated.transactionId ?? updated.bankTxnId,
            transactionDate: updated.txnDate ?? new Date(),
          })
          .where(eq(feeStudentMappingModel.id, mappingId));
      }
    } catch {
      // Ignore update errors
    }
  }

  return updated ?? null;
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
  return `ORD${timestamp}${randomPart}`;
}
