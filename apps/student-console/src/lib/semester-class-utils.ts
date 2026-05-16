/**
 * Detects "first semester" from class / fee labels (e.g. "Semester I", "Sem 1", "Semester 1").
 * Used to hide career progression until Sem 2+ and to skip the CP step in enrolment for Sem 1.
 */
export function isFirstSemesterClassName(className: string | null | undefined): boolean {
  if (!className?.trim()) return false;
  const n = className.trim().toLowerCase();

  if (/\bsem(?:ester)?\.?\s*(?:2|3|4|5|6|7|8|9|10)\b/.test(n)) return false;
  if (/\bsem(?:ester)?\.?\s*(?:ii|iii|iv|v|vi|vii|viii|ix|x)\b/.test(n)) return false;
  if (/\b(?:2nd|second|third|fourth|fifth)\s+sem/.test(n)) return false;

  if (/\bsem(?:ester)?\.?\s*(?:1|i)\b/.test(n)) return true;
  if (/\b1\s*st\s+sem/.test(n)) return true;
  if (/\bfirst\s+semester\b/.test(n)) return true;

  return false;
}
