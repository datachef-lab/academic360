"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isCasualReceipt, type StudentDueFee } from "./use-student-due-fees";

/**
 * Last date by which students must clear their dues. Shown in the alert below.
 * Change this single constant to update the deadline everywhere.
 */
export const FEES_LAST_DATE = "14 August, 2026";

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

interface FeesDueAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dueFees: StudentDueFee[];
  /** Called when the student clicks "Okay" — proceeds to open the Exam Schedule. */
  onProceed: () => void;
}

/**
 * Shown before the Exam Schedule dialog when the student has outstanding fees.
 * Lists the due fees + the payment deadline; "Okay" continues to the schedule,
 * "View Fees" takes them to the Enrolment & Fees page to pay.
 */
export function FeesDueAlertDialog({
  open,
  onOpenChange,
  dueFees,
  onProceed,
}: FeesDueAlertDialogProps) {
  const router = useRouter();

  // Belt-and-suspenders: never render casual receipts here, and compute the total from
  // the same visible list so the two always agree (even if upstream data is stale).
  const visibleFees = dueFees.filter((fee) => !isCasualReceipt(fee));
  const totalDue = visibleFees.reduce((sum, fee) => sum + Number(fee.totalPayable || 0), 0);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl overflow-hidden p-0">
        <div className="flex min-h-[560px] flex-col sm:flex-row">
          {/* Left: illustration filling the full height of the dialog (cover, not centered) */}
          <div className="relative h-56 w-full flex-shrink-0 bg-violet-50 sm:h-auto sm:w-[45%]">
            <Image
              src={`${process.env.NEXT_PUBLIC_URL}/fee-details-1.png`}
              alt="Fees payment details"
              fill
              priority
              unoptimized
              className="object-cover object-top"
            />
          </div>

          {/* Right: message + outstanding dues */}
          <div className="flex min-w-0 flex-1 flex-col p-6 sm:p-8">
            <AlertDialogHeader className="space-y-2 text-left sm:text-left">
              <AlertDialogTitle className="text-xl font-semibold">
                Pending Fees — Please Clear Your Dues
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed">
                You have outstanding fees on your account. Kindly complete the payment before{" "}
                <span className="font-semibold text-rose-600">{FEES_LAST_DATE}</span> to avoid any
                disruption to your examinations and admit card download.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Breakdown of what's due */}
            {visibleFees.length > 0 && (
              <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50/60 p-3">
                <div className="mb-2 flex items-center gap-2 text-rose-700">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span className="text-xs font-medium uppercase tracking-wide">
                    Outstanding Fees
                  </span>
                </div>
                <div className="max-h-44 space-y-2 overflow-y-auto">
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

            <AlertDialogFooter className="mt-auto pt-6 sm:justify-between">
              <AlertDialogCancel
                onClick={() => router.push("/dashboard/enrollment-fees")}
                className="mt-0"
              >
                View Fees &amp; Pay
              </AlertDialogCancel>
              <AlertDialogAction onClick={onProceed}>Okay, Continue</AlertDialogAction>
            </AlertDialogFooter>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
