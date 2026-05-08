import { eq } from "drizzle-orm";
import { db } from "@/db/index.js";
import {
  academicYearModel,
  classModel,
  feeStructureModel,
  feeStudentMappingModel,
  notificationMasterModel,
  receiptTypeModel,
  studentModel,
  userModel,
} from "@repo/db/schemas";
import { enqueueNotification } from "@/services/notificationClient.js";

const DEFAULT_COLLEGE_LOGO_URL =
  "https://besc.academic360.app/api/api/v1/settings/file/4";

/**
 * Base URL for links inside emails (must reach the Express app that serves
 * `GET /api/v1/fees/receipts`). Prefer a public host in production.
 *
 * Precedence: `API_PUBLIC_ORIGIN` → `BACKEND_PUBLIC_URL` → `BACKEND_URL` →
 * `http://localhost:${PORT}` (PORT defaults like `app.ts`).
 */
function getApiPublicOrigin(): string {
  for (const key of [
    "API_PUBLIC_ORIGIN",
    "BACKEND_PUBLIC_URL",
    "BACKEND_URL",
  ]) {
    const v = process.env[key];
    console.log(key, v);
    if (v && String(v).trim()) {
      return String(v).trim().replace(/\/$/, "");
    }
  }
  const port = process.env.PORT || "8080";
  return `http://localhost:${port}`;
}

export function buildPaidFeeReceiptPdfUrl(receiptNumber: string): string {
  const q = encodeURIComponent(String(receiptNumber || "").trim());
  return `${getApiPublicOrigin()}/api/v1/fees/receipts?challanNumber=${q}`;
}

/** "SEMESTER III" / "semester iii" → "Semester III" (roman numeral casing preserved). */
function sentenceCaseSemesterWord(
  className: string | null | undefined,
): string {
  const s = String(className ?? "").trim();
  if (!s) return "";
  return s.replace(/\bsemester\b/gi, "Semester");
}

function formatChallanDate(iso: string | Date | null | undefined): string {
  if (iso == null || iso === "") return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export type FeeReceiptEmailRow = {
  userId: number;
  studentId: number;
  name: string | null;
  receiptType: string | null;
  academicYear: string | null;
  className: string | null;
  email: string | null;
  phone: string | null;
  receiptNumber: string | null;
  challanGeneratedAt: Date | null;
};

export async function loadFeeReceiptEmailRowByPaymentId(
  paymentId: number,
): Promise<FeeReceiptEmailRow | null> {
  const [row] = await db
    .select({
      userId: userModel.id,
      studentId: studentModel.id,
      name: userModel.name,
      receiptType: receiptTypeModel.name,
      academicYear: academicYearModel.year,
      className: classModel.name,
      email: userModel.email,
      phone: userModel.phone,
      receiptNumber: feeStudentMappingModel.receiptNumber,
      challanGeneratedAt: feeStudentMappingModel.challanGeneratedAt,
    })
    .from(feeStudentMappingModel)
    .innerJoin(
      studentModel,
      eq(feeStudentMappingModel.studentId, studentModel.id),
    )
    .innerJoin(userModel, eq(userModel.id, studentModel.userId))
    .leftJoin(
      feeStructureModel,
      eq(feeStructureModel.id, feeStudentMappingModel.feeStructureId),
    )
    .leftJoin(
      receiptTypeModel,
      eq(receiptTypeModel.id, feeStructureModel.receiptTypeId),
    )
    .leftJoin(
      academicYearModel,
      eq(academicYearModel.id, feeStructureModel.academicYearId),
    )
    .leftJoin(classModel, eq(classModel.id, feeStructureModel.classId))
    .where(eq(feeStudentMappingModel.paymentId, paymentId))
    .limit(1);

  return row ?? null;
}

function getEnvSubjectPrefix(): string {
  const env = (process.env.NODE_ENV ?? "").trim().toLowerCase();
  if (env === "development") return "[DEV] ";
  if (env === "staging") return "[STAGE] ";
  return "";
}

function buildFeeReceiptSubject(row: FeeReceiptEmailRow): string {
  const prefix = getEnvSubjectPrefix();
  const type = String(row.receiptType ?? "fee").trim() || "fee";
  const year = String(row.academicYear ?? "").trim();
  const classLabel = sentenceCaseSemesterWord(row.className);
  if (classLabel && year) {
    return `${prefix}Your paid challan (${type}) for ${classLabel}, Year ${year}`;
  }
  if (classLabel) {
    return `${prefix}Your paid challan (${type}) for ${classLabel}`;
  }
  if (year) {
    return `${prefix}Your paid challan (${type}) for Year ${year}`;
  }
  return `${prefix}Your paid challan (${type})`;
}

/**
 * Queues the fee-receipt email after payment success (Paytm callback or manual marking).
 * Call after `ensureFeeReceiptAfterSuccessfulFeePayment` so receipt/challan fields exist.
 */
export async function sendFeeReceiptEmailForPaymentId(
  paymentId: number,
): Promise<void> {
  const row = await loadFeeReceiptEmailRowByPaymentId(paymentId);
  if (!row) {
    console.warn(
      "[fee-receipt] No fee mapping / user row for paymentId; skip email",
      paymentId,
    );
    return;
  }
  if (!row.userId || !String(row.email ?? "").trim()) {
    console.warn("[fee-receipt] Missing user or email; skip email", paymentId);
    return;
  }
  if (!String(row.receiptNumber ?? "").trim()) {
    console.warn(
      "[fee-receipt] Missing receipt/challan number; skip email",
      paymentId,
    );
    return;
  }

  const [master] = await db
    .select({ id: notificationMasterModel.id })
    .from(notificationMasterModel)
    .where(eq(notificationMasterModel.template, "fee-receipt"))
    .limit(1);

  if (!master?.id) {
    console.error(
      "[fee-receipt] Notification master named 'fee-receipt' not found; skip email",
    );
    return;
  }

  const receiptNumber = String(row.receiptNumber).trim();
  const subject = buildFeeReceiptSubject(row);
  const paidChallanPdfUrl = buildPaidFeeReceiptPdfUrl(receiptNumber);
  const challanGeneratedAtIso = row.challanGeneratedAt
    ? row.challanGeneratedAt.toISOString()
    : "";
  const challanGeneratedAtLabel = formatChallanDate(row.challanGeneratedAt);

  try {
    await enqueueNotification({
      userId: row.userId,
      variant: "EMAIL",
      type: "FEE",
      message: "Fee Receipt",
      notificationMasterId: master.id,
      notificationEvent: {
        subject,
        templateData: {
          subject,
          name: row.name ?? "",
          email: row.email ?? "",
          phone: row.phone ?? "",
          receiptNumber,
          receiptType: row.receiptType ?? "",
          academicYear: row.academicYear ?? "",
          className: sentenceCaseSemesterWord(row.className),
          challanGeneratedAt: challanGeneratedAtIso,
          challanGeneratedAtLabel,
          paidChallanPdfUrl,
          collegeLogoUrl: DEFAULT_COLLEGE_LOGO_URL,
          institutionShort: "BESC",
        },
      },
    });
  } catch (err) {
    console.error(
      "[fee-receipt] Failed to enqueue receipt email (payment saved; notify service may be down)",
      { paymentId, err },
    );
  }
}
