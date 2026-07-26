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
  /** Student's UID (e.g. 0804250001), shown under the title. */
  studentUid?: string;
  /** Called when the student proceeds, so the page can skip the dialog from now on. */
  onDeclared: () => void;
  /** Called when the student clicks "Generate admit card" — opens the Exam Schedule. */
  onProceed: () => void;
  /** Label for the proceed button; defaults to the admit-card wording. */
  proceedLabel?: string;
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
  studentUid,
  onDeclared,
  onProceed,
  proceedLabel = "Proceed to Download Admit Card",
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

  // Shared by both footers: pinned bar on desktop, end-of-content on mobile.
  // Plain Buttons (no AlertDialogCancel/Action): the Radix prop typings resolve
  // differently under the box's strict pnpm linking and broke the CI next build
  // twice. The dialog is controlled via open/onOpenChange, so native buttons
  // are sufficient.
  const actionButtons = (
    <>
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
        {proceedLabel}
      </Button>
    </>
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* Desktop (sm+): two-column layout — illustration column left, content right.
          Mobile: single column with a cover-style banner under the title. */}
      <AlertDialogContent className="w-[95vw] max-w-3xl overflow-hidden rounded-lg p-0 sm:max-w-6xl">
        <div className="flex max-h-[92vh] flex-col sm:min-h-[680px] sm:flex-row">
          {/* Left (desktop only): illustration shown whole over a soft gradient */}
          <div className="hidden w-full flex-shrink-0 flex-col items-center justify-center gap-6 border-gray-200 bg-gradient-to-b from-violet-50 via-white to-rose-50 sm:flex sm:w-[38%] sm:border-r sm:p-8">
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

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {/* Title stays put while the content below scrolls */}
            <AlertDialogHeader className="flex-shrink-0 border-b border-gray-100 px-6 pb-4 pt-6 text-left sm:px-8 sm:pt-6 sm:text-left">
              <AlertDialogTitle className="text-xl font-semibold text-gray-900">
                Semester Fee Reminder
              </AlertDialogTitle>
            </AlertDialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {/* Mobile only: illustration as a cover banner below the title, with a
                  light dark overlay so it reads as a backdrop */}
              <div className="relative h-48 w-full sm:hidden">
                <Image
                  src={`${process.env.NEXT_PUBLIC_URL}/fee-due-illustration.png`}
                  alt="Pending fees illustration"
                  fill
                  priority
                  unoptimized
                  className="object-cover object-center"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>

              <div className="flex flex-col px-6 pb-6 pt-4 sm:px-8 sm:pb-8">
                <AlertDialogDescription className="space-y-3 text-[13px] leading-relaxed text-gray-600">
                  <span className="block">
                    Our records show your{" "}
                    <span className="font-semibold italic text-gray-800">
                      Semester {semesterDisplay}
                    </span>{" "}
                    fee is still pending. You can still download your admit card now on confirming
                    the acknowledgment below.
                  </span>
                  <span className="block rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
                    Please treat this as a reminder, not a block. However, prolonged delay in
                    payment of fee may end up in deactivation of your UID and eventually an academic
                    hold on your further education.
                  </span>
                  <span className="block font-semibold text-emerald-800">
                    You are advised, in your interest, to clear the dues immediately to avoid any
                    inconvenience.
                  </span>
                </AlertDialogDescription>

                {/* Breakdown of what's due — plain table at its natural height, no inner
                scrolling in either direction: the whole right column is the single
                scroll area. Tighter cell padding/text on mobile keeps the five columns
                within the viewport. */}
                {studentUid && (
                  <p className="mt-5 text-xs font-medium text-gray-500">
                    UID: <span className="text-gray-700">{studentUid}</span>
                  </p>
                )}
                {visibleFees.length > 0 && (
                  <div className="mt-2 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full border-collapse break-words text-center text-xs sm:text-[13px]">
                      <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                        <tr>
                          {/* Short labels on mobile so every header stays on one line */}
                          <th className="whitespace-nowrap border border-gray-200 px-1.5 py-2 font-medium sm:px-3">
                            <span className="sm:hidden">#</span>
                            <span className="hidden sm:inline">Sr No</span>
                          </th>
                          <th className="whitespace-nowrap border border-gray-200 px-1.5 py-2 font-medium sm:px-3">
                            <span className="sm:hidden">A.Y.</span>
                            <span className="hidden sm:inline">Academic Year</span>
                          </th>
                          <th className="border border-gray-200 px-1.5 py-2 sm:px-3 font-medium">
                            Receipt
                          </th>
                          <th className="border border-gray-200 px-1.5 py-2 sm:px-3 font-medium">
                            Semester
                          </th>
                          <th className="border border-gray-200 px-1.5 py-2 sm:px-3 font-medium">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleFees.map((fee, index) => (
                          <tr key={fee.id}>
                            <td className="border border-gray-200 px-1.5 py-2 sm:px-3 text-gray-600">
                              {index + 1}.
                            </td>
                            <td className="border border-gray-200 px-1.5 py-2 sm:px-3 text-gray-600">
                              {fee.feeStructure?.academicYear?.year ?? "—"}
                            </td>
                            <td className="border border-gray-200 px-1.5 py-2 sm:px-3 font-medium text-gray-800">
                              {fee.feeStructure?.receiptType?.name ?? "Fee"}
                              {fee.type === "INSTALLMENT" && fee.feeStructureInstallment?.name
                                ? ` (${fee.feeStructureInstallment.name})`
                                : ""}
                            </td>
                            <td className="border border-gray-200 px-1.5 py-2 sm:px-3 text-gray-600">
                              {String(fee.feeStructure?.class?.name ?? "—").replace(
                                /^SEMESTER\s*/i,
                                "",
                              )}
                            </td>
                            <td className="border border-gray-200 px-1.5 py-2 sm:px-3 font-semibold text-gray-800">
                              {formatInr(fee.totalPayable)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-rose-50/70">
                          <td
                            colSpan={4}
                            className="border border-gray-200 px-1.5 py-2 sm:px-3 font-semibold text-gray-700"
                          >
                            Total Due
                          </td>
                          <td className="border border-gray-200 px-1.5 py-2 sm:px-3 font-bold text-rose-600">
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
                <div className="mt-5 flex-shrink-0 space-y-3 rounded-lg border border-indigo-100 bg-indigo-50/40 p-4">
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
                      I acknowledge that my{" "}
                      <span className="font-semibold italic">Semester {semesterDisplay}</span> fee
                      is currently pending.
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-relaxed text-gray-700">
                    <input
                      type="checkbox"
                      checked={consequenceChecked}
                      onChange={(e) => setConsequenceChecked(e.target.checked)}
                      className="mt-1 h-4 w-4 flex-shrink-0 accent-indigo-600"
                    />
                    <span>I confirm I will clear this amount at the earliest.</span>
                  </label>
                </div>
                {/* Mobile: buttons scroll with the content at its end */}
                <AlertDialogFooter className="mt-6 gap-2 sm:hidden">
                  {actionButtons}
                </AlertDialogFooter>
                {/* Contact note for payment issues */}
                <p className="mt-5 border-t border-dashed border-gray-200 pt-4 text-xs leading-relaxed text-gray-500">
                  You may reach us on any working day between{" "}
                  <span className="font-semibold text-gray-700">10:30 AM and 1:30 PM</span> at{" "}
                  <span className="font-semibold text-gray-700">
                    Room No. 424, System Control Room
                  </span>
                  , college campus, with any issues while making the fee payment.
                </p>
              </div>
            </div>

            {/* Desktop: static footer bar below the scroll area */}
            <AlertDialogFooter className="hidden flex-shrink-0 gap-2 border-t border-gray-100 px-6 py-4 sm:flex sm:justify-between sm:px-8">
              {actionButtons}
            </AlertDialogFooter>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
