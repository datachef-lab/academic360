"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { StudentDueFee } from "./use-student-due-fees";

/**
 * Derives the semester context of the outstanding dues from the fee classes
 * (e.g. classes ["SEMESTER II"] → key "SEMESTER II" and display "II" for the
 * "Semester {{X}}" copy). Multiple semesters join with "&".
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

const storageKey = (studentId: number, semesterLabel: string) =>
  `a360:fee-due-declared:${studentId}:${semesterLabel}`;

/**
 * UI-only "declared once" flag (per explicit product decision: the checkboxes and
 * date are presentation only — nothing is stored in the DB). Kept in localStorage
 * so, on this device/browser, the declaration dialog is not shown again for the
 * same student + dues context after they proceed once.
 */
export function useFeeDueDeclaration(studentId?: number, semesterLabel?: string) {
  const [declared, setDeclared] = useState(false);

  useEffect(() => {
    if (!studentId || !semesterLabel) {
      setDeclared(false);
      return;
    }
    try {
      setDeclared(window.localStorage.getItem(storageKey(studentId, semesterLabel)) === "1");
    } catch {
      setDeclared(false);
    }
  }, [studentId, semesterLabel]);

  const markDeclared = useCallback(() => {
    setDeclared(true);
    if (studentId && semesterLabel) {
      try {
        window.localStorage.setItem(storageKey(studentId, semesterLabel), "1");
      } catch {
        // Storage unavailable (private mode etc.) — the in-memory flag still
        // suppresses the dialog for this session.
      }
    }
  }, [studentId, semesterLabel]);

  return useMemo(() => ({ declared, markDeclared }), [declared, markDeclared]);
}
