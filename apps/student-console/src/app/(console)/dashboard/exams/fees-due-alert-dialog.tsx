"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { isCasualReceipt, type StudentDueFee } from "./use-student-due-fees";
import { submitFeeDueDeclaration, type FeeDueDeclaration } from "./use-fee-due-declaration";

const formatInr = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const toISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

interface FeesDueAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dueFees: StudentDueFee[];
  studentId?: number;
  /** DB key for the dues context, e.g. "SEMESTER II" (from dueFeesSemesterContext). */
  semesterLabel: string;
  /** Human form for the "Semester {{X}}" copy, e.g. "II". */
  semesterDisplay: string;
  /** Called after the declaration is saved, so the page can skip the dialog from now on. */
  onDeclared: (declaration: FeeDueDeclaration) => void;
  /** Called when the student clicks "Generate admit card" — opens the Exam Schedule. */
  onProceed: () => void;
}

/**
 * "Important Notification" declaration shown before the Exam Schedule when the student
 * has outstanding semester dues. The student must tick both declarations (the first one
 * includes a clear-by date capped at one month out) before "Generate admit card"
 * unlocks; the declaration is persisted server-side so it is only ever asked once per
 * dues context.
 */
export function FeesDueAlertDialog({
  open,
  onOpenChange,
  dueFees,
  studentId,
  semesterLabel,
  semesterDisplay,
  onDeclared,
  onProceed,
}: FeesDueAlertDialogProps) {
  const router = useRouter();

  const [acknowledgeChecked, setAcknowledgeChecked] = useState(false);
  const [consequenceChecked, setConsequenceChecked] = useState(false);
  const [clearByDate, setClearByDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Date picker window: today .. +1 month (per the notification spec).
  const { minDate, maxDate } = useMemo(() => {
    const now = new Date();
    const max = new Date(now);
    max.setMonth(max.getMonth() + 1);
    return { minDate: toISODate(now), maxDate: toISODate(max) };
  }, []);

  // Belt-and-suspenders: never render casual receipts here, and compute the total from
  // the same visible list so the two always agree (even if upstream data is stale).
  const visibleFees = dueFees.filter((fee) => !isCasualReceipt(fee));
  const totalDue = visibleFees.reduce((sum, fee) => sum + Number(fee.totalPayable || 0), 0);

  const dateValid = clearByDate >= minDate && clearByDate <= maxDate;
  const canGenerate =
    acknowledgeChecked && consequenceChecked && dateValid && !!studentId && !submitting;

  const handleGenerateAdmitCard = async () => {
    if (!canGenerate || !studentId) return;
    setSubmitting(true);
    try {
      const declaration = await submitFeeDueDeclaration({
        studentId,
        semesterLabel,
        undertakingClearDate: clearByDate,
      });
      onDeclared(declaration);
      onProceed();
    } catch {
      toast.error("Could not save your declaration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* Two-column layout: full-height illustration left, content right. Sized
          generously (5xl / ~90vh) so the notification, dues and declaration all
          breathe; the right column scrolls if it ever overflows. */}
      <AlertDialogContent className="max-w-6xl overflow-hidden p-0">
        <div className="flex max-h-[92vh] min-h-[680px] flex-col sm:flex-row">
          {/* Left: illustration shown whole (tightly cropped source, contain — not
              cover). A soft gradient + caption fill the column so the space around
              the square artwork reads as designed, not empty. */}
          <div className="flex w-full flex-shrink-0 flex-col items-center justify-center gap-6 border-b border-gray-200 bg-gradient-to-b from-violet-50 via-white to-rose-50 p-6 sm:w-[38%] sm:border-b-0 sm:border-r sm:p-8">
            <Image
              src={`${process.env.NEXT_PUBLIC_URL}/fee-due-illustration.png`}
              alt="Pending fees illustration"
              width={840}
              height={870}
              priority
              unoptimized
              className="h-auto w-full max-w-[420px]"
            />
            <p className="text-center text-xs leading-relaxed text-gray-500">
              Clear your Semester{" "}
              <span className="font-semibold text-gray-700">{semesterDisplay}</span> dues to stay
              exam-ready.
            </p>
          </div>

          {/* Right: notification + dues + declaration + actions */}
          <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-6 sm:p-8">
            <AlertDialogHeader className="space-y-3 text-left sm:text-left">
              <AlertDialogTitle className="text-xl font-semibold text-rose-700">
                Important Notification:
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3 text-[13px] leading-relaxed text-gray-600">
                <span className="block">
                  As per our records, your Semester{" "}
                  <span className="font-semibold text-gray-800">{semesterDisplay}</span> enrolment
                  fee is not paid despite multiple reminders sent to your Institutional Email ID
                  and/or registered mobile number.{" "}
                  <span className="rounded-sm bg-rose-100/80 px-1 py-0.5 font-semibold text-rose-700">
                    Consequently, you are currently not considered a bonafide student of the
                    College.
                  </span>
                </span>
                <span className="block">
                  Please note that payment of the Semester{" "}
                  <span className="font-semibold text-gray-800">{semesterDisplay}</span> enrolment
                  fee is mandatory to maintain your bonafide student status and to become eligible
                  to appear for the Calcutta University End-Semester Examination.
                </span>
                <span className="block font-medium text-gray-700">
                  Thus, you are advised to clear your outstanding dues at the earliest.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Breakdown of what's due — plain table, no inner scroll so the
                Total row is never clipped (the whole right column scrolls) */}
            {visibleFees.length > 0 && (
              <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full border-collapse text-center text-[13px]">
                  <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="border border-gray-200 px-3 py-2 font-medium">Sr No</th>
                      <th className="border border-gray-200 px-3 py-2 font-medium">
                        Academic Year
                      </th>
                      <th className="border border-gray-200 px-3 py-2 font-medium">Receipt</th>
                      <th className="border border-gray-200 px-3 py-2 font-medium">Semester</th>
                      <th className="border border-gray-200 px-3 py-2 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleFees.map((fee, index) => (
                      <tr key={fee.id}>
                        <td className="border border-gray-200 px-3 py-2 text-gray-600">
                          {index + 1}.
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-gray-600">
                          {fee.feeStructure?.academicYear?.year ?? "—"}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 font-medium text-gray-800">
                          {fee.feeStructure?.receiptType?.name ?? "Fee"}
                          {fee.type === "INSTALLMENT" && fee.feeStructureInstallment?.name
                            ? ` (${fee.feeStructureInstallment.name})`
                            : ""}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-gray-600">
                          {String(fee.feeStructure?.class?.name ?? "—").replace(
                            /^SEMESTER\s*/i,
                            "",
                          )}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 font-semibold text-gray-800">
                          {formatInr(fee.totalPayable)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-rose-50/70">
                      <td
                        colSpan={4}
                        className="border border-gray-200 px-3 py-2 font-semibold text-gray-700"
                      >
                        Total Due
                      </td>
                      <td className="border border-gray-200 px-3 py-2 font-bold text-rose-600">
                        {formatInr(totalDue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Declarations — both must be ticked to unlock "Generate admit card".
                Native inputs on purpose: Radix checkbox/date typings broke the CI
                next build under the box's strict pnpm linking (same lesson as the
                footer buttons below). */}
            <div className="mt-5 space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Declaration
              </p>
              {/* The date input must NOT live inside the label, else clicking it
                toggles the checkbox instead of opening the picker. */}
              <div className="flex items-start gap-3 text-[13px] leading-relaxed text-gray-700">
                <input
                  id="fee-due-ack"
                  type="checkbox"
                  checked={acknowledgeChecked}
                  onChange={(e) => setAcknowledgeChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 flex-shrink-0 accent-indigo-600"
                />
                <span>
                  <label htmlFor="fee-due-ack" className="cursor-pointer">
                    I acknowledge that my Semester{" "}
                    <span className="font-semibold">{semesterDisplay}</span> enrolment fee is
                    pending and undertake to clear the dues by
                  </label>{" "}
                  <input
                    type="date"
                    value={clearByDate}
                    min={minDate}
                    max={maxDate}
                    onChange={(e) => setClearByDate(e.target.value)}
                    className="inline-block rounded-md border border-gray-300 bg-white px-2 py-0.5 text-[13px] focus:border-indigo-500 focus:outline-none"
                  />
                  <label htmlFor="fee-due-ack" className="cursor-pointer">
                    .
                  </label>
                </span>
              </div>
              <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-gray-700">
                <input
                  type="checkbox"
                  checked={consequenceChecked}
                  onChange={(e) => setConsequenceChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 flex-shrink-0 accent-indigo-600"
                />
                <span>
                  I understand that non-payment of my dues within the date specified by me above may
                  affect my bonafide student status and Calcutta University examination eligibility.
                </span>
              </label>
              {acknowledgeChecked && !dateValid && (
                <p className="pl-7 text-xs text-rose-600">
                  Please pick the date (within one month) by which you will clear the dues.
                </p>
              )}
            </div>

            {/* Plain Buttons (no AlertDialogCancel/Action): the Radix prop typings
                resolve differently under the box's strict pnpm linking and broke the
                CI next build twice. The dialog is controlled via open/onOpenChange,
                so native buttons are sufficient. */}
            <AlertDialogFooter className="mt-auto gap-2 pt-6 sm:justify-between">
              <Button
                variant="outline"
                className="mt-0"
                onClick={() => {
                  onOpenChange(false);
                  router.push("/dashboard/enrollment-fees");
                }}
              >
                Click to Pay
              </Button>
              <Button disabled={!canGenerate} onClick={handleGenerateAdmitCard}>
                {submitting ? "Saving..." : "Generate admit card"}
              </Button>
            </AlertDialogFooter>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
