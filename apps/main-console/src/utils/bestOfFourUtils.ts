import type { StudentAcademicSubjectsDto } from "@repo/db/dtos/admissions";

/**
 * Calculate Best of Four percentage from subject marks
 * Best of Four is typically calculated by taking the best 4 subjects
 * and calculating the percentage based on their total marks
 */
export function calculateBestOfFour(subjects: StudentAcademicSubjectsDto[]): number | null {
  if (!subjects || subjects.length === 0) {
    return null;
  }

  // Filter subjects that have valid marks and are not failed
  const validSubjects = subjects
    .map((subject) => {
      const totalMarks = Number((subject as unknown as { totalMarks?: number }).totalMarks ?? 0);
      const resultStatus = (subject as unknown as { resultStatus?: string }).resultStatus;

      // Only include subjects that are passed and have valid marks
      if (totalMarks > 0 && resultStatus === "PASS") {
        return {
          totalMarks,
          subject,
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{ totalMarks: number; subject: StudentAcademicSubjectsDto }>;

  if (validSubjects.length === 0) {
    return null;
  }

  // Sort by total marks in descending order to get the best subjects
  validSubjects.sort((a, b) => b.totalMarks - a.totalMarks);

  // Take the best 4 subjects (or all if less than 4)
  const bestSubjects = validSubjects.slice(0, 4);

  // Calculate total marks for best 4 subjects
  const totalBestMarks = bestSubjects.reduce((sum, item) => sum + item.totalMarks, 0);

  // Calculate percentage (assuming each subject has a maximum of 100 marks)
  // This is a simplified calculation - in reality, you might need to consider
  // the actual full marks for each subject from the board subject configuration
  const maxPossibleMarks = bestSubjects.length * 100;
  const percentage = (totalBestMarks / maxPossibleMarks) * 100;

  return Math.round(percentage * 100) / 100; // Round to 2 decimal places
}

/**
 * Calculate Best of Four with custom full marks for each subject
 * This is more accurate as it considers the actual full marks for each subject
 */
export function calculateBestOfFourWithFullMarks(
  subjects: StudentAcademicSubjectsDto[],
  boardSubjects: Array<{
    id: number;
    name: string;
    passingMarksTheory: number;
    passingMarksPractical: number;
    fullMarksTheory: number;
    fullMarksPractical: number;
  }>,
): number | null {
  if (!subjects || subjects.length === 0) {
    return null;
  }

  // Filter subjects that have valid marks and are not failed
  const validSubjects = subjects
    .map((subject) => {
      const totalMarks = Number((subject as unknown as { totalMarks?: number }).totalMarks ?? 0);
      const resultStatus = (subject as unknown as { resultStatus?: string }).resultStatus;
      const boardSubjectId = Number(
        (subject as unknown as { boardSubjectId?: number }).boardSubjectId ??
          (subject as unknown as { boardSubject?: { id?: number } }).boardSubject?.id ??
          0,
      );

      // Find the board subject configuration
      const boardSubject = boardSubjects.find((bs) => Number(bs.id) === boardSubjectId);
      const fullMarks = boardSubject
        ? Number(boardSubject.fullMarksTheory ?? 0) + Number(boardSubject.fullMarksPractical ?? 0)
        : 100; // Default to 100 if not found

      // Only include subjects that are passed and have valid marks
      if (totalMarks > 0 && resultStatus === "PASS" && fullMarks > 0) {
        return {
          totalMarks,
          fullMarks,
          subject,
        };
      }
      return null;
    })
    .filter(Boolean) as Array<{ totalMarks: number; fullMarks: number; subject: StudentAcademicSubjectsDto }>;

  if (validSubjects.length === 0) {
    return null;
  }

  // Sort by percentage in descending order to get the best subjects
  validSubjects.sort((a, b) => {
    const percentageA = (a.totalMarks / a.fullMarks) * 100;
    const percentageB = (b.totalMarks / b.fullMarks) * 100;
    return percentageB - percentageA;
  });

  // Take the best 4 subjects (or all if less than 4)
  const bestSubjects = validSubjects.slice(0, 4);

  // Calculate weighted average percentage
  const totalMarks = bestSubjects.reduce((sum, item) => sum + item.totalMarks, 0);
  const totalFullMarks = bestSubjects.reduce((sum, item) => sum + item.fullMarks, 0);

  if (totalFullMarks === 0) {
    return null;
  }

  const percentage = (totalMarks / totalFullMarks) * 100;
  return Math.round(percentage * 100) / 100; // Round to 2 decimal places
}
