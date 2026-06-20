import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { eq } from "drizzle-orm";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { paymentModel } from "@repo/db/schemas/models/payments/payment.model.js";
import { emitLibraryNotification } from "@/features/library/services/library-notifications.service.js";

export type FinePaymentInitResult = {
  paymentId: number;
  orderId: string;
  amount: number;
  context: "LIBRARY_FINE";
};

export async function initiateLibraryFinePayment(
  circulationId: number,
  userId: number,
): Promise<FinePaymentInitResult> {
  const [circulation] = await db
    .select({
      id: bookCirculationModel.id,
      userId: bookCirculationModel.userId,
      fineAmount: bookCirculationModel.fineAmount,
      fineWaiver: bookCirculationModel.fineWaiver,
      paymentId: bookCirculationModel.paymentId,
    })
    .from(bookCirculationModel)
    .where(eq(bookCirculationModel.id, circulationId))
    .limit(1);

  if (!circulation) {
    throw new ApiError(404, "Circulation record not found.");
  }
  if (circulation.userId !== userId) {
    throw new ApiError(403, "Circulation record does not belong to this user.");
  }
  if (circulation.paymentId != null) {
    throw new ApiError(409, "Fine already has a payment recorded.");
  }
  const due = circulation.fineAmount - circulation.fineWaiver;
  if (due <= 0) {
    throw new ApiError(409, "No outstanding fine to pay.");
  }

  const orderId = `LIBFINE_${circulation.id}_${Date.now()}`;
  const [payment] = await db
    .insert(paymentModel)
    .values({
      userId,
      context: "LIBRARY_FINE",
      amount: due,
      status: "PENDING",
      paymentMode: "ONLINE",
      orderId,
    })
    .returning({ id: paymentModel.id });

  return {
    paymentId: payment.id,
    orderId,
    amount: due,
    context: "LIBRARY_FINE",
  };
}

export async function settleLibraryFinePayment(
  paymentId: number,
  status: "SUCCESS" | "FAILED",
): Promise<void> {
  const [payment] = await db
    .select({
      id: paymentModel.id,
      userId: paymentModel.userId,
      orderId: paymentModel.orderId,
      amount: paymentModel.amount,
    })
    .from(paymentModel)
    .where(eq(paymentModel.id, paymentId))
    .limit(1);
  if (!payment) throw new ApiError(404, "Payment not found.");

  const orderId = payment.orderId ?? "";
  const match = /^LIBFINE_(\d+)_/.exec(orderId);
  const circulationId = match ? Number(match[1]) : null;

  await db.transaction(async (tx) => {
    await tx
      .update(paymentModel)
      .set({ status, updatedAt: new Date() })
      .where(eq(paymentModel.id, paymentId));
    if (status === "SUCCESS" && circulationId) {
      await tx
        .update(bookCirculationModel)
        .set({ paymentId, updatedAt: new Date() })
        .where(eq(bookCirculationModel.id, circulationId));
    }
  });

  if (status === "SUCCESS" && payment.userId) {
    await emitLibraryNotification({
      event: "LIBRARY_FINE_PAID",
      userId: payment.userId,
      variables: {
        circulationId,
        amount: payment.amount,
        paymentId,
      },
    });
  }
}
