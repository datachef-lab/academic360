import type { SubjectResultStatusType } from "@/types/enums";

/** The passing rules for one board subject, as held in `board_subjects`. */
export type BoardSubjectMarksRule = {
  fullMarksTheory?: number | null;
  passingMarksTheory?: number | null;
  fullMarksPractical?: number | null;
  passingMarksPractical?: number | null;
};

/**
 * Derive a subject's result from its marks and its board's passing rules.
 *
 * The four enum values exist precisely to distinguish which component failed,
 * so this reports that rather than collapsing everything to PASS/FAIL.
 *
 * Two rules that were previously wrong:
 *
 * - A component only counts if the board actually examines it. Most mappings
 *   carry `fullMarksPractical = 0` (no practical paper), and a practical mark of
 *   0 against a passing mark of 0 must not be read as a failure.
 * - A passing mark of 0 is not a rule, it is missing data. `Number.isFinite(0)`
 *   is true, so the old check treated it as a live rule and `theory >= 0` passed
 *   everyone. Where the board has no stated pass mark we cannot judge, so the
 *   existing value is left alone.
 *
 * Returns `null` when there is nothing to judge on — the caller keeps whatever
 * is already stored rather than inventing a PASS.
 */
export function deriveResultStatus(
  theoryMarks: number | null | undefined,
  practicalMarks: number | null | undefined,
  rule: BoardSubjectMarksRule | null | undefined,
): SubjectResultStatusType | null {
  if (!rule) return null;

  const passTheory = Number(rule.passingMarksTheory ?? 0);
  const passPractical = Number(rule.passingMarksPractical ?? 0);
  const fullTheory = Number(rule.fullMarksTheory ?? 0);
  const fullPractical = Number(rule.fullMarksPractical ?? 0);

  // A component is examined only if it carries a full mark, and it is judgeable
  // only if the board states a pass mark for it.
  const theoryJudgeable = fullTheory > 0 && passTheory > 0;
  const practicalJudgeable = fullPractical > 0 && passPractical > 0;

  if (!theoryJudgeable && !practicalJudgeable) return null;

  const theoryFailed = theoryJudgeable && Number(theoryMarks ?? 0) < passTheory;
  const practicalFailed = practicalJudgeable && Number(practicalMarks ?? 0) < passPractical;

  if (theoryFailed && practicalFailed) return "FAIL";
  if (theoryFailed) return "FAIL IN THEORY";
  if (practicalFailed) return "FAIL IN PRACTICAL";
  return "PASS";
}
