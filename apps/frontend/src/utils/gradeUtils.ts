export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function calculateGrade(percentage: number): string {
  if (percentage >= 80) return "A+";
  if (percentage >= 70) return "A";
  if (percentage >= 60) return "B";
  if (percentage >= 50) return "C";
  if (percentage >= 40) return "D";
  return "F";
}

export function calculateStatus(percentage: number): string {
  return percentage >= 40 ? "P" : "F";
}

export function calculateCreditPoints(marksObtained: number, credit: number): number {
  const percentage = (marksObtained / 100) * 100;
  let gradePoint = 0;

  if (percentage >= 80) gradePoint = 4.0;
  else if (percentage >= 70) gradePoint = 3.5;
  else if (percentage >= 60) gradePoint = 3.0;
  else if (percentage >= 50) gradePoint = 2.5;
  else if (percentage >= 40) gradePoint = 2.0;
  else gradePoint = 0;

  return gradePoint * credit;
}

export function formatNumber(num: number): string {
  return num.toFixed(2);
} 