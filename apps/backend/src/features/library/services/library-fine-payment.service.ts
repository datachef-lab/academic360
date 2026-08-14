import { db } from "@/db/index.js";
import { ApiError } from "@/utils/ApiError.js";
import { eq } from "drizzle-orm";
import { bookCirculationModel } from "@repo/db/schemas/models/library/book-circulation.model.js";
import { libraryFineMappingModel } from "@repo/db/schemas/models/library/library-fine-mapping.model.js";
import { paymentModel } from "@repo/db/schemas/models/payments/payment.model.js";
import { userModel } from "@repo/db/schemas/models/user/user.model.js";
import { emitLibraryNotification } from "@/features/library/services/library-notifications.service.js";
import { createPaytmTxnToken } from "@/features/payments/services/paytm-payment.service.js";
import { attachPaytmTxnTokenToPayment } from "@/features/payments/services/payment.service.js";

export type FinePaymentInitResult = {
  paymentId: number;
  orderId: string;
  amount: number;
  context: "LIBRARY_FINE";
  // Present when Paytm is configured; absent means desk-side settle only.
  txnToken: string | null;
  gatewayError: string | null;
};

type FineLedgerRow = {
  circulationId: number;
  userId: number;
  mappingId: number | null;
  fineAmount: number;
  waivedAmount: number;
  amountPaid: number;
  paymentId: number | null;
};

async function loadFineLedgerRow(
  circulationId: number,
): Promise<FineLedgerRow | null> {
  const [row] = await db
    .select({
      circulationId: bookCirculationModel.id,
      userId: bookCirculationModel.userId,
      circulationFineAmount: bookCirculationModel.fineAmount,
      circulationFineWaiver: bookCirculationModel.fineWaiver,
      circulationPaymentId: bookCirculationModel.paymentId,
      mappingId: libraryFineMappingModel.id,
      mappingFineAmount: libraryFineMappingModel.fineAmount,
      mappingWaivedAmount: libraryFineMappingModel.waivedAmount,
      mappingAmountPaid: libraryFineMappingModel.amountPaid,
      mappingPaymentId: libraryFineMappingModel.paymentId,
    })
    .from(bookCirculationModel)
    .leftJoin(
      libraryFineMappingModel,
      eq(libraryFineMappingModel.bookCirculationId, bookCirculationModel.id),
    )
    .where(eq(bookCirculationModel.id, circulationId))
    .limit(1);
  if (!row) return null;
  // The ledger is authoritative once a row exists; circulation columns cover
  // rows minted before the ledger (legacy mirror data).
  const hasLedger = row.mappingId != null;
  return {
    circulationId: row.circulationId,
    userId: row.userId,
    mappingId: row.mappingId,
    fineAmount: hasLedger ? row.mappingFineAmount! : row.circulationFineAmount,
    waivedAmount: hasLedger
      ? row.mappingWaivedAmount!
      : row.circulationFineWaiver,
    amountPaid: hasLedger ? row.mappingAmountPaid! : 0,
    paymentId: hasLedger
      ? (row.mappingPaymentId ?? row.circulationPaymentId)
      : row.circulationPaymentId,
  };
}

function outstandingOf(row: FineLedgerRow): number {
  return row.fineAmount - row.waivedAmount - row.amountPaid;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Links a successful payment on both the ledger (creating it for legacy rows) and the circulation mirror. */
async function linkPaymentToFine(
  tx: Tx,
  row: FineLedgerRow,
  paymentId: number,
  amount: number,
): Promise<void> {
  await tx
    .insert(libraryFineMappingModel)
    .values({
      bookCirculationId: row.circulationId,
      userId: row.userId,
      fineAmount: row.fineAmount,
      waivedAmount: row.waivedAmount,
      amountPaid: amount,
      paymentId,
    })
    .onConflictDoUpdate({
      target: libraryFineMappingModel.bookCirculationId,
      set: {
        amountPaid: amount,
        paymentId,
        updatedAt: new Date(),
      },
    });
  await tx
    .update(bookCirculationModel)
    .set({ paymentId, updatedAt: new Date() })
    .where(eq(bookCirculationModel.id, row.circulationId));
}

export async function initiateLibraryFinePayment(
  circulationId: number,
  userId: number,
): Promise<FinePaymentInitResult> {
  const row = await loadFineLedgerRow(circulationId);
  if (!row) {
    throw new ApiError(404, "Circulation record not found.");
  }
  if (row.userId !== userId) {
    throw new ApiError(403, "Circulation record does not belong to this user.");
  }
  if (row.paymentId != null) {
    throw new ApiError(409, "Fine already has a payment recorded.");
  }
  const due = outstandingOf(row);
  if (due <= 0) {
    throw new ApiError(409, "No outstanding fine to pay.");
  }

  const orderId = `LIBFINE_${row.circulationId}_${Date.now()}`;
  const [payment] = await db
    .insert(paymentModel)
    .values({
      userId,
      context: "LIBRARY_FINE",
      amount: due,
      status: "PENDING",
      paymentMode: "ONLINE",
      paymentGatewayVendor: "PAYTM",
      orderId,
    })
    .returning({ id: paymentModel.id });

  // Best-effort Paytm token: without it (gateway not configured, localhost
  // callback, outage) the desk can still settle manually.
  const [patron] = await db
    .select({
      name: userModel.name,
      email: userModel.email,
      phone: userModel.phone,
    })
    .from(userModel)
    .where(eq(userModel.id, userId))
    .limit(1);
  const tokenResult = await createPaytmTxnToken({
    orderId,
    amount: String(due),
    custId: String(userId),
    email: patron?.email?.trim(),
    mobile: patron?.phone?.trim(),
    firstName: patron?.name?.trim()?.split(" ")[0],
    lastName: patron?.name?.trim()?.split(" ").slice(1).join(" ") || undefined,
  });
  if (tokenResult.success && tokenResult.txnToken) {
    await attachPaytmTxnTokenToPayment({
      orderId,
      txnToken: tokenResult.txnToken,
    });
  }

  return {
    paymentId: payment.id,
    orderId,
    amount: due,
    context: "LIBRARY_FINE",
    txnToken: tokenResult.txnToken ?? null,
    gatewayError: tokenResult.success ? null : (tokenResult.error ?? null),
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
  const row = circulationId ? await loadFineLedgerRow(circulationId) : null;

  await db.transaction(async (tx) => {
    await tx
      .update(paymentModel)
      .set({ status, updatedAt: new Date() })
      .where(eq(paymentModel.id, paymentId));
    if (status === "SUCCESS" && row) {
      await linkPaymentToFine(tx, row, paymentId, payment.amount);
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

/**
 * Desk cash collection — mirrors the fee cash-marking pattern: a SUCCESS CASH
 * payment flagged as a manual entry with the recording staff member, linked to
 * the fine ledger in the same transaction.
 */
export async function recordLibraryFineCashPayment(
  circulationId: number,
  recordedByUserId: number,
  remarks?: string,
): Promise<{ paymentId: number; amount: number }> {
  const row = await loadFineLedgerRow(circulationId);
  if (!row) throw new ApiError(404, "Circulation record not found.");
  if (row.paymentId != null) {
    throw new ApiError(409, "Fine already has a payment recorded.");
  }
  const due = outstandingOf(row);
  if (due <= 0) throw new ApiError(409, "No outstanding fine to pay.");

  const orderId = `LIBFINE_${row.circulationId}_${Date.now()}`;
  let paymentId = 0;
  await db.transaction(async (tx) => {
    const [payment] = await tx
      .insert(paymentModel)
      .values({
        userId: row.userId,
        context: "LIBRARY_FINE",
        amount: due,
        status: "SUCCESS",
        paymentMode: "CASH",
        orderId,
        isManualEntry: true,
        recordedBy: recordedByUserId,
        internalRemarks: remarks?.trim() || "Library fine collected in cash",
      })
      .returning({ id: paymentModel.id });
    paymentId = payment.id;
    await linkPaymentToFine(tx, row, payment.id, due);
  });

  await emitLibraryNotification({
    event: "LIBRARY_FINE_PAID",
    userId: row.userId,
    variables: { circulationId, amount: due, paymentId },
  });
  return { paymentId, amount: due };
}

/**
 * Staff waiver — absolute waived amount on the ledger, mirrored onto the
 * circulation row so every existing net-fine read stays correct.
 */
export async function waiveLibraryFine(
  circulationId: number,
  waivedByUserId: number,
  amount: number,
  remarks?: string,
): Promise<void> {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new ApiError(400, "Waiver amount must be a non-negative number.");
  }
  const row = await loadFineLedgerRow(circulationId);
  if (!row) throw new ApiError(404, "Circulation record not found.");
  if (row.paymentId != null) {
    throw new ApiError(
      409,
      "Fine already has a payment recorded; it can no longer be waived.",
    );
  }
  if (amount > row.fineAmount) {
    throw new ApiError(
      400,
      `Waiver (${amount}) cannot exceed the fine amount (${row.fineAmount}).`,
    );
  }

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .insert(libraryFineMappingModel)
      .values({
        bookCirculationId: row.circulationId,
        userId: row.userId,
        fineAmount: row.fineAmount,
        waivedAmount: amount,
        waivedByUserId,
        waivedAt: now,
        waiverRemarks: remarks?.trim() || null,
      })
      .onConflictDoUpdate({
        target: libraryFineMappingModel.bookCirculationId,
        set: {
          waivedAmount: amount,
          waivedByUserId,
          waivedAt: now,
          waiverRemarks: remarks?.trim() || null,
          updatedAt: now,
        },
      });
    await tx
      .update(bookCirculationModel)
      .set({
        fineWaiver: amount,
        fineWaivedById: waivedByUserId,
        fineWaivedAt: now,
        fineRemarks: remarks?.trim() || null,
        updatedAt: now,
      })
      .where(eq(bookCirculationModel.id, row.circulationId));
  });
}
