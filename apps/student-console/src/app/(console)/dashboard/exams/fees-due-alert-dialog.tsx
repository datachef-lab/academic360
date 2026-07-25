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

const feeSubtitle = (fee: StudentDueFee): string =>
  [
    fee.feeStructure?.class?.name,
    fee.feeStructure?.academicYear?.year,
    fee.type === "INSTALLMENT" && fee.feeStructureInstallment?.name
      ? fee.feeStructureInstallment.name
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

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
      <AlertDialogContent className="max-w-4xl overflow-hidden p-0">
        <div className="flex min-h-[560px] flex-col sm:flex-row">
          {/* Left: illustration filling the full height of the dialog (cover, not centered) */}
          <div className="relative hidden w-full flex-shrink-0 bg-violet-50 sm:block sm:w-[38%]">
            <Image
              src={`${process.env.NEXT_PUBLIC_URL}/fee-due-illustration.png`}
              alt="Pending fees illustration"
              fill
              priority
              unoptimized
              className="object-cover object-top"
            />
          </div>

          {/* Right: notification + dues + declarations */}
          <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-8">
            <AlertDialogHeader className="space-y-2 text-left sm:text-left">
              <AlertDialogTitle className="text-xl font-semibold text-rose-700">
                Important Notification:
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 text-sm leading-relaxed text-gray-700">
                <span className="block">
                  As per our records, your Semester{" "}
                  <span className="font-semibold">{semesterDisplay}</span> enrolment fee is not paid
                  despite multiple reminders sent to your Institutional Email ID and/or registered
                  mobile number. Consequently, you are currently not considered a bonafide student
                  of the College.
                </span>
                <span className="block">
                  Please note that payment of the Semester{" "}
                  <span className="font-semibold">{semesterDisplay}</span> enrolment fee is
                  mandatory to maintain your bonafide student status and to become eligible to
                  appear for the Calcutta University End-Semester Examination.
                </span>
                <span className="block font-medium">
                  Thus, you are advised to clear your outstanding dues at the earliest.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Breakdown of what's due */}
            {visibleFees.length > 0 && (
              <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50/60 p-3">
                <div className="mb-2 flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Outstanding Fees
                  </span>
                </div>
                <div className="max-h-28 space-y-2 overflow-y-auto">
                  {visibleFees.map((fee) => {
                    const subtitle = feeSubtitle(fee);
                    return (
                      <div
                        key={fee.id}
                        className="flex items-start justify-between gap-3 rounded-md bg-white/70 px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">
                            {fee.feeStructure?.receiptType?.name ?? "Fee"}
                          </p>
                          {subtitle && <p className="truncate text-xs text-gray-500">{subtitle}</p>}
                        </div>
                        <span className="whitespace-nowrap text-sm font-semibold text-rose-600">
                          {formatInr(fee.totalPayable)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-rose-100 pt-2">
                  <span className="text-sm font-semibold text-gray-700">Total Due</span>
                  <span className="text-base font-bold text-rose-600">{formatInr(totalDue)}</span>
                </div>
              </div>
            )}

            {/* Declarations — both must be ticked to unlock "Generate admit card".
                Native inputs on purpose: Radix checkbox/date typings broke the CI
                next build under the box's strict pnpm linking (same lesson as the
                footer buttons below). */}
            <div className="mt-4 space-y-3">
              {/* The date input must NOT live inside the label, else clicking it
                  toggles the checkbox instead of opening the picker. */}
              <div className="flex items-start gap-3 text-sm leading-relaxed text-gray-700">
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
                    className="inline-block rounded-md border border-gray-300 px-2 py-0.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  <label htmlFor="fee-due-ack" className="cursor-pointer">
                    .
                  </label>
                </span>
              </div>
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-gray-700">
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
            <AlertDialogFooter className="mt-auto pt-5 sm:justify-between">
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
