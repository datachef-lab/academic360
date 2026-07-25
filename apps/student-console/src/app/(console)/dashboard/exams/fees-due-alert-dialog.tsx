"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

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

const formatInr = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

interface FeesDueAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dueFees: StudentDueFee[];
  /** Human form for the "Semester {{X}}" copy, e.g. "II". */
  semesterDisplay: string;
  /** Called when the student proceeds, so the page can skip the dialog from now on. */
  onDeclared: () => void;
  /** Called when the student clicks "Generate admit card" — opens the Exam Schedule. */
  onProceed: () => void;
}

/**
 * "Important Notification" declaration shown before the Exam Schedule when the student
 * has outstanding semester dues. The student must tick both declarations before
 * "Generate admit card" unlocks. The checkboxes are UI-only (explicit product
 * decision — nothing is stored in the DB); "declared once" is remembered client-side
 * so the dialog is not shown again on this device.
 */
export function FeesDueAlertDialog({
  open,
  onOpenChange,
  dueFees,
  semesterDisplay,
  onDeclared,
  onProceed,
}: FeesDueAlertDialogProps) {
  const router = useRouter();

  const [acknowledgeChecked, setAcknowledgeChecked] = useState(false);
  const [consequenceChecked, setConsequenceChecked] = useState(false);

  // Belt-and-suspenders: never render casual receipts here, and compute the total from
  // the same visible list so the two always agree (even if upstream data is stale).
  const visibleFees = dueFees.filter((fee) => !isCasualReceipt(fee));
  const totalDue = visibleFees.reduce((sum, fee) => sum + Number(fee.totalPayable || 0), 0);

  const canGenerate = acknowledgeChecked && consequenceChecked;

  const handleGenerateAdmitCard = () => {
    if (!canGenerate) return;
    onDeclared();
    onProceed();
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
                  fee is not paid despite multiple reminders sent to you previously.{" "}
                  <span className="font-semibold text-gray-800">
                    Consequently, you are currently not considered a bonafide student of the
                    College.
                  </span>
                </span>
                <span className="block">
                  Please note that completing enrolment procedure including payment of the Semester{" "}
                  <span className="font-semibold text-gray-800">{semesterDisplay}</span> fee is
                  mandatory to appear for the Calcutta University End-Semester Examination.
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
              <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-gray-700">
                <input
                  type="checkbox"
                  checked={acknowledgeChecked}
                  onChange={(e) => setAcknowledgeChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 flex-shrink-0 accent-indigo-600"
                />
                <span>
                  I acknowledge that my Semester{" "}
                  <span className="font-semibold">{semesterDisplay}</span> enrolment fee is pending
                  and undertake to clear the dues as early as possible.
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-gray-700">
                <input
                  type="checkbox"
                  checked={consequenceChecked}
                  onChange={(e) => setConsequenceChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 flex-shrink-0 accent-indigo-600"
                />
                <span>
                  I understand that non-payment of my dues may affect my bonafide student status and
                  Calcutta University examination eligibility.
                </span>
              </label>
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
                Generate admit card
              </Button>
            </AlertDialogFooter>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
