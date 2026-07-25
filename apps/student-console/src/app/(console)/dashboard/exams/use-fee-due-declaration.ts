"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { axiosInstance } from "@/lib/utils";
import type { StudentDueFee } from "./use-student-due-fees";

/**
 * Row from `student_fee_due_declarations`: the student's one-time acknowledgement of
 * their pending semester dues (made on the exam screen). Once it exists for the current
 * dues context, the declaration dialog is never shown again.
 */
export type FeeDueDeclaration = {
  id: number;
  studentId: number;
  semesterLabel: string;
  undertakingClearDate: string; // yyyy-mm-dd
  createdAt?: string;
  updatedAt?: string;
};

/**
 * Derives the semester context of the outstanding dues from the fee classes
 * (e.g. classes ["SEMESTER II"] → label "SEMESTER II" for the DB key and
 * display "II" for the "Semester {{X}}" copy). Multiple semesters join with "&".
 */
export function dueFeesSemesterContext(dueFees: StudentDueFee[]): {
  label: string;
  display: string;
} {
  const names = Array.from(
    new Set(
      dueFees
        .map((fee) =>
          String(fee.feeStructure?.class?.name ?? "")
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean),
    ),
  ).sort();
  if (names.length === 0) return { label: "CURRENT", display: "current" };
  return {
    label: names.join(" & "),
    display: names.map((n) => n.replace(/^SEMESTER\s*/i, "").trim() || n).join(" & "),
  };
}

export async function submitFeeDueDeclaration(input: {
  studentId: number;
  semesterLabel: string;
  undertakingClearDate: string; // yyyy-mm-dd
}): Promise<FeeDueDeclaration> {
  const { data } = await axiosInstance.post<{ payload?: FeeDueDeclaration }>(
    `/api/v1/fees/due-declarations`,
    input,
  );
  if (!data?.payload) throw new Error("Declaration was not saved");
  return data.payload;
}

/**
 * Looks up whether the student has already declared for the given dues context.
 * `declaration === null` + `loaded === true` ⇒ not declared yet (show the dialog);
 * a non-null declaration ⇒ skip the dialog forever.
 */
export function useFeeDueDeclaration(studentId?: number, semesterLabel?: string) {
  const [declaration, setDeclaration] = useState<FeeDueDeclaration | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!studentId || !semesterLabel) {
      setDeclaration(null);
      setLoaded(false);
      return;
    }
    let cancelled = false;
    setLoaded(false);
    (async () => {
      try {
        const { data } = await axiosInstance.get<{ payload?: FeeDueDeclaration | null }>(
          `/api/v1/fees/due-declarations/student/${studentId}`,
          { params: { semesterLabel } },
        );
        if (!cancelled) setDeclaration(data?.payload ?? null);
      } catch {
        // On lookup failure fall back to "not declared" — worst case the student is
        // asked to declare again, which the backend stores idempotently.
        if (!cancelled) setDeclaration(null);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, semesterLabel]);

  const markDeclared = useCallback((row: FeeDueDeclaration) => {
    setDeclaration(row);
    setLoaded(true);
  }, []);

  return useMemo(
    () => ({ declaration, loaded, markDeclared }),
    [declaration, loaded, markDeclared],
  );
}
