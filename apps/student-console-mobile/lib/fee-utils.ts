import type { StudentFeeMapping } from "@/services/fees-api";

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function normalizeRomanNumerals(text: string): string {
  return text.replace(/\b([ivxlcdm]+)\b/gi, (m) => m.toUpperCase());
}

function toSentenceCase(text: string): string {
  const lower = text.toLowerCase();
  const sentence = lower.replace(/\b\w/g, (ch) => ch.toUpperCase());
  return normalizeRomanNumerals(sentence);
}

export function isFeeMappingPaid(mapping: StudentFeeMapping): boolean {
  const status = String(mapping.paymentStatus ?? "").toUpperCase();
  if (status === "SUCCESS" || status === "COMPLETED" || status === "PAID") return true;
  const payable = Number(mapping.totalPayable ?? 0);
  const paid = Number(mapping.amountPaid ?? 0);
  return payable > 0 && paid >= payable;
}

export function feeMappingTitle(mapping: StudentFeeMapping): string {
  const receipt = mapping.feeStructure?.receiptType?.name
    ? toSentenceCase(mapping.feeStructure.receiptType.name)
    : undefined;
  const year = mapping.feeStructure?.academicYear?.year;
  const cls = mapping.feeStructure?.class?.name
    ? toSentenceCase(mapping.feeStructure.class.name)
    : undefined;
  const parts = [receipt, year, cls].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Fee";
}

export function feeMappingSubtitle(mapping: StudentFeeMapping): string {
  const num = mapping.feeStructureInstallment?.installmentNumber;
  return num ? `Installment ${num}` : "";
}

export function hasChallan(mapping: StudentFeeMapping): boolean {
  return Boolean(mapping.receiptNumber?.trim() && mapping.challanGeneratedAt);
}
