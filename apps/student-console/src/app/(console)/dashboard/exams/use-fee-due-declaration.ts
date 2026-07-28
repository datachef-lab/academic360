"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { DeclarationMasterDto } from "@repo/db/dtos/academics";
import {
  fetchDeclarationState,
  submitDeclaration,
  type DeclarationContext,
  type SubmitDeclarationBody,
} from "@/services/declaration.service";
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

/**
 * Master-driven, DB-persisted declaration state for the fee-due dialog.
 *
 * Replaces the old localStorage flag: the statements come from the admin's
 * declaration master and "already declared" is a row keyed on the student's
 * PROMOTION, so it is device-independent and resets when they're promoted to
 * the next cycle.
 */
export function useFeeDueDeclaration(promotionId?: number, context: DeclarationContext = "FEES") {
  const [master, setMaster] = useState<DeclarationMasterDto | null>(null);
  const [declared, setDeclared] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!promotionId) {
      setMaster(null);
      setDeclared(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchDeclarationState(promotionId, context)
      .then((state) => {
        if (cancelled) return;
        setMaster(state.master);
        setDeclared(Boolean(state.declaration));
      })
      .catch(() => {
        // Never block the student on a lookup failure: with no master the
        // dialog simply doesn't gate them.
        if (!cancelled) {
          setMaster(null);
          setDeclared(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [promotionId, context]);

  /** Persists the agreement; the backend is idempotent per (master, promotion). */
  const submit = useCallback(
    async (statements: SubmitDeclarationBody["statements"]) => {
      if (!promotionId || !master?.id) return;
      await submitDeclaration({
        promotionId,
        declarationMasterId: master.id,
        statements,
      });
      setDeclared(true);
    },
    [promotionId, master?.id],
  );

  return useMemo(
    () => ({ master, declared, loading, submit }),
    [master, declared, loading, submit],
  );
}
