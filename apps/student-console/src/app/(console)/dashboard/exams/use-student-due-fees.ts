"use client";

import { useEffect, useMemo, useState } from "react";
import { axiosInstance } from "@/lib/utils";

/**
 * Minimal slice of the fee-student-mapping contract returned by
 * `GET /api/v1/fees/student-mappings/student/{studentId}` — only the fields the
 * exam-page "fees due" alert needs. Mirrors `FeeMapping` in the Enrolment & Fees page.
 */
export type StudentDueFee = {
  id: number;
  totalPayable: number;
  amountPaid: number;
  paymentStatus: string;
  type?: "FULL" | "INSTALLMENT";
  feeStructureInstallment?: {
    name?: string | null;
    sequence?: number | null;
  } | null;
  feeStructure?: {
    receiptType?: { name?: string | null } | null;
    class?: { name?: string | null } | null;
    academicYear?: { year?: string | null } | null;
  } | null;
};

// Same "paid" rule the Enrolment & Fees page uses (isMappingPaid): a mapping counts as
// settled only when its payment status is COMPLETED or SUCCESS.
const isPaid = (m: StudentDueFee): boolean => {
  const status = String(m?.paymentStatus ?? "").toUpperCase();
  return status === "COMPLETED" || status === "SUCCESS";
};

// Casual (appear-type) receipts are excluded from this exam reminder — they are not part
// of the regular semester dues we nudge students to clear before their exam. The receipt
// named "Casual Fees" maps 1:1 to the CASUAL appear type (promotion_status.type).
export const isCasualReceipt = (m: StudentDueFee): boolean =>
  String(m?.feeStructure?.receiptType?.name ?? "")
    .toLowerCase()
    .includes("casual");

/**
 * Fetches the student's fee mappings and returns only the ones still DUE
 * (payable > 0 and not paid), plus the total outstanding amount.
 *
 * @param studentId  logged-in student's id (from `useStudent()`)
 * @param refreshKey optional value that, when it changes, re-fetches (e.g. the
 *                   fee-socket `feeMappingsVersion`)
 */
export function useStudentDueFees(studentId?: number, refreshKey?: unknown) {
  const [dueFees, setDueFees] = useState<StudentDueFee[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) {
      setDueFees([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get<{ payload?: StudentDueFee[] }>(
          `/api/v1/fees/student-mappings/student/${studentId}`,
        );
        const rows = Array.isArray(data?.payload) ? data.payload : [];
        if (!cancelled) {
          setDueFees(
            rows.filter((m) => Number(m.totalPayable) > 0 && !isPaid(m) && !isCasualReceipt(m)),
          );
        }
      } catch {
        // Never block opening the exam schedule because the fees lookup failed.
        if (!cancelled) setDueFees([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, refreshKey]);

  const totalDue = useMemo(
    () => dueFees.reduce((sum, m) => sum + Number(m.totalPayable || 0), 0),
    [dueFees],
  );

  return { dueFees, totalDue, loading };
}
