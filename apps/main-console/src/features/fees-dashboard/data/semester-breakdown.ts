import { SEMESTER_MIS } from "./mock-data";

export type SemesterLabel = "Sem I" | "Sem IV" | "Sem VI";

export interface SemesterSummaryRow {
  semester: SemesterLabel;
  receivable: number;
  collected: number;
  pending: number;
  eligibleStudents: number;
  challansGenerated: number;
  challanPending: number;
  receiptsIssued: number;
  onlineCollected: number;
  cashCollected: number;
  chequeCollected: number;
  structuresCount: number;
  transactionsCount: number;
}

export const SEMESTER_SUMMARY: SemesterSummaryRow[] = SEMESTER_MIS.map((b) => ({
  semester: b.semester.replace("Semester ", "Sem ") as SemesterLabel,
  receivable: b.receivable,
  collected: b.received,
  pending: b.pending,
  eligibleStudents: b.programs.reduce((s, p) => s + p.total, 0),
  challansGenerated: b.challanGenerated,
  challanPending: b.challanNotGenerated,
  receiptsIssued: Math.round(b.received / 36_500),
  onlineCollected: Math.round(b.received * 0.94),
  cashCollected: Math.round(b.received * 0.04),
  chequeCollected: Math.round(b.received * 0.02),
  structuresCount: b.semester === "Sem I" ? 14 : b.semester === "Sem IV" ? 16 : 12,
  transactionsCount: Math.round(b.received / 42_000),
}));

export interface SlabSemesterRow {
  slabName: string;
  semester: SemesterLabel;
  eligible: number;
  fullyPaid: number;
  partialUnpaid: number;
  challanGenerated: number;
}

const SLABS = ["Slab A", "Slab B", "Slab C", "Slab D", "Slab M", "Slab S"] as const;
const SEMS: SemesterLabel[] = ["Sem I", "Sem IV", "Sem VI"];

/** Mock: distribute slab totals across semesters */
export const SLAB_BY_SEMESTER: SlabSemesterRow[] = SLABS.flatMap((slabName, si) => {
  const base = [4120, 2890, 1560, 890, 312, 251][si] ?? 200;
  const weights = [0.38, 0.42, 0.2];
  return SEMS.map((semester, i) => {
    const eligible = Math.round(base * (weights[i] ?? 0));
    const fullyPaid = Math.round(eligible * (0.72 + si * 0.02));
    const partialUnpaid = eligible - fullyPaid;
    const challanGenerated = Math.min(eligible, fullyPaid + Math.round(partialUnpaid * 0.65));
    return {
      slabName,
      semester,
      eligible,
      fullyPaid,
      partialUnpaid,
      challanGenerated,
    };
  });
});
