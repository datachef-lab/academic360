import { db } from "@/db/index.js";
import { feeStudentMappingModel } from "@repo/db/schemas/models/fees";
import { paymentModel } from "@repo/db/schemas/models/payments";
import { studentModel } from "@repo/db/schemas/models/user";
import { userModel } from "@repo/db/schemas/models/user/user.model";
import { familyModel } from "@repo/db/schemas/models/user";
import { personModel } from "@repo/db/schemas/models/user/person.model";
import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getFeeStudentMappingById } from "@/features/fees/services/fee-student-mapping.service.js";
import { findPaymentByOrderId } from "./payment.service.js";

function normalizeReceiptNumber(input: string): string {
  return String(input || "")
    .trim()
    .replace(/\s+/g, "")
    .replace(/-/g, "/")
    .replace(/\/+/g, "/")
    .toUpperCase();
}

export type FeePaymentMarkingLoadedRecord = {
  mapping: Awaited<ReturnType<typeof getFeeStudentMappingById>>;
  student: { id: number; uid: string; userId: number | null };
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    fatherName: string | null;
  };
  paymentEntry: {
    id: number;
    status: string;
    amount: number;
    paymentMode: string | null;
    isManualEntry: boolean;
    remarks: string | null;
    txnDate: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    recordedBy: { id: number; name: string; image: string | null } | null;
  } | null;
};

async function getPaymentEntryForMarking(paymentId?: number | null) {
  if (!paymentId) return null;
  const [payment] = await db
    .select({
      id: paymentModel.id,
      status: paymentModel.status,
      amount: paymentModel.amount,
      paymentMode: paymentModel.paymentMode,
      isManualEntry: paymentModel.isManualEntry,
      remarks: paymentModel.remarks,
      txnDate: paymentModel.txnDate,
      createdAt: paymentModel.createdAt,
      updatedAt: paymentModel.updatedAt,
      recordedById: paymentModel.recordedBy,
    })
    .from(paymentModel)
    .where(eq(paymentModel.id, paymentId));
  if (!payment?.id) return null;

  const [recordedBy] = payment.recordedById
    ? await db
        .select({
          id: userModel.id,
          name: userModel.name,
          image: userModel.image,
        })
        .from(userModel)
        .where(eq(userModel.id, payment.recordedById))
    : [null];

  return {
    id: payment.id,
    status: payment.status,
    amount: Number(payment.amount ?? 0),
    paymentMode: payment.paymentMode ?? null,
    isManualEntry: Boolean(payment.isManualEntry),
    remarks: payment.remarks ?? null,
    txnDate: payment.txnDate ?? null,
    createdAt: payment.createdAt ?? null,
    updatedAt: payment.updatedAt ?? null,
    recordedBy: recordedBy
      ? {
          id: recordedBy.id,
          name: recordedBy.name,
          image: recordedBy.image ?? null,
        }
      : null,
  };
}

export async function loadFeePaymentMarkingByReceiptNumber(params: {
  receiptNumber: string;
}): Promise<
  | { success: true; data: FeePaymentMarkingLoadedRecord }
  | { success: false; error: string }
> {
  const receiptNumber = normalizeReceiptNumber(params.receiptNumber);
  if (!receiptNumber)
    return { success: false, error: "receiptNumber is required" };

  // NOTE: `fee_student_mappings.receipt_number` exists in DB, but the Drizzle column
  // mapping for `receiptNumber` is not snake-cased. Use a raw SQL lookup to avoid
  // changing the model definition.
  const { rows } = await db.execute<{ id: number; studentId: number }>(sql`
    SELECT id, student_id_fk as "studentId"
    FROM public.fee_student_mappings
    WHERE upper(replace(trim(receipt_number), '-', '/')) = ${receiptNumber}
    LIMIT 1
  `);
  const row = rows?.[0];

  if (!row?.id) return { success: false, error: "Fee challan not found" };

  const mapping = await getFeeStudentMappingById(row.id);
  if (!mapping) return { success: false, error: "Fee challan not found" };

  const [student] = await db
    .select({
      id: studentModel.id,
      uid: studentModel.uid,
      userId: studentModel.userId,
    })
    .from(studentModel)
    .where(eq(studentModel.id, row.studentId));
  if (!student?.id)
    return { success: false, error: "Student not found for challan" };

  const [user] = student.userId
    ? await db
        .select({
          id: userModel.id,
          name: userModel.name,
          email: userModel.email,
          phone: userModel.phone,
        })
        .from(userModel)
        .where(eq(userModel.id, student.userId))
    : [null];

  // Fetch father's name from family > person relationship, fallback to mother if not found
  const [fatherRecord] = student.userId
    ? await db
        .select({
          fatherName: personModel.name,
        })
        .from(personModel)
        .innerJoin(familyModel, eq(personModel.familyId, familyModel.id))
        .where(
          and(
            eq(familyModel.userId, student.userId),
            eq(personModel.type, "FATHER"),
          ),
        )
        .limit(1)
    : [null];

  // If no father, fetch mother's name
  const [motherRecord] =
    !fatherRecord && student.userId
      ? await db
          .select({
            fatherName: personModel.name,
          })
          .from(personModel)
          .innerJoin(familyModel, eq(personModel.familyId, familyModel.id))
          .where(
            and(
              eq(familyModel.userId, student.userId),
              eq(personModel.type, "MOTHER"),
            ),
          )
          .limit(1)
      : [null];

  const parentName =
    fatherRecord?.fatherName ?? motherRecord?.fatherName ?? null;

  const paymentEntry = await getPaymentEntryForMarking(
    mapping?.paymentId ?? null,
  );

  return {
    success: true,
    data: {
      mapping,
      student: {
        id: student.id,
        uid: student.uid,
        userId: student.userId ?? null,
      },
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone ?? null,
            fatherName: parentName,
          }
        : { id: 0, name: "-", email: "-", phone: null, fatherName: null },
      paymentEntry,
    },
  };
}

export async function receiveCashFeePayment(params: {
  receiptNumber: string;
  receiptDateIso: string; // required
  remarks?: string;
  recordedByUserId: number;
}): Promise<
  | { success: true; data: FeePaymentMarkingLoadedRecord }
  | { success: false; error: string }
> {
  const receiptNumber = normalizeReceiptNumber(params.receiptNumber);
  const receiptDateIso = String(params.receiptDateIso || "").trim();
  if (!receiptNumber)
    return { success: false, error: "receiptNumber is required" };
  if (!receiptDateIso)
    return { success: false, error: "receiptDate is required" };
  if (!params.recordedByUserId)
    return { success: false, error: "recordedByUserId is required" };

  const { rows } = await db.execute<{
    id: number;
    studentId: number;
    totalPayable: number | null;
    paymentId: number | null;
  }>(sql`
    SELECT
      id,
      student_id_fk as "studentId",
      total_payable as "totalPayable",
      payment_id_fk as "paymentId"
    FROM public.fee_student_mappings
    WHERE upper(replace(trim(receipt_number), '-', '/')) = ${receiptNumber}
    LIMIT 1
  `);
  const row = rows?.[0];

  if (!row?.id) return { success: false, error: "Fee challan not found" };

  const totalPayable = Number(row.totalPayable ?? 0);
  const amountToRecord = Number.isFinite(totalPayable) ? totalPayable : 0;

  await db.transaction(async (tx) => {
    // Ensure userId for payment.
    const [student] = await tx
      .select({ userId: studentModel.userId })
      .from(studentModel)
      .where(eq(studentModel.id, row.studentId));

    const existingPaymentId = row.paymentId ?? null;
    let paymentId = existingPaymentId;

    if (existingPaymentId) {
      await tx
        .update(paymentModel)
        .set({
          userId: student?.userId ?? undefined,
          context: "FEE",
          amount: amountToRecord,
          paymentMode: "CASH",
          paymentGatewayVendor: null,
          paymentOption: null,
          status: "SUCCESS",
          isManualEntry: true,
          recordedBy: params.recordedByUserId,
          remarks: params.remarks ?? null,
          txnDate: receiptDateIso,
        })
        .where(eq(paymentModel.id, existingPaymentId));
    } else {
      const [created] = await tx
        .insert(paymentModel)
        .values({
          userId: student?.userId ?? undefined,
          context: "FEE",
          amount: amountToRecord,
          paymentMode: "CASH",
          paymentGatewayVendor: null,
          paymentOption: null,
          status: "SUCCESS",
          orderId: null,
          isManualEntry: true,
          recordedBy: params.recordedByUserId,
          remarks: params.remarks ?? null,
          txnDate: receiptDateIso,
          gatewayResponse: {
            meta: { feeStudentMappingId: row.id },
            cash: { receiptNumber, receiptDateIso },
          },
        })
        .returning();
      paymentId = created?.id ?? null;
    }

    await tx
      .update(feeStudentMappingModel)
      .set({
        amountPaid: amountToRecord,
        paymentId: paymentId ?? undefined,
      })
      .where(eq(feeStudentMappingModel.id, row.id));
  });

  const reloaded = await loadFeePaymentMarkingByReceiptNumber({
    receiptNumber,
  });
  if (!reloaded.success) return reloaded;
  return { success: true, data: reloaded.data };
}

export async function loadFeePaymentMarkingByOrderId(params: {
  orderId: string;
}): Promise<
  | { success: true; data: FeePaymentMarkingLoadedRecord }
  | { success: false; error: string }
> {
  const orderId = String(params.orderId || "").trim();
  if (!orderId) return { success: false, error: "orderId is required" };

  const payment = await findPaymentByOrderId(orderId);
  if (!payment?.id) return { success: false, error: "Payment not found" };

  // IMPORTANT: For marking UI, we only consider an orderId "found" if the mapping
  // is already linked via `fee_student_mappings.payment_id_fk`. Do not fall back to
  // gatewayResponse.meta since that can point to mappings not yet linked.
  const [mappingRow] = await db
    .select({
      id: feeStudentMappingModel.id,
      studentId: feeStudentMappingModel.studentId,
    })
    .from(feeStudentMappingModel)
    .where(eq(feeStudentMappingModel.paymentId, payment.id));
  if (!mappingRow?.id)
    return { success: false, error: "Fee mapping not found for payment" };

  const mapping = await getFeeStudentMappingById(mappingRow.id);
  if (!mapping)
    return { success: false, error: "Fee mapping not found for payment" };

  const studentId = mappingRow.studentId ?? mapping.studentId;
  const [student] = await db
    .select({
      id: studentModel.id,
      uid: studentModel.uid,
      userId: studentModel.userId,
    })
    .from(studentModel)
    .where(eq(studentModel.id, studentId));
  if (!student?.id)
    return { success: false, error: "Student not found for payment" };

  const [user] = student.userId
    ? await db
        .select({
          id: userModel.id,
          name: userModel.name,
          email: userModel.email,
          phone: userModel.phone,
        })
        .from(userModel)
        .where(eq(userModel.id, student.userId))
    : [null];

  // Fetch father's name from family > person relationship, fallback to mother if not found
  const [fatherRecord] = student.userId
    ? await db
        .select({
          fatherName: personModel.name,
        })
        .from(personModel)
        .innerJoin(familyModel, eq(personModel.familyId, familyModel.id))
        .where(
          and(
            eq(familyModel.userId, student.userId),
            eq(personModel.type, "FATHER"),
          ),
        )
        .limit(1)
    : [null];

  // If no father, fetch mother's name
  const [motherRecord] =
    !fatherRecord && student.userId
      ? await db
          .select({
            fatherName: personModel.name,
          })
          .from(personModel)
          .innerJoin(familyModel, eq(personModel.familyId, familyModel.id))
          .where(
            and(
              eq(familyModel.userId, student.userId),
              eq(personModel.type, "MOTHER"),
            ),
          )
          .limit(1)
      : [null];

  const parentName =
    fatherRecord?.fatherName ?? motherRecord?.fatherName ?? null;

  const paymentEntry = await getPaymentEntryForMarking(payment.id);

  return {
    success: true,
    data: {
      mapping,
      student: {
        id: student.id,
        uid: student.uid,
        userId: student.userId ?? null,
      },
      user: user
        ? {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone ?? null,
            fatherName: parentName,
          }
        : { id: 0, name: "-", email: "-", phone: null, fatherName: null },
      paymentEntry,
    },
  };
}

export async function markOnlineFeePaymentSuccessManual(params: {
  orderId: string;
  remarks?: string;
  recordedByUserId: number;
}): Promise<
  | { success: true; data: FeePaymentMarkingLoadedRecord }
  | { success: false; error: string }
> {
  const orderId = String(params.orderId || "").trim();
  if (!orderId) return { success: false, error: "orderId is required" };
  if (!params.recordedByUserId)
    return { success: false, error: "recordedByUserId is required" };

  const payment = await findPaymentByOrderId(orderId);
  if (!payment?.id) return { success: false, error: "Payment not found" };

  await db.transaction(async (tx) => {
    await tx
      .update(paymentModel)
      .set({
        status: "SUCCESS",
        isManualEntry: true,
        recordedBy: params.recordedByUserId,
        remarks: params.remarks ?? payment.remarks ?? null,
      })
      .where(
        and(eq(paymentModel.id, payment.id), eq(paymentModel.context, "FEE")),
      );

    const [mapping] = await tx
      .select()
      .from(feeStudentMappingModel)
      .where(eq(feeStudentMappingModel.paymentId, payment.id));

    if (mapping?.id) {
      const totalPayable = Number(mapping.totalPayable ?? 0);
      const amountToSet = Number.isFinite(totalPayable) ? totalPayable : 0;
      await tx
        .update(feeStudentMappingModel)
        .set({ amountPaid: amountToSet, paymentId: payment.id })
        .where(eq(feeStudentMappingModel.id, mapping.id));
    }
  });

  const reloaded = await loadFeePaymentMarkingByOrderId({ orderId });
  if (!reloaded.success) return reloaded;
  return { success: true, data: reloaded.data };
}
