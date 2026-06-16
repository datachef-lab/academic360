import { SEMESTER_MIS } from "./mock-data";
import type { SemesterLabel } from "./semester-breakdown";

export type SemesterCell = {
  paid: number;
  notPaid: number;
  challanGenerated: number;
  total: number;
  collectionPct: number;
};

export type ProgramEnrollmentRow = {
  program: string;
  totalStudents: number;
  collectionPct: number;
  bySemester: Partial<Record<SemesterLabel, SemesterCell>>;
};

const SEM_ORDER: SemesterLabel[] = ["Sem I", "Sem IV", "Sem VI"];

export const ENROLLMENT_SEMESTERS: SemesterLabel[] = SEM_ORDER;

export function buildProgramEnrollmentMatrix(): ProgramEnrollmentRow[] {
  const semBlocks = SEM_ORDER.map((label) => {
    const block = SEMESTER_MIS.find((b) => b.semester.replace("Semester ", "Sem ") === label);
    return { label, block };
  });

  const programs = new Set<string>();
  SEMESTER_MIS.forEach((b) => b.programs.forEach((p) => programs.add(p.course)));

  return Array.from(programs)
    .sort()
    .map((program) => {
      const bySemester: Partial<Record<SemesterLabel, SemesterCell>> = {};
      let totalStudents = 0;
      let totalPaid = 0;

      semBlocks.forEach(({ label, block }) => {
        if (!block) return;
        const row = block.programs.find((p) => p.course === program);
        if (row) {
          const semPaidTotal = block.programs.reduce((s, p) => s + p.paid, 0);
          const challanGenerated = semPaidTotal
            ? Math.round(block.challanGenerated * (row.paid / semPaidTotal))
            : 0;
          bySemester[label] = {
            paid: row.paid,
            notPaid: row.notPaid,
            challanGenerated,
            total: row.total,
            collectionPct: row.collectionPct,
          };
          totalStudents += row.total;
          totalPaid += row.paid;
        }
      });

      return {
        program,
        totalStudents,
        collectionPct: totalStudents ? Math.round((totalPaid / totalStudents) * 100) : 0,
        bySemester,
      };
    });
}
