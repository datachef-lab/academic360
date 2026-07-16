/**
 * Uppercases lowercase Roman numeral tokens (i, ii, …, xii) when they sit on
 * a word boundary, leaving the rest of the string untouched.
 *
 *   "Semester ii CU (CCF) Science" → "Semester II CU (CCF) Science"
 *   "Semester I Arts"              → "Semester I Arts"  (no-op, already upper)
 */
const ROMAN_TOKEN = /\b(i{1,3}|iv|v|vi{1,3}|vi|ix|xi{1,2}|x)\b/g;

export function uppercaseRomanNumerals(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(ROMAN_TOKEN, (match) => match.toUpperCase());
}
